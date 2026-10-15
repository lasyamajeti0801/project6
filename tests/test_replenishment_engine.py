"""
Unit tests for the Stock Replenishment & Reorder Optimization Engine.
Tests:
- Wilson's Economic Order Quantity (EOQ) formula
- Statistical and deterministic Reorder Point (ROP) calculation
- Product stock health categorization (ADEQUATE, LOW_STOCK_WARNING, CRITICAL, STOCKOUT)
- Automated alert notification generation
"""

import pytest
from decimal import Decimal
from apps.inventory.replenishment_engine import (
    calculate_eoq,
    calculate_reorder_point,
    evaluate_product_stock_health,
    run_replenishment_audit
)
from apps.catalog.models import Product, Category
from apps.accounts.models import Organization
from apps.warehouses.models import Warehouse
from apps.inventory.models import StockItem
from apps.notifications.models import Notification


@pytest.mark.django_db
class TestReplenishmentEngine:

    def test_calculate_eoq_standard_inputs(self):
        # Annual demand D=1200, Order cost S=500, Unit cost=100, Holding rate=0.20
        # H = 100 * 0.20 = 20
        # EOQ = sqrt((2 * 1200 * 500) / 20) = sqrt(60000) = 244.95 -> 245
        eoq = calculate_eoq(annual_demand=1200, order_cost=500.0, holding_cost_rate=0.20, unit_cost=100.0)
        assert eoq == 245

    def test_calculate_eoq_zero_and_negative_demand(self):
        assert calculate_eoq(annual_demand=0) == 0
        assert calculate_eoq(annual_demand=-50) == 0

    def test_calculate_reorder_point(self):
        # Daily consumption = 10, Lead time = 7 days, deterministic safety stock = 50
        # ROP = (10 * 7) + 50 = 120
        rop = calculate_reorder_point(daily_consumption=10, lead_time_days=7, safety_stock=50)
        assert rop == 120

        # Statistical safety stock with service factor Z=1.65 (95% service level)
        rop_stat = calculate_reorder_point(daily_consumption=10, lead_time_days=7, safety_stock=None)
        assert rop_stat > 70  # Base demand is 70, plus statistical buffer

    def test_evaluate_product_stock_health(self):
        org = Organization.objects.create(name="Test Replenish Org", code="TRO")
        cat = Category.objects.create(organization=org, name="Industrial", code="IND")
        wh = Warehouse.objects.create(organization=org, name="Hub North", code="WH-N-01")

        product = Product.objects.create(
            organization=org,
            sku="SKU-REPLENISH-01",
            name="Heavy Duty Conveyor Roller",
            category=cat,
            cost_price=Decimal("250.00"),
            reorder_level=50,
            preferred_reorder_quantity=100,
            lead_time_days=10
        )

        # 1. No stock items exist -> STOCKOUT
        health = evaluate_product_stock_health(product)
        assert health['status'] == 'STOCKOUT'
        assert health['urgency'] == 'critical'
        assert health['quantity_available'] == 0
        assert health['recommended_reorder_quantity'] > 0

        # 2. Add stock below reorder level (e.g. 20 on hand, reorder_level=50)
        StockItem.objects.create(
            warehouse=wh,
            product=product,
            quantity_on_hand=20,
            quantity_reserved=0,
            quantity_quarantined=0,
            unit_cost=Decimal("250.00")
        )
        health_low = evaluate_product_stock_health(product)
        assert health_low['status'] in ('LOW_STOCK_WARNING', 'CRITICAL_REORDER_REQUIRED')
        assert health_low['quantity_available'] == 20

        # 3. Increase stock well above reorder level (e.g. 200 on hand)
        StockItem.objects.filter(product=product).update(quantity_on_hand=200)
        health_ok = evaluate_product_stock_health(product)
        assert health_ok['status'] == 'ADEQUATE'
        assert health_ok['urgency'] == 'info'
        assert health_ok['recommended_reorder_quantity'] == 0

    def test_run_replenishment_audit_and_notification_dispatch(self):
        org = Organization.objects.create(name="Notification Audit Org", code="NAO")
        cat = Category.objects.create(organization=org, name="General", code="GEN")

        # Create two products with zero stock
        p1 = Product.objects.create(organization=org, sku="SKU-AUDIT-01", name="Safety Harness", category=cat, reorder_level=30)
        p2 = Product.objects.create(organization=org, sku="SKU-AUDIT-02", name="Steel Toe Boots", category=cat, reorder_level=40)

        # Run audit with notification dispatch
        audit_result = run_replenishment_audit(organization=org, dispatch_notifications=True)
        assert audit_result['stockout_count'] == 2
        assert audit_result['total_products_evaluated'] == 2

        # Verify notifications were created
        notifs = Notification.objects.filter(organization=org)
        assert notifs.count() == 2

        # Run again with dispatch_notifications=True - verify deduplication prevents duplicate notifications
        run_replenishment_audit(organization=org, dispatch_notifications=True)
        assert Notification.objects.filter(organization=org).count() == 2
