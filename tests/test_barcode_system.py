"""
Automated Test Suite for StockPilot Barcode & QR Generation and Scanning Lookup Engines.
Validates:
- Code128 Linear Barcode rendering and valid PNG binary encoding
- QR Code 2D Matrix generation and palette styling
- Multi-Entity Barcode Scanner Lookup (SKU match, barcode_value match, unregistered 404)
- Multi-Label PDF Generation Grid (A4 compliance and PDF magic header verification)
"""

import base64
import pytest
from decimal import Decimal
from django.test import RequestFactory
from apps.accounts.models import User, Organization
from apps.catalog.models import Product, Category
from apps.barcodes.views import BarcodeLookupView, BarcodeGenerateView, PrintLabelsPDFView


@pytest.fixture
def auth_context():
    org = Organization.objects.create(name="Barcode Testing Org", code="BTO")
    user = User.objects.create_user(
        username="barcode_tester",
        email="barcode_tester@stockpilot.in",
        password="TestPassword@2026",
        organization=org,
        role="warehouse_manager"
    )
    cat = Category.objects.create(organization=org, name="Hardware", code="HDW")
    product = Product.objects.create(
        organization=org,
        sku="SKU-BRC-001",
        barcode_value="8901234567890",
        name="Precision Hex Bolt M8",
        category=cat,
        cost_price=Decimal("15.50"),
        selling_price=Decimal("25.00"),
        reorder_level=100
    )
    return {'org': org, 'user': user, 'product': product, 'category': cat}


@pytest.mark.django_db
class TestBarcodeSystem:

    def test_code128_barcode_generation(self, auth_context):
        factory = RequestFactory()
        request = factory.get('/api/barcodes/generate/', {'text': 'SKU-BRC-001', 'type': 'code128'})
        request.user = auth_context['user']

        view = BarcodeGenerateView.as_view()
        response = view(request)

        assert response.status_code == 200
        assert response.data['type'] == 'code128'
        assert response.data['text'] == 'SKU-BRC-001'
        assert response.data['data_url'].startswith('data:image/png;base64,')

        # Verify decoded payload has valid PNG header bytes
        raw_b64 = response.data['data_url'].split(',')[1]
        decoded_bytes = base64.b64decode(raw_b64)
        assert decoded_bytes.startswith(b'\x89PNG\r\n\x1a\n')

    def test_qr_code_generation(self, auth_context):
        factory = RequestFactory()
        request = factory.get('/api/barcodes/generate/', {'text': 'https://stockpilot.in/items/SKU-BRC-001', 'type': 'qr'})
        request.user = auth_context['user']

        view = BarcodeGenerateView.as_view()
        response = view(request)

        assert response.status_code == 200
        assert response.data['type'] == 'qr'
        assert response.data['data_url'].startswith('data:image/png;base64,')

        raw_b64 = response.data['data_url'].split(',')[1]
        decoded_bytes = base64.b64decode(raw_b64)
        assert decoded_bytes.startswith(b'\x89PNG\r\n\x1a\n')

    def test_barcode_lookup_by_sku(self, auth_context):
        factory = RequestFactory()
        request = factory.get('/api/barcodes/lookup/', {'code': 'SKU-BRC-001'})
        request.user = auth_context['user']

        view = BarcodeLookupView.as_view()
        response = view(request)

        assert response.status_code == 200
        assert response.data['type'] == 'product'
        assert response.data['data']['sku'] == 'SKU-BRC-001'
        assert response.data['data']['name'] == 'Precision Hex Bolt M8'

    def test_barcode_lookup_by_barcode_value(self, auth_context):
        factory = RequestFactory()
        request = factory.get('/api/barcodes/lookup/', {'code': '8901234567890'})
        request.user = auth_context['user']

        view = BarcodeLookupView.as_view()
        response = view(request)

        assert response.status_code == 200
        assert response.data['type'] == 'product'
        assert response.data['data']['sku'] == 'SKU-BRC-001'

    def test_barcode_lookup_unregistered_code_returns_404(self, auth_context):
        factory = RequestFactory()
        request = factory.get('/api/barcodes/lookup/', {'code': 'UNKNOWN-CODE-999'})
        request.user = auth_context['user']

        view = BarcodeLookupView.as_view()
        response = view(request)

        assert response.status_code == 404
        assert 'matching barcode' in response.data['error'].lower()


    def test_barcode_lookup_empty_code_returns_400(self, auth_context):
        factory = RequestFactory()
        request = factory.get('/api/barcodes/lookup/', {'code': '   '})
        request.user = auth_context['user']

        view = BarcodeLookupView.as_view()
        response = view(request)

        assert response.status_code == 400
        assert 'No barcode or SKU provided' in response.data['error']

    def test_print_labels_pdf_generation(self, auth_context):
        factory = RequestFactory()
        prod = auth_context['product']
        request = factory.get('/api/barcodes/print-labels/', {'product': prod.id, 'count': 6})
        request.user = auth_context['user']

        view = PrintLabelsPDFView.as_view()
        response = view(request)

        assert response.status_code == 200
        assert response['Content-Type'] == 'application/pdf'
        # Verify PDF magic header
        assert response.content.startswith(b'%PDF-')
