from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from apps.accounts.models import User, Organization
from apps.warehouses.models import Warehouse, Zone, Bin
from apps.catalog.models import Category, Product
from apps.inventory.models import StockItem, StockMovement
from apps.procurement.models import PurchaseOrder, PurchaseOrderItem
from apps.sales.models import Customer, SalesOrder, SalesOrderItem
from apps.forecasting.engine import DemandForecastingEngine
from apps.forecasting.models import DailyDemandRecord
from apps.common.utils import format_inr, generate_code

class StockPilotBackendTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(
            name='Test Logistics India Pvt Ltd',
            code='TLI',
            business_type='distributor',
            state='Maharashtra',
            city='Mumbai'
        )
        self.user = User.objects.create_user(
            email='tester@stockpilot.in',
            password='TestPassword@2026',
            first_name='Test',
            last_name='User',
            role='org_owner',
            organization=self.org
        )
        self.client.force_authenticate(user=self.user)

        self.warehouse = Warehouse.objects.create(
            organization=self.org,
            code='WH-TEST-01',
            name='Test Fulfillment Hub',
            address='Industrial Estate',
            city='Mumbai',
            state='Maharashtra',
            pin_code='400001',
            contact_person='Test Manager',
            phone_number='+91 99999 88888'
        )

        self.category = Category.objects.create(
            organization=self.org,
            name='Power & Automation',
            code='PWR-AUTO'
        )

        self.product = Product.objects.create(
            organization=self.org,
            sku='TEST-PLC-01',
            name='Test Automation Controller',
            category=self.category,
            cost_price=Decimal('5000.00'),
            selling_price=Decimal('7500.00'),
            reorder_level=20,
            preferred_reorder_quantity=100,
            lead_time_days=7
        )

    def test_inr_formatting(self):
        """Test Indian Rupee numbering format (Lakhs & Crores grouping)"""
        self.assertEqual(format_inr(2456800), "₹24,56,800.00")
        self.assertEqual(format_inr(10000000), "₹1,00,00,000.00")
        self.assertEqual(format_inr(500), "₹500.00")
        self.assertEqual(format_inr(0), "₹0.00")

    def test_health_check_endpoint(self):
        """Test system health check endpoint"""
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['status'], 'healthy')
        self.assertEqual(response.json()['timezone'], 'Asia/Kolkata')

    def test_inventory_ledger_and_balance(self):
        """Test stock item creation and movement ledger auditability"""
        stock_item = StockItem.objects.create(
            warehouse=self.warehouse,
            product=self.product,
            quantity_on_hand=50,
            unit_cost=Decimal('5000.00')
        )
        self.assertEqual(stock_item.quantity_available, 50)
        self.assertEqual(stock_item.total_value, Decimal('250000.00'))

        movement = StockMovement.objects.create(
            movement_id=generate_code('MOV'),
            product=self.product,
            warehouse=self.warehouse,
            movement_type='purchase_receipt',
            quantity=50,
            previous_balance=0,
            resulting_balance=50,
            unit_cost=Decimal('5000.00'),
            reason='Test purchase receipt',
            created_by=self.user
        )
        self.assertEqual(movement.resulting_balance, 50)

    def test_sales_reservation_prevents_overselling(self):
        """Verify sales order confirmation prevents overselling if inventory is insufficient"""
        StockItem.objects.create(
            warehouse=self.warehouse,
            product=self.product,
            quantity_on_hand=10,
            unit_cost=Decimal('5000.00')
        )

        customer = Customer.objects.create(
            organization=self.org,
            code='CUST-TEST-01',
            name='Test Retailer',
            contact_person='Test Buyer',
            phone_number='+91 98888 77777',
            email='buyer@test.in',
            billing_address='Addr',
            shipping_address='Addr',
            city='Mumbai',
            state='Maharashtra',
            pin_code='400001'
        )

        # Create SO requesting 50 units (only 10 on hand)
        so = SalesOrder.objects.create(
            so_number='SO-TEST-001',
            organization=self.org,
            customer=customer,
            source_warehouse=self.warehouse,
            status='draft',
            order_date='2026-10-14',
            expected_dispatch_date='2026-10-16',
            created_by=self.user
        )
        SalesOrderItem.objects.create(
            sales_order=so,
            product=self.product,
            quantity_ordered=50,
            unit_price=Decimal('7500.00')
        )

        response = self.client.post(f'/api/sales/orders/{so.id}/confirm/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Overselling prevented', response.json()['error'])

    def test_demand_forecasting_engine(self):
        """Verify empirical forecasting engine runs backtesting and calculates reorder recommendation"""
        # Seed 30 days of demand
        from datetime import date, timedelta
        today = date.today()
        for i in range(30, 0, -1):
            DailyDemandRecord.objects.create(
                product=self.product,
                warehouse=self.warehouse,
                date=today - timedelta(days=i),
                quantity_demanded=10,
                quantity_fulfilled=10
            )

        StockItem.objects.create(
            warehouse=self.warehouse,
            product=self.product,
            quantity_on_hand=5, # Below reorder point
            unit_cost=Decimal('5000.00')
        )

        engine = DemandForecastingEngine(self.product, self.warehouse)
        forecast = engine.run_forecast(horizon_days=30)
        self.assertGreater(forecast.projected_demand, 0)
        self.assertGreaterEqual(forecast.confidence_score, 50.0)

        rec = engine.generate_reorder_recommendation()
        self.assertEqual(rec.status, 'pending_review')
        self.assertGreater(rec.recommended_order_quantity, 0)
        self.assertIn('REPLENISHMENT REQUIRED', rec.explanation)
