"""
Automated Test Suite for the verify_data_integrity Management Command.
Validates:
- Execution via call_command with console output
- Structured JSON output parsing and metric schema validation
- Detection of simulated ledger balance discrepancies
- Automatic batch quarantine remediation (--fix-quarantine flag)
"""

import json
from io import StringIO
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.core.management import call_command
from apps.accounts.models import Organization, User
from apps.catalog.models import Product, Category
from apps.warehouses.models import Warehouse, Zone, Aisle, Rack, Shelf, Bin
from apps.inventory.models import StockItem, StockMovement


@pytest.mark.django_db
class TestVerifyDataIntegrityCommand:

    def test_verify_data_integrity_json_output_healthy(self):
        out = StringIO()
        call_command('verify_data_integrity', '--json', stdout=out)
        output_str = out.getvalue()
        
        data = json.loads(output_str)
        assert 'status' in data
        assert 'ledger_audit' in data
        assert 'spatial_audit' in data
        assert 'statutory_audit' in data
        assert 'expiry_audit' in data
        assert isinstance(data['total_discrepancies'], int)

    def test_verify_data_integrity_detects_ledger_variance(self):
        org = Organization.objects.create(name="Audit Variance Org", code="AVO")
        cat = Category.objects.create(organization=org, name="Fasteners", code="FST")
        wh = Warehouse.objects.create(organization=org, name="Central Hub", code="WH-CH-01")

        user = User.objects.create_user(username="auditor_test", email="auditor_test@stockpilot.in", organization=org)
        product = Product.objects.create(
            organization=org,
            sku="SKU-DISC-001",
            name="Structural Bolt M12",
            category=cat
        )

        # Create StockItem with quantity 50
        item = StockItem.objects.create(
            warehouse=wh,
            product=product,
            quantity_on_hand=50,
            unit_cost=Decimal("10.00")
        )

        # Create StockMovement indicating 40 units were received (variance = 10 units)
        StockMovement.objects.create(
            movement_id="MOV-TEST-DISC-01",
            product=product,
            warehouse=wh,
            movement_type="purchase_receipt",
            quantity=40,
            previous_balance=0,
            resulting_balance=40,
            created_by=user
        )


        out = StringIO()
        call_command('verify_data_integrity', '--json', stdout=out)
        data = json.loads(out.getvalue())

        assert data['status'] == 'warning'
        assert data['total_discrepancies'] >= 1
        ledger_discrepancies = [d for d in data['ledger_audit']['discrepancies'] if d['sku'] == 'SKU-DISC-001']
        assert len(ledger_discrepancies) == 1
        assert ledger_discrepancies[0]['delta'] == 10

    def test_verify_data_integrity_auto_quarantine_remediation(self):
        org = Organization.objects.create(name="Quarantine Test Org", code="QTO")
        cat = Category.objects.create(organization=org, name="Chemicals", code="CHM")
        wh = Warehouse.objects.create(organization=org, name="Chemical Hub", code="WH-CHM-01")

        product = Product.objects.create(
            organization=org,
            sku="SKU-EXP-001",
            name="Industrial Adhesive",
            category=cat
        )

        # Create an expired batch with positive on_hand and unquarantined
        yesterday = date.today() - timedelta(days=5)
        expired_item = StockItem.objects.create(
            warehouse=wh,
            product=product,
            quantity_on_hand=30,
            quantity_quarantined=0,
            expiry_date=yesterday,
            batch_number="BATCH-EXP-01"
        )

        # Run with --fix-quarantine
        out = StringIO()
        call_command('verify_data_integrity', '--fix-quarantine', '--json', stdout=out)
        data = json.loads(out.getvalue())

        # Verify item was remediated in DB
        expired_item.refresh_from_db()
        assert expired_item.quantity_quarantined == 30
        assert data['expiry_audit']['quarantined_fixed'] >= 1
