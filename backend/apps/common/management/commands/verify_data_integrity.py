"""
StockPilot Enterprise Management Command: verify_data_integrity
Performs deep structural, ledger, and statutory compliance audits:
1. Double-Entry Stock Ledger Reconciliation (Sum of movements vs recorded on-hand quantity)
2. Spatial Coordinate Hierarchy Validation (Warehouse > Zone > Aisle > Rack > Shelf > Bin)
3. Statutory Tax Identifier Validation (GSTIN / PAN formatting & State consistency)
4. Batch Shelf-Life and Expiry Quarantine Enforcement
"""

import json
from datetime import date
from django.core.management.base import BaseCommand
from django.db.models import Sum
from apps.accounts.models import Organization
from apps.catalog.models import Product
from apps.warehouses.models import Warehouse, Bin
from apps.inventory.models import StockItem, StockMovement
from apps.suppliers.models import Supplier
from apps.sales.models import Customer
from apps.common.statutory_validators import validate_gstin, validate_pan


class Command(BaseCommand):
    help = 'Executes comprehensive enterprise data integrity, ledger reconciliation, and statutory audits.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--json',
            action='store_true',
            dest='as_json',
            help='Output results as a structured JSON document'
        )
        parser.add_argument(
            '--fix-quarantine',
            action='store_true',
            dest='fix_quarantine',
            help='Automatically move expired stock items with positive on-hand balance into quarantine'
        )

    def handle(self, *args, **options):
        as_json = options.get('as_json', False)
        fix_quarantine = options.get('fix_quarantine', False)

        report = {
            'status': 'healthy',
            'audit_date': date.today().isoformat(),
            'total_discrepancies': 0,
            'ledger_audit': {'checked_items': 0, 'discrepancies': []},
            'spatial_audit': {'checked_bins': 0, 'orphaned_bins': []},
            'statutory_audit': {'invalid_suppliers': [], 'invalid_customers': []},
            'expiry_audit': {'expired_unquarantined_items': [], 'quarantined_fixed': 0}
        }

        # ---------------------------------------------------------
        # 1. Double-Entry Ledger Reconciliation
        # ---------------------------------------------------------
        stock_items = StockItem.objects.select_related('product', 'warehouse').all()
        report['ledger_audit']['checked_items'] = stock_items.count()

        for item in stock_items:
            movements_sum = StockMovement.objects.filter(
                product=item.product,
                warehouse=item.warehouse,
                bin=item.bin,
                batch_number=item.batch_number
            ).aggregate(total=Sum('quantity'))['total']

            # If there are tracked movements, compare sum with quantity_on_hand
            if movements_sum is not None and movements_sum != item.quantity_on_hand:
                discrepancy = {
                    'stock_item_id': item.id,
                    'sku': item.product.sku,
                    'warehouse': item.warehouse.code,
                    'on_hand': item.quantity_on_hand,
                    'ledger_movement_sum': movements_sum,
                    'delta': item.quantity_on_hand - movements_sum
                }
                report['ledger_audit']['discrepancies'].append(discrepancy)
                report['total_discrepancies'] += 1

        # ---------------------------------------------------------
        # 2. Spatial Coordinate Hierarchy Validation
        # ---------------------------------------------------------
        bins = Bin.objects.select_related('shelf__rack__aisle__zone__warehouse').all()
        report['spatial_audit']['checked_bins'] = bins.count()

        for b in bins:
            if not b.shelf or not b.shelf.rack or not b.shelf.rack.aisle or not b.shelf.rack.aisle.zone or not b.shelf.rack.aisle.zone.warehouse:
                report['spatial_audit']['orphaned_bins'].append({
                    'bin_id': b.id,
                    'code': b.code
                })
                report['total_discrepancies'] += 1

        # ---------------------------------------------------------
        # 3. Statutory Tax Identifier Validation
        # ---------------------------------------------------------
        for sup in Supplier.objects.filter(is_active=True):
            if sup.gstin:
                valid_gst, err = validate_gstin(sup.gstin)
                if not valid_gst:
                    report['statutory_audit']['invalid_suppliers'].append({
                        'supplier_id': sup.id,
                        'name': sup.name,
                        'gstin': sup.gstin,
                        'error': err
                    })
                    report['total_discrepancies'] += 1
            if sup.pan:
                valid_pan, _, err = validate_pan(sup.pan)
                if not valid_pan:
                    report['statutory_audit']['invalid_suppliers'].append({
                        'supplier_id': sup.id,
                        'name': sup.name,
                        'pan': sup.pan,
                        'error': err
                    })
                    report['total_discrepancies'] += 1

        for cust in Customer.objects.filter(is_active=True):
            if cust.gstin and cust.gstin.strip().upper() != 'URP':
                valid_gst, err = validate_gstin(cust.gstin)
                if not valid_gst:
                    report['statutory_audit']['invalid_customers'].append({
                        'customer_id': cust.id,
                        'name': cust.name,
                        'gstin': cust.gstin,
                        'error': err
                    })
                    report['total_discrepancies'] += 1

        # ---------------------------------------------------------
        # 4. Batch Shelf-Life and Expiry Quarantine Enforcement
        # ---------------------------------------------------------
        today = date.today()
        expired_items = StockItem.objects.filter(
            expiry_date__lt=today,
            quantity_on_hand__gt=0
        )

        for itm in expired_items:
            unquarantined = itm.quantity_on_hand - itm.quantity_quarantined
            if unquarantined > 0:
                report['expiry_audit']['expired_unquarantined_items'].append({
                    'stock_item_id': itm.id,
                    'sku': itm.product.sku,
                    'batch_number': itm.batch_number,
                    'expiry_date': itm.expiry_date.isoformat(),
                    'unquarantined_qty': unquarantined
                })
                report['total_discrepancies'] += 1

                if fix_quarantine:
                    itm.quantity_quarantined = itm.quantity_on_hand
                    itm.save(update_fields=['quantity_quarantined'])
                    report['expiry_audit']['quarantined_fixed'] += 1

        if report['total_discrepancies'] > 0:
            report['status'] = 'warning' if not fix_quarantine else 'repaired'

        # Output handling
        if as_json:
            self.stdout.write(json.dumps(report, indent=2))
        else:
            self.stdout.write(self.style.SUCCESS("=" * 70))
            self.stdout.write(self.style.SUCCESS(" STOCKPILOT — ENTERPRISE DATA INTEGRITY & AUDIT REPORT"))
            self.stdout.write(self.style.SUCCESS("=" * 70))
            self.stdout.write(f"Audit Date: {report['audit_date']}")
            self.stdout.write(f"System Status: {report['status'].upper()}")
            self.stdout.write(f"Total Discrepancies Detected: {report['total_discrepancies']}")
            self.stdout.write("-" * 70)
            self.stdout.write(f"1. Ledger Balance: {report['ledger_audit']['checked_items']} items checked, {len(report['ledger_audit']['discrepancies'])} variances.")
            self.stdout.write(f"2. Spatial Hierarchy: {report['spatial_audit']['checked_bins']} bins verified, {len(report['spatial_audit']['orphaned_bins'])} orphaned.")
            self.stdout.write(f"3. Statutory Compliance: {len(report['statutory_audit']['invalid_suppliers'])} supplier issues, {len(report['statutory_audit']['invalid_customers'])} customer issues.")
            self.stdout.write(f"4. Batch Expiry: {len(report['expiry_audit']['expired_unquarantined_items'])} expired active items (Fixed: {report['expiry_audit']['quarantined_fixed']}).")
            self.stdout.write(self.style.SUCCESS("=" * 70))
