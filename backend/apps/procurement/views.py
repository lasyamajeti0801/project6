import io
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from .models import PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptItem
from .serializers import PurchaseOrderSerializer, GoodsReceiptNoteSerializer
from apps.inventory.models import StockItem, StockMovement
from apps.common.utils import generate_code, format_inr
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['po_number', 'supplier__name', 'notes']
    ordering_fields = ['order_date', 'total_amount', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return PurchaseOrder.objects.none()
        qs = PurchaseOrder.objects.filter(organization=user.organization).select_related(
            'supplier', 'destination_warehouse', 'created_by', 'approved_by'
        ).prefetch_related('items__product')
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        po = self.get_object()
        if po.status != 'draft':
            return Response({'error': 'Only draft purchase orders can be submitted for approval.'}, status=status.HTTP_400_BAD_REQUEST)
        po.status = 'pending_approval'
        po.save()
        return Response(PurchaseOrderSerializer(po).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        po = self.get_object()
        if request.user.role not in ['super_admin', 'org_owner', 'procurement_officer', 'warehouse_manager']:
            return Response({'error': 'You do not have permission to approve purchase orders.'}, status=status.HTTP_403_FORBIDDEN)
        
        if po.status not in ['draft', 'pending_approval']:
            return Response({'error': f"Cannot approve PO in status: {po.status}"}, status=status.HTTP_400_BAD_REQUEST)
            
        po.status = 'approved'
        po.approved_by = request.user
        po.save()
        return Response(PurchaseOrderSerializer(po).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        po = self.get_object()
        reason = request.data.get('reason', 'Rejected by procurement manager')
        po.status = 'cancelled'
        po.rejection_reason = reason
        po.save()
        return Response(PurchaseOrderSerializer(po).data)

    @action(detail=True, methods=['post'])
    def send_to_supplier(self, request, pk=None):
        po = self.get_object()
        if po.status != 'approved':
            return Response({'error': 'Only approved POs can be sent to supplier.'}, status=status.HTTP_400_BAD_REQUEST)
        po.status = 'sent'
        po.save()
        return Response(PurchaseOrderSerializer(po).data)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        po = self.get_object()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        # Forest green headers
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading1'],
            textColor=colors.HexColor('#14532D'),
            fontSize=18,
            spaceAfter=6
        )

        org = po.organization
        elements.append(Paragraph(f"<b>{org.name}</b>", header_style))
        elements.append(Paragraph(f"GSTIN: {org.gstin or 'N/A'} | State: {org.state} | {org.city}", styles['Normal']))
        elements.append(Spacer(1, 15))
        
        elements.append(Paragraph(f"<b>PURCHASE ORDER: {po.po_number}</b>", ParagraphStyle('Sub', fontSize=14, textColor=colors.HexColor('#15803D'))))
        elements.append(Spacer(1, 10))

        # Meta table
        meta_data = [
            [f"Supplier: {po.supplier.name}", f"Date: {po.order_date}"],
            [f"Contact: {po.supplier.contact_person} ({po.supplier.phone_number})", f"Expected Delivery: {po.expected_delivery_date}"],
            [f"Destination: {po.destination_warehouse.name}", f"Payment Terms: {po.payment_terms}"],
            [f"Supplier GSTIN: {po.supplier.gstin or 'Unregistered'}", f"Status: {po.get_status_display()}"]
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

        # Items Table
        items_data = [['#', 'SKU / Product Description', 'HSN', 'Qty', 'Unit Cost (INR)', 'GST %', 'Total (INR)']]
        for idx, item in enumerate(po.items.all(), 1):
            items_data.append([
                str(idx),
                f"{item.product.sku}\n{item.product.name}",
                item.product.hsn_code or '-',
                str(item.quantity_ordered),
                format_inr(item.unit_cost),
                f"{item.gst_rate}%",
                format_inr(item.total_cost)
            ])

        items_table = Table(items_data, colWidths=[25, 205, 55, 45, 75, 45, 75])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#14532D')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 15))

        # Totals Table
        totals_data = [
            ['Subtotal:', format_inr(po.subtotal)],
            ['Applicable GST (CGST/SGST/IGST):', format_inr(po.tax_amount)],
            ['Freight / Shipping Charges:', format_inr(po.freight_charges)],
            ['Grand Total (INR):', format_inr(po.total_amount)],
        ]
        totals_table = Table(totals_data, colWidths=[400, 125])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
            ('FONTNAME', (0,3), (-1,3), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0,3), (-1,3), colors.HexColor('#14532D')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<i>This is a computer-generated document issued by StockPilot Warehouse Management System.</i>", styles['Italic']))

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{po.po_number}.pdf"'
        return response

class GoodsReceiptNoteViewSet(viewsets.ModelViewSet):
    serializer_class = GoodsReceiptNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return GoodsReceiptNote.objects.none()
        return GoodsReceiptNote.objects.filter(purchase_order__organization=user.organization).select_related(
            'purchase_order', 'received_warehouse', 'received_by'
        ).prefetch_related('items__product')

    def create(self, request, *args, **kwargs):
        po_id = request.data.get('purchase_order')
        items_data = request.data.get('items', [])
        
        try:
            po = PurchaseOrder.objects.get(id=po_id, organization=request.user.organization)
        except PurchaseOrder.DoesNotExist:
            return Response({'error': 'Invalid Purchase Order'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            grn = GoodsReceiptNote.objects.create(
                grn_number=generate_code('GRN'),
                purchase_order=po,
                received_warehouse=po.destination_warehouse,
                received_date=request.data.get('received_date', timezone.now().date()),
                supplier_invoice_number=request.data.get('supplier_invoice_number', ''),
                supplier_invoice_date=request.data.get('supplier_invoice_date', None),
                e_way_bill_number=request.data.get('e_way_bill_number', ''),
                received_by=request.user,
                notes=request.data.get('notes', '')
            )

            all_received = True
            for item_data in items_data:
                po_item = PurchaseOrderItem.objects.select_for_update().get(id=item_data['po_item'])
                qty_rec = int(item_data['quantity_received'])
                qty_damaged = int(item_data.get('quantity_damaged', 0))
                bin_id = item_data.get('target_bin')
                batch_number = item_data.get('batch_number')
                expiry_date = item_data.get('expiry_date')

                GoodsReceiptItem.objects.create(
                    grn=grn,
                    po_item=po_item,
                    product=po_item.product,
                    quantity_received=qty_rec,
                    quantity_damaged=qty_damaged,
                    target_bin_id=bin_id,
                    batch_number=batch_number,
                    expiry_date=expiry_date
                )

                po_item.quantity_received += qty_rec
                po_item.save()

                if po_item.quantity_received < po_item.quantity_ordered:
                    all_received = False

                # Update physical stock item in destination warehouse
                stock_item, _ = StockItem.objects.select_for_update().get_or_create(
                    warehouse=po.destination_warehouse,
                    bin_id=bin_id,
                    product=po_item.product,
                    batch_number=batch_number,
                    defaults={'unit_cost': po_item.unit_cost, 'expiry_date': expiry_date}
                )

                prev_balance = stock_item.quantity_on_hand
                usable_received = max(0, qty_rec - qty_damaged)
                stock_item.quantity_on_hand += usable_received
                if qty_damaged > 0:
                    stock_item.quantity_quarantined += qty_damaged
                stock_item.save()

                # Record immutable StockMovement ledger entry
                StockMovement.objects.create(
                    movement_id=generate_code('MOV'),
                    product=po_item.product,
                    warehouse=po.destination_warehouse,
                    bin_id=bin_id,
                    batch_number=batch_number,
                    movement_type='purchase_receipt',
                    quantity=usable_received,
                    previous_balance=prev_balance,
                    resulting_balance=stock_item.quantity_on_hand,
                    unit_cost=po_item.unit_cost,
                    reference_document=grn.grn_number,
                    reason=f"Goods Receipt Note against {po.po_number}",
                    created_by=request.user
                )

            po.status = 'received' if all_received else 'partially_received'
            po.save(update_fields=['status'])

        return Response(GoodsReceiptNoteSerializer(grn).data, status=status.HTTP_201_CREATED)
