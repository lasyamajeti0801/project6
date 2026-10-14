import io
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
from .models import Customer, SalesOrder, SalesOrderItem
from .serializers import CustomerSerializer, SalesOrderSerializer
from apps.inventory.models import StockItem, StockMovement
from apps.common.utils import generate_code, format_inr
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'contact_person', 'gstin', 'city', 'phone_number']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return Customer.objects.filter(organization=user.organization)
        return Customer.objects.none()

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class SalesOrderViewSet(viewsets.ModelViewSet):
    serializer_class = SalesOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['so_number', 'customer__name', 'notes']
    ordering_fields = ['order_date', 'total_amount', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return SalesOrder.objects.none()
        qs = SalesOrder.objects.filter(organization=user.organization).select_related(
            'customer', 'source_warehouse', 'created_by'
        ).prefetch_related('items__product')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        so = self.get_object()
        if so.status != 'draft':
            return Response({'error': f"Only draft sales orders can be confirmed. Current: {so.status}"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Validate inventory availability and reserve stock
            for item in so.items.all():
                stock_items = StockItem.objects.select_for_update().filter(
                    warehouse=so.source_warehouse,
                    product=item.product
                )
                total_available = sum(si.quantity_available for si in stock_items)
                
                if total_available < item.quantity_ordered:
                    return Response({
                        'error': f"Insufficient stock for {item.product.name} ({item.product.sku}). Available: {total_available}, Requested: {item.quantity_ordered}. Overselling prevented by StockPilot."
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Reserve stock across stock items
                remaining_to_reserve = item.quantity_ordered
                for si in stock_items:
                    can_reserve = min(si.quantity_available, remaining_to_reserve)
                    if can_reserve > 0:
                        si.quantity_reserved += can_reserve
                        si.save()
                        remaining_to_reserve -= can_reserve
                        if remaining_to_reserve == 0:
                            break

                item.quantity_reserved = item.quantity_ordered
                item.save()

            so.status = 'reserved'
            so.save(update_fields=['status'])

        return Response(SalesOrderSerializer(so).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        so = self.get_object()
        if so.status in ['dispatched', 'delivered']:
            return Response({'error': 'Cannot cancel orders that are already dispatched or delivered.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Release reservations if reserved
            if so.status in ['confirmed', 'reserved', 'picking', 'packed']:
                for item in so.items.all():
                    if item.quantity_reserved > 0:
                        stock_items = StockItem.objects.select_for_update().filter(
                            warehouse=so.source_warehouse,
                            product=item.product
                        )
                        remaining_to_release = item.quantity_reserved
                        for si in stock_items:
                            can_release = min(si.quantity_reserved, remaining_to_release)
                            if can_release > 0:
                                si.quantity_reserved -= can_release
                                si.save()
                                remaining_to_release -= can_release
                                if remaining_to_release == 0:
                                    break
                        item.quantity_reserved = 0
                        item.save()

            so.status = 'cancelled'
            so.save(update_fields=['status'])

        return Response(SalesOrderSerializer(so).data)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        so = self.get_object()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading1'],
            textColor=colors.HexColor('#14532D'),
            fontSize=18,
            spaceAfter=6
        )

        org = so.organization
        elements.append(Paragraph(f"<b>{org.name}</b>", header_style))
        elements.append(Paragraph(f"GSTIN: {org.gstin or 'N/A'} | State: {org.state} | {org.city}", styles['Normal']))
        elements.append(Spacer(1, 15))
        
        elements.append(Paragraph(f"<b>SALES ORDER / TAX INVOICE: {so.so_number}</b>", ParagraphStyle('Sub', fontSize=14, textColor=colors.HexColor('#15803D'))))
        elements.append(Spacer(1, 10))

        meta_data = [
            [f"Customer: {so.customer.name}", f"Date: {so.order_date}"],
            [f"Contact: {so.customer.contact_person} ({so.customer.phone_number})", f"Dispatch Date: {so.expected_dispatch_date}"],
            [f"Shipping: {so.customer.shipping_address}, {so.customer.city}", f"Payment Status: {so.get_payment_status_display()}"],
            [f"Customer GSTIN: {so.customer.gstin or 'Unregistered'}", f"Order Status: {so.get_status_display()}"]
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

        items_data = [['#', 'SKU / Product Description', 'HSN', 'Qty', 'Unit Price (INR)', 'GST %', 'Total (INR)']]
        for idx, item in enumerate(so.items.all(), 1):
            items_data.append([
                str(idx),
                f"{item.product.sku}\n{item.product.name}",
                item.product.hsn_code or '-',
                str(item.quantity_ordered),
                format_inr(item.unit_price),
                f"{item.gst_rate}%",
                format_inr(item.total_price)
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

        totals_data = [
            ['Subtotal:', format_inr(so.subtotal)],
            ['Applicable GST (CGST/SGST/IGST):', format_inr(so.tax_amount)],
            ['Shipping Charges:', format_inr(so.shipping_charges)],
            ['Grand Total (INR):', format_inr(so.total_amount)],
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
        elements.append(Paragraph("<i>Authorized Signatory — Generated via StockPilot WMS</i>", styles['Italic']))

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{so.so_number}.pdf"'
        return response
