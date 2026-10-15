import io
import base64
import qrcode
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.http import HttpResponse
from .models import LabelTemplate, BarcodeScanLog
from apps.catalog.models import Product
from apps.catalog.serializers import ProductSerializer
from apps.warehouses.models import Bin
from apps.warehouses.serializers import BinSerializer
from apps.procurement.models import PurchaseOrder
from apps.procurement.serializers import PurchaseOrderSerializer
from apps.dispatch.models import DispatchOrder
from apps.dispatch.serializers import DispatchOrderSerializer
from apps.common.utils import format_inr

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.barcode import code128

class BarcodeLookupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        code = request.query_params.get('code', '').strip()
        if not code:
            return Response({'error': 'No barcode or SKU provided.'}, status=status.HTTP_400_BAD_REQUEST)

        org = request.user.organization
        
        # 1. Match Product
        product = Product.objects.filter(organization=org).filter(
            models_q = None or models_lookups(code)
        ) if False else None

        # Check product by sku or barcode_value
        prod = Product.objects.filter(organization=org).filter(sku__iexact=code).first()
        if not prod:
            prod = Product.objects.filter(organization=org).filter(barcode_value__iexact=code).first()

        if prod:
            BarcodeScanLog.objects.create(
                user=request.user,
                barcode_value=code,
                matched_entity_type='product',
                matched_entity_id=prod.id
            )
            return Response({
                'type': 'product',
                'data': ProductSerializer(prod).data
            })

        # 2. Match Warehouse Bin
        bin_obj = Bin.objects.filter(shelf__rack__aisle__zone__warehouse__organization=org).filter(
            barcode_value__iexact=code
        ).first()

        if bin_obj:
            BarcodeScanLog.objects.create(
                user=request.user,
                barcode_value=code,
                matched_entity_type='bin',
                matched_entity_id=bin_obj.id
            )
            return Response({
                'type': 'bin',
                'data': BinSerializer(bin_obj).data
            })

        # 3. Match PO
        po = PurchaseOrder.objects.filter(organization=org, po_number__iexact=code).first()
        if po:
            BarcodeScanLog.objects.create(
                user=request.user,
                barcode_value=code,
                matched_entity_type='purchase_order',
                matched_entity_id=po.id
            )
            return Response({
                'type': 'purchase_order',
                'data': PurchaseOrderSerializer(po).data
            })

        # 4. Match Dispatch
        dsp = DispatchOrder.objects.filter(warehouse__organization=org).filter(
            dispatch_number__iexact=code
        ).first() or DispatchOrder.objects.filter(warehouse__organization=org).filter(
            delivery_challan_number__iexact=code
        ).first()

        if dsp:
            BarcodeScanLog.objects.create(
                user=request.user,
                barcode_value=code,
                matched_entity_type='dispatch',
                matched_entity_id=dsp.id
            )
            return Response({
                'type': 'dispatch',
                'data': DispatchOrderSerializer(dsp).data
            })

        return Response({'error': f"No item, bin, or order matching barcode '{code}' was found in this warehouse."}, status=status.HTTP_404_NOT_FOUND)

class BarcodeGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        text = request.query_params.get('text', 'SKU-SAMPLE-01')
        barcode_type = request.query_params.get('type', 'code128')

        if barcode_type == 'qr':
            qr = qrcode.QRCode(box_size=6, border=1)
            qr.add_data(text)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#14532D", back_color="white")
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            return Response({'data_url': f"data:image/png;base64,{b64}", 'text': text, 'type': 'qr'})
        else:
            # Code 128 (Rendered via Pillow for 100% cross-platform compatibility)
            import string
            from PIL import Image, ImageDraw
            bc = code128.Code128(text)
            bc.validate()
            bc.encode()
            pat = bc.decompose()

            oa, oA = ord('a') - 1, ord('A') - 1
            bw = 2
            w_units = sum((ord(c) - oa) if c in string.ascii_lowercase else (ord(c) - oA) for c in pat)
            total_w = w_units * bw + 40
            h = 60

            img = Image.new('RGB', (total_w, h), 'white')
            draw = ImageDraw.Draw(img)
            x = 20

            for c in pat:
                oc = ord(c)
                if c in string.ascii_lowercase:
                    x += (oc - oa) * bw
                elif c in string.ascii_uppercase:
                    w = (oc - oA) * bw
                    draw.rectangle([x, 6, x + w - 1, 50], fill='#14532D')
                    x += w

            buf = io.BytesIO()
            img.save(buf, format='PNG')
            b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            return Response({'data_url': f"data:image/png;base64,{b64}", 'text': text, 'type': 'code128'})



class PrintLabelsPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        product_id = request.query_params.get('product')
        count = min(int(request.query_params.get('count', 12)), 48)

        try:
            prod = Product.objects.get(id=product_id, organization=request.user.organization)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
        elements = []
        styles = getSampleStyleSheet()

        # Build grid of labels (3 columns x 8 rows)
        label_cells = []
        
        # Pre-generate QR image buffer
        qr = qrcode.QRCode(box_size=3, border=0)
        qr.add_data(prod.sku)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="#14532D", back_color="white")
        qr_buf = io.BytesIO()
        qr_img.save(qr_buf, format='PNG')
        qr_buf.seek(0)
        qr_reportlab = Image(qr_buf, width=40, height=40)

        # Barcode
        bc = code128.Code128(prod.sku, barWidth=1.0, barHeight=25, humanReadable=False)

        cell_style_title = ParagraphStyle('LT', fontSize=8, fontName='Helvetica-Bold', textColor=colors.HexColor('#14532D'))
        cell_style_sku = ParagraphStyle('LS', fontSize=8, fontName='Helvetica', textColor=colors.HexColor('#1F2933'))
        cell_style_price = ParagraphStyle('LP', fontSize=8, fontName='Helvetica-Bold', textColor=colors.HexColor('#C65D3A'))

        for i in range(count):
            label_inner = [
                [Paragraph(f"<b>{prod.organization.name[:18]}</b>", cell_style_title), qr_reportlab],
                [Paragraph(f"{prod.name[:25]}", cell_style_sku), ''],
                [Paragraph(f"<b>SKU: {prod.sku}</b>", cell_style_sku), ''],
                [Paragraph(f"MRP: {format_inr(prod.selling_price)}", cell_style_price), ''],
            ]
            cell_table = Table(label_inner, colWidths=[120, 45])
            cell_table.setStyle(TableStyle([
                ('SPAN', (0,1), (1,1)),
                ('SPAN', (0,2), (1,2)),
                ('SPAN', (0,3), (1,3)),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 4),
                ('RIGHTPADDING', (0,0), (-1,-1), 4),
            ]))
            label_cells.append(cell_table)

        # Pack into rows of 3
        rows = []
        for i in range(0, len(label_cells), 3):
            row = label_cells[i:i+3]
            while len(row) < 3:
                row.append('')
            rows.append(row)

        sheet_table = Table(rows, colWidths=[180, 180, 180])
        sheet_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(sheet_table)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="labels_{prod.sku}.pdf"'
        return response
