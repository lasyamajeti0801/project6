import io
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from .models import DispatchOrder, DispatchItem
from .serializers import DispatchOrderSerializer
from apps.sales.models import SalesOrder, SalesOrderItem
from apps.inventory.models import StockItem, StockMovement
from apps.common.utils import generate_code
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class DispatchOrderViewSet(viewsets.ModelViewSet):
    serializer_class = DispatchOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['dispatch_number', 'delivery_challan_number', 'sales_order__so_number', 'vehicle_number', 'transporter_name']
    ordering_fields = ['dispatch_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return DispatchOrder.objects.none()
        qs = DispatchOrder.objects.filter(warehouse__organization=user.organization).select_related(
            'sales_order__customer', 'warehouse', 'dispatched_by'
        ).prefetch_related('items__product')
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def create(self, request, *args, **kwargs):
        so_id = request.data.get('sales_order')
        try:
            so = SalesOrder.objects.get(id=so_id, organization=request.user.organization)
        except SalesOrder.DoesNotExist:
            return Response({'error': 'Sales Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if so.status not in ['reserved', 'picking', 'packed']:
            return Response({'error': f"Cannot create dispatch for order in status: {so.status}"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            dispatch = DispatchOrder.objects.create(
                dispatch_number=generate_code('DSP'),
                delivery_challan_number=generate_code('DC'),
                sales_order=so,
                warehouse=so.source_warehouse,
                status='planned',
                dispatch_date=request.data.get('dispatch_date', timezone.now().date()),
                transporter_name=request.data.get('transporter_name', 'VRL Logistics'),
                vehicle_number=request.data.get('vehicle_number', ''),
                driver_name=request.data.get('driver_name', ''),
                driver_phone=request.data.get('driver_phone', ''),
                e_way_bill_number=request.data.get('e_way_bill_number', ''),
                package_count=int(request.data.get('package_count', 1)),
                total_weight_kg=float(request.data.get('total_weight_kg', 10.0)),
                dispatched_by=request.user
            )

            for so_item in so.items.all():
                DispatchItem.objects.create(
                    dispatch_order=dispatch,
                    sales_order_item=so_item,
                    product=so_item.product,
                    quantity_dispatched=so_item.quantity_ordered
                )

            so.status = 'picking'
            so.save(update_fields=['status'])

        return Response(DispatchOrderSerializer(dispatch).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def confirm_dispatch(self, request, pk=None):
        dispatch = self.get_object()
        if dispatch.status == 'dispatched':
            return Response({'error': 'Order is already dispatched.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for item in dispatch.items.all():
                stock_items = StockItem.objects.select_for_update().filter(
                    warehouse=dispatch.warehouse,
                    product=item.product
                )

                remaining_to_deduct = item.quantity_dispatched
                for si in stock_items:
                    deduct_amt = min(si.quantity_on_hand, remaining_to_deduct)
                    if deduct_amt > 0:
                        prev_bal = si.quantity_on_hand
                        si.quantity_on_hand -= deduct_amt
                        si.quantity_reserved = max(0, si.quantity_reserved - deduct_amt)
                        si.save()

                        # Record stock movement
                        StockMovement.objects.create(
                            movement_id=generate_code('MOV'),
                            product=item.product,
                            warehouse=dispatch.warehouse,
                            bin=si.bin,
                            movement_type='sales_dispatch',
                            quantity=-deduct_amt,
                            previous_balance=prev_bal,
                            resulting_balance=si.quantity_on_hand,
                            unit_cost=si.unit_cost,
                            reference_document=dispatch.delivery_challan_number,
                            reason=f"Dispatched under Delivery Challan {dispatch.delivery_challan_number} (SO: {dispatch.sales_order.so_number})",
                            created_by=request.user
                        )

                        remaining_to_deduct -= deduct_amt
                        if remaining_to_deduct == 0:
                            break

            dispatch.status = 'dispatched'
            dispatch.save()

            so = dispatch.sales_order
            so.status = 'dispatched'
            so.save()

        return Response(DispatchOrderSerializer(dispatch).data)

    @action(detail=True, methods=['post'])
    def mark_delivered(self, request, pk=None):
        dispatch = self.get_object()
        notes = request.data.get('proof_of_delivery_notes', 'Customer confirmed receipt')
        
        dispatch.status = 'delivered'
        dispatch.delivered_at = timezone.now()
        dispatch.proof_of_delivery_notes = notes
        dispatch.save()

        so = dispatch.sales_order
        so.status = 'delivered'
        so.save()

        return Response(DispatchOrderSerializer(dispatch).data)

    @action(detail=True, methods=['get'])
    def download_challan(self, request, pk=None):
        if not REPORTLAB_AVAILABLE:
            return Response({'error': 'ReportLab library is required for PDF generation.'}, status=status.HTTP_501_NOT_IMPLEMENTED)
        dispatch = self.get_object()
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

        org = dispatch.warehouse.organization
        elements.append(Paragraph(f"<b>{org.name}</b>", header_style))
        elements.append(Paragraph(f"GSTIN: {org.gstin or 'N/A'} | Dispatch Warehouse: {dispatch.warehouse.name} ({dispatch.warehouse.code})", styles['Normal']))
        elements.append(Spacer(1, 10))
        
        elements.append(Paragraph(f"<b>DELIVERY CHALLAN: {dispatch.delivery_challan_number}</b>", ParagraphStyle('Sub', fontSize=14, textColor=colors.HexColor('#15803D'))))
        elements.append(Paragraph(f"Rule 55 CGST Rules | Internal Goods Dispatch Document", ParagraphStyle('Sub2', fontSize=9, textColor=colors.HexColor('#647067'))))
        elements.append(Spacer(1, 10))

        meta_data = [
            [f"Dispatch Ref: {dispatch.dispatch_number}", f"Dispatch Date: {dispatch.dispatch_date}"],
            [f"Sales Order: {dispatch.sales_order.so_number}", f"E-Way Bill No: {dispatch.e_way_bill_number or 'Exempt / Not Required'}"],
            [f"Consignee (Customer): {dispatch.sales_order.customer.name}", f"Transporter: {dispatch.transporter_name or 'Direct Fleet'}"],
            [f"Shipping To: {dispatch.sales_order.customer.shipping_address}, {dispatch.sales_order.customer.city}", f"Vehicle No: {dispatch.vehicle_number or 'Local Van'}"],
            [f"Packages: {dispatch.package_count} cartons", f"Total Weight: {dispatch.total_weight_kg} kg"],
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

        items_data = [['#', 'SKU / Product Description', 'HSN Code', 'Qty Dispatched', 'UOM']]
        for idx, item in enumerate(dispatch.items.all(), 1):
            items_data.append([
                str(idx),
                f"{item.product.sku}\n{item.product.name}",
                item.product.hsn_code or '-',
                str(item.quantity_dispatched),
                item.product.unit_of_measure
            ])

        items_table = Table(items_data, colWidths=[30, 290, 80, 70, 50])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#14532D')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('ALIGN', (3,0), (3,-1), 'RIGHT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 25))

        sign_data = [
            ['Prepared & Dispatched By:', 'Transporter Signature:', 'Received By (Customer):'],
            [f"{dispatch.dispatched_by.get_full_name() or 'Dispatch Operator'}\n\n______________________", "\n\n______________________", "\n\n______________________"]
        ]
        sign_table = Table(sign_data, colWidths=[175, 175, 170])
        sign_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(sign_table)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{dispatch.delivery_challan_number}.pdf"'
        return response
