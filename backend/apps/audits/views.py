import io
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from .models import AuditSession, AuditItem
from .serializers import AuditSessionSerializer, AuditItemSerializer
from apps.inventory.models import StockItem, StockMovement
from apps.common.utils import generate_code, format_inr
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class AuditSessionViewSet(viewsets.ModelViewSet):
    serializer_class = AuditSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['audit_number', 'warehouse__name', 'notes']
    ordering_fields = ['scheduled_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return AuditSession.objects.none()
        return AuditSession.objects.filter(warehouse__organization=user.organization).select_related(
            'warehouse', 'zone', 'auditor', 'supervisor'
        ).prefetch_related('items__product', 'items__bin')

    def create(self, request, *args, **kwargs):
        warehouse_id = request.data.get('warehouse')
        zone_id = request.data.get('zone')
        audit_type = request.data.get('audit_type', 'cycle_count')
        is_blind = request.data.get('is_blind_count', True)
        notes = request.data.get('notes', '')

        with transaction.atomic():
            audit = AuditSession.objects.create(
                audit_number=generate_code('AUD'),
                warehouse_id=warehouse_id,
                zone_id=zone_id,
                audit_type=audit_type,
                status='scheduled',
                is_blind_count=is_blind,
                scheduled_date=request.data.get('scheduled_date', timezone.now().date()),
                auditor=request.user,
                notes=notes
            )

            # Freeze system snapshot into AuditItems
            stock_items_query = StockItem.objects.filter(warehouse_id=warehouse_id)
            if zone_id:
                stock_items_query = stock_items_query.filter(bin__shelf__rack__aisle__zone_id=zone_id)

            for si in stock_items_query:
                AuditItem.objects.create(
                    audit_session=audit,
                    product=si.product,
                    bin=si.bin,
                    system_quantity=si.quantity_on_hand,
                    physical_quantity=si.quantity_on_hand if not is_blind else 0,
                    unit_cost=si.unit_cost,
                    status='pending'
                )

        return Response(AuditSessionSerializer(audit).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def record_count(self, request, pk=None):
        audit = self.get_object()
        item_id = request.data.get('audit_item_id')
        physical_qty = int(request.data.get('physical_quantity', 0))
        reason = request.data.get('discrepancy_reason', '')

        try:
            item = audit.items.get(id=item_id)
        except AuditItem.DoesNotExist:
            return Response({'error': 'Audit item not found'}, status=status.HTTP_404_NOT_FOUND)

        item.physical_quantity = physical_qty
        item.discrepancy_reason = reason
        item.status = 'counted'
        item.save()

        # Update audit status to in_progress if still scheduled
        if audit.status == 'scheduled':
            audit.status = 'in_progress'
            audit.started_at = timezone.now()
            audit.save()

        # Check if all items counted
        if not audit.items.filter(status='pending').exists():
            audit.status = 'pending_review'
            audit.completed_at = timezone.now()
            audit.save()

        return Response(AuditItemSerializer(item).data)

    @action(detail=True, methods=['post'])
    def approve_and_reconcile(self, request, pk=None):
        audit = self.get_object()
        if request.user.role not in ['super_admin', 'org_owner', 'warehouse_manager']:
            return Response({'error': 'Only Warehouse Managers or Admins can approve audit reconciliations.'}, status=status.HTTP_403_FORBIDDEN)

        if audit.status == 'approved':
            return Response({'error': 'Audit session has already been reconciled.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for item in audit.items.all():
                if item.variance != 0:
                    stock_item, _ = StockItem.objects.select_for_update().get_or_create(
                        warehouse=audit.warehouse,
                        bin=item.bin,
                        product=item.product,
                        defaults={'unit_cost': item.unit_cost}
                    )

                    prev_bal = stock_item.quantity_on_hand
                    stock_item.quantity_on_hand = item.physical_quantity
                    stock_item.save()

                    # Create auditable StockMovement
                    StockMovement.objects.create(
                        movement_id=generate_code('MOV'),
                        product=item.product,
                        warehouse=audit.warehouse,
                        bin=item.bin,
                        movement_type='stock_adjustment',
                        quantity=item.variance,
                        previous_balance=prev_bal,
                        resulting_balance=item.physical_quantity,
                        unit_cost=item.unit_cost,
                        reference_document=audit.audit_number,
                        reason=f"Audit Reconciliation for {audit.audit_number}: {item.discrepancy_reason or 'Physical count variance approved'}",
                        created_by=request.user
                    )

                item.status = 'reconciled'
                item.save()

            audit.status = 'approved'
            audit.supervisor = request.user
            audit.save()

        return Response(AuditSessionSerializer(audit).data)

    @action(detail=True, methods=['get'])
    def download_report(self, request, pk=None):
        audit = self.get_object()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading1'],
            textColor=colors.HexColor('#14532D'),
            fontSize=18,
            spaceAfter=4
        )

        org = audit.warehouse.organization
        elements.append(Paragraph(f"<b>{org.name}</b>", header_style))
        elements.append(Paragraph(f"Warehouse Stock Audit &amp; Reconciliation Report", ParagraphStyle('Sub', fontSize=14, textColor=colors.HexColor('#15803D'))))
        elements.append(Spacer(1, 10))

        meta_data = [
            [f"Audit Ref: {audit.audit_number}", f"Scheduled Date: {audit.scheduled_date}"],
            [f"Warehouse: {audit.warehouse.name} ({audit.warehouse.code})", f"Status: {audit.get_status_display()}"],
            [f"Auditor: {audit.auditor.get_full_name() or audit.auditor.email}", f"Supervisor: {audit.supervisor.get_full_name() if audit.supervisor else 'Pending'}"],
            [f"Total Items: {audit.total_items_count}", f"Total Net Variance: {audit.total_variance_units:+d} units ({format_inr(audit.total_variance_value)})"]
        ]
        meta_table = Table(meta_data, colWidths=[270, 250])
        meta_table.setStyle(TableStyle([
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1F2933')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        items_data = [['#', 'SKU / Product', 'System Qty', 'Counted Qty', 'Variance', 'Cost (INR)', 'Variance Val (INR)']]
        for idx, item in enumerate(audit.items.all(), 1):
            items_data.append([
                str(idx),
                f"{item.product.sku}\n{item.product.name[:25]}",
                str(item.system_quantity),
                str(item.physical_quantity),
                f"{item.variance:+d}",
                format_inr(item.unit_cost),
                format_inr(item.variance_value)
            ])

        items_table = Table(items_data, colWidths=[25, 205, 55, 55, 50, 65, 65])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#14532D')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<i>Approved adjustments have updated the immutable StockMovement ledger.</i>", styles['Italic']))

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="audit_{audit.audit_number}.pdf"'
        return response
