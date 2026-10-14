import random
import numpy as np
from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.accounts.models import User, Organization
from apps.warehouses.models import Warehouse, Zone, Aisle, Rack, Shelf, Bin
from apps.catalog.models import Category, Product
from apps.inventory.models import StockItem, StockMovement
from apps.suppliers.models import Supplier
from apps.procurement.models import PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptItem
from apps.sales.models import Customer, SalesOrder, SalesOrderItem
from apps.dispatch.models import DispatchOrder, DispatchItem
from apps.audits.models import AuditSession, AuditItem
from apps.forecasting.models import DailyDemandRecord
from apps.forecasting.engine import DemandForecastingEngine
from apps.notifications.models import Notification
from apps.auditlog.models import AuditLog
from apps.common.utils import generate_code

class Command(BaseCommand):
    help = 'Seeds realistic demonstration data for Bharat DistroLogix Pvt Ltd'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting StockPilot Indian Business Demonstration Data Seeding..."))

        with transaction.atomic():
            # 1. Organization
            org, _ = Organization.objects.get_or_create(
                code='BDL',
                defaults={
                    'name': 'Bharat DistroLogix Pvt Ltd',
                    'business_type': 'distributor',
                    'gstin': '27AABCB1234F1Z8',
                    'pan': 'AABCB1234F',
                    'address': 'Plot No. 42-B, Logistics Park, Mankoli Road, Bhiwandi',
                    'city': 'Thane / Mumbai',
                    'state': 'Maharashtra',
                    'pin_code': '421302',
                    'primary_contact_name': 'Rajesh Sharma',
                    'primary_contact_email': 'rajesh@bharatdistro.in',
                    'primary_contact_phone': '+91 98201 12345',
                    'currency': 'INR'
                }
            )

            # 2. Staff Users
            users_data = [
                ('admin@stockpilot.in', 'Rajesh', 'Sharma', 'org_owner', '+91 98201 12345'),
                ('warehouse.mgr@stockpilot.in', 'Vikram', 'Malhotra', 'warehouse_manager', '+91 98190 23456'),
                ('procurement@stockpilot.in', 'Sunita', 'Deshmukh', 'procurement_officer', '+91 98205 34567'),
                ('sales@stockpilot.in', 'Anand', 'Patel', 'sales_manager', '+91 98330 45678'),
                ('auditor@stockpilot.in', 'Pooja', 'Iyer', 'stock_auditor', '+91 98700 56789'),
            ]

            users_map = {}
            for email, fname, lname, role, phone in users_data:
                u, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email,
                        'first_name': fname,
                        'last_name': lname,
                        'role': role,
                        'phone_number': phone,
                        'organization': org,
                        'theme_preference': 'light'
                    }
                )
                u.set_password('StockPilot@2026')
                u.save()
                users_map[role] = u

            admin_user = users_map['org_owner']

            # 3. Warehouses
            wh_data = [
                ('WH-BHW-01', 'Bhiwandi Central Fulfillment Hub', 'fulfillment_center', 'Mankoli Road, Dapode, Bhiwandi', 'Bhiwandi', 'Thane', 'Maharashtra', '421302', 'Vikram Malhotra', '+91 98190 23456', 45000.00),
                ('WH-GGN-02', 'Gurugram Regional Distribution Hub', 'distribution_hub', 'Plot 18, Sector 37, Pace City II', 'Gurugram', 'Gurugram', 'Haryana', '122001', 'Harish Rawat', '+91 98110 33445', 30000.00),
                ('WH-BLR-03', 'Peenya Logistics & Tech Hub', 'distribution_hub', '4th Phase, Peenya Industrial Area', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560058', 'Karthik Rao', '+91 98450 77889', 25000.00),
            ]

            warehouses = []
            for code, name, w_type, addr, city, dist, st, pin, contact, phone, cap in wh_data:
                w, _ = Warehouse.objects.get_or_create(
                    organization=org,
                    code=code,
                    defaults={
                        'name': name,
                        'warehouse_type': w_type,
                        'address': addr,
                        'city': city,
                        'district': dist,
                        'state': st,
                        'pin_code': pin,
                        'contact_person': contact,
                        'phone_number': phone,
                        'total_capacity_sqft': Decimal(str(cap)),
                        'utilized_capacity_sqft': Decimal(str(cap * 0.65))
                    }
                )
                warehouses.append(w)

            primary_wh = warehouses[0]
            delhi_wh = warehouses[1]
            blr_wh = warehouses[2]

            # Create Location Structure for Primary Warehouse (Zones -> Aisles -> Racks -> Shelves -> Bins)
            zones_data = [
                ('Z-A', 'General Ambient A', 'ambient'),
                ('Z-B', 'High-Density Pallet B', 'ambient'),
                ('Z-C', 'Quarantine & QC Inspection', 'quarantine'),
                ('Z-D', 'High-Value Secure Cage', 'high_value'),
            ]
            primary_bins = []
            for z_code, z_name, z_type in zones_data:
                zone, _ = Zone.objects.get_or_create(warehouse=primary_wh, code=z_code, defaults={'name': z_name, 'zone_type': z_type})
                for aisle_no in range(1, 3):
                    aisle, _ = Aisle.objects.get_or_create(zone=zone, code=f"A{aisle_no:02d}")
                    for rack_no in range(1, 3):
                        rack, _ = Rack.objects.get_or_create(aisle=aisle, code=f"R{rack_no:02d}")
                        for shelf_no in range(1, 3):
                            shelf, _ = Shelf.objects.get_or_create(rack=rack, code=f"S{shelf_no:02d}")
                            for bin_no in range(1, 3):
                                bin_obj, _ = Bin.objects.get_or_create(shelf=shelf, code=f"BIN-{bin_no:02d}")
                                primary_bins.append(bin_obj)

            # 4. Categories
            cat_data = [
                ('Industrial Automation & Controls', 'IND-AUTO', 'Sensors, relays, PLCs, pneumatic valves and actuators'),
                ('Solar & Clean Energy Storage', 'SOLAR-EN', 'Solar inverters, MPPT charge controllers, lithium storage cells'),
                ('Healthcare & Diagnostic Supplies', 'HLTH-CARE', 'Clinical diagnostic monitors, PPE kits, sterile testing consumables'),
                ('Precision Electronics & Hardware', 'PREC-ELEC', 'Semiconductor controllers, terminal blocks, wiring harnesses'),
                ('Heavy Commercial Packing & Fasteners', 'PACK-FAST', 'Corrugated heavy cartons, steel strapping, brass hex fasteners'),
            ]
            categories = []
            for cname, ccode, cdesc in cat_data:
                cat, _ = Category.objects.get_or_create(
                    organization=org,
                    code=ccode,
                    defaults={'name': cname, 'description': cdesc}
                )
                categories.append(cat)

            # 5. Products
            products_data = [
                ('PLC-MOD-24V', 'Omron Compatible Modular PLC Controller 24VDC', categories[0], 'Omron Automation', 'PCS', '85371000', 18.00, 4800.00, 7200.00, 15, 60, 10),
                ('PROX-SNSR-M18', 'Inductive Proximity Sensor M18 PNP NO Flush', categories[0], 'Pepperl+Fuchs', 'PCS', '85414011', 18.00, 650.00, 1150.00, 40, 200, 7),
                ('SOL-INV-5KW', 'Luminous Hybrid Solar Inverter 5kVA 48V Pure Sine Wave', categories[1], 'Luminous Power', 'PCS', '85044090', 12.00, 28500.00, 39900.00, 8, 30, 14),
                ('LFP-BAT-100AH', 'Lithium Iron Phosphate (LiFePO4) 12.8V 100Ah Smart Battery Pack', categories[1], 'Exide Leoch', 'PCS', '85076000', 18.00, 16200.00, 22800.00, 12, 45, 12),
                ('OXY-MON-DIG', 'Digital Pulse Oximeter & SpO2 Finger Sensor Pro', categories[2], 'BPL Medical', 'PCS', '90181990', 12.00, 580.00, 1250.00, 50, 250, 5),
                ('INF-THERM-IR', 'Non-Contact Infrared Forehead Clinical Thermometer', categories[2], 'Dr. Trust India', 'PCS', '90251920', 12.00, 720.00, 1450.00, 35, 150, 6),
                ('TERM-BLK-DIN', 'WAGO 2.5mm² TopJob S Push-in DIN Rail Terminal Block (Box of 50)', categories[3], 'WAGO India', 'BOX', '85369090', 18.00, 1250.00, 1950.00, 25, 100, 8),
                ('SMD-LED-5050', 'High-Lumen SMD 5050 Warm White LED Reels (1000 Pcs)', categories[3], 'Havells Industrial', 'ROLL', '85414100', 18.00, 890.00, 1480.00, 30, 120, 7),
                ('STRAP-PET-19', 'High-Tensile Polyester (PET) Strapping Roll 19mm x 0.8mm', categories[4], 'Signode India', 'ROLL', '39202090', 18.00, 1850.00, 2650.00, 20, 80, 5),
                ('FAST-BRS-M6', 'Precision Brass Hex Standoff Spacer M6 x 30mm (Pack of 100)', categories[4], 'Jamnagar Fasteners', 'PKT', '74153390', 18.00, 340.00, 590.00, 45, 200, 6),
                ('PNEU-VALV-52', 'Festo Type 5/2 Way Solenoid Air Directional Valve 24VDC', categories[0], 'Janatics Pneumatics', 'PCS', '84812000', 18.00, 1450.00, 2350.00, 20, 80, 9),
                ('SOL-MPPT-60A', 'SmartSolar MPPT Solar Charge Controller 150V / 60A', categories[1], 'Microtek Energy', 'PCS', '85044090', 12.00, 8400.00, 12900.00, 10, 40, 10),
            ]

            products = []
            for sku, pname, cat, brand, uom, hsn, gst, cost, sell, rop, roq, lead in products_data:
                p, _ = Product.objects.get_or_create(
                    organization=org,
                    sku=sku,
                    defaults={
                        'name': pname,
                        'category': cat,
                        'brand': brand,
                        'unit_of_measure': uom,
                        'hsn_code': hsn,
                        'gst_rate': Decimal(str(gst)),
                        'cost_price': Decimal(str(cost)),
                        'selling_price': Decimal(str(sell)),
                        'reorder_level': rop,
                        'preferred_reorder_quantity': roq,
                        'lead_time_days': lead,
                        'barcode_value': sku,
                        'has_batch_tracking': True,
                        'has_expiry': cat.code == 'HLTH-CARE'
                    }
                )
                products.append(p)

            # 6. Suppliers
            suppliers_data = [
                ('SUP-DEL-01', 'Apex Automation & Robotics Components India Ltd', 'Sanjay Khanna', '+91 11 2684 5511', 'sales@apexautomation.co.in', 'Okhla Industrial Area Phase III', 'New Delhi', 'Delhi', '110020', '07AACCA1122F1Z1', 'AACCA1122F', 'net_30', 8),
                ('SUP-MUM-02', 'Sahyadri Power Solutions & Inverters LLP', 'Prashant Kadam', '+91 22 2778 1234', 'orders@sahyadripower.com', 'MIDC Industrial Area, Turbhe, Navi Mumbai', 'Navi Mumbai', 'Maharashtra', '400705', '27AAMFS4433K1Z4', 'AAMFS4433K', 'net_45', 12),
                ('SUP-AHM-03', 'Gujarat Diagnostic Devices & Pharma Supplies', 'Ketan Patel', '+91 79 2658 9988', 'b2b@gujaratdiag.in', 'GIDC Estate, Naroda', 'Ahmedabad', 'Gujarat', '382330', '24AAECG7788J1Z9', 'AAECG7788J', 'net_15', 6),
                ('SUP-BLR-04', 'Deccan Precision Fasteners & Packaging Hub', 'Naveen Kumar', '+91 80 2314 6655', 'supply@deccanfasteners.com', 'Bommasandra Industrial Area', 'Bengaluru', 'Karnataka', '560099', '29AABFD3322H1Z5', 'AABFD3322H', 'immediate', 5),
            ]

            suppliers = []
            for scode, sname, cname, phone, email, addr, city, st, pin, gstin, pan, terms, lead in suppliers_data:
                sup, _ = Supplier.objects.get_or_create(
                    organization=org,
                    code=scode,
                    defaults={
                        'name': sname,
                        'contact_person': cname,
                        'phone_number': phone,
                        'email': email,
                        'billing_address': addr,
                        'city': city,
                        'state': st,
                        'pin_code': pin,
                        'gstin': gstin,
                        'pan': pan,
                        'payment_terms': terms,
                        'lead_time_days': lead
                    }
                )
                suppliers.append(sup)

            # 7. Customers
            customers_data = [
                ('CUST-MUM-01', 'Reliance Retail Enterprises Distribution Hub', 'Manoj Vernekar', '+91 22 4477 8899', 'vendor.desk@relianceretail.com', 'Ghansoli Reliance Corporate Park', 'Thane Belapur Road', 'Navi Mumbai', 'Maharashtra', '400701', '27AAACR1234M1Z2', 2500000.00),
                ('CUST-DEL-02', 'Metro Cash & Carry Wholesale North Hub', 'Gaurav Mehra', '+91 11 4155 7766', 'procurement@metrocc.in', 'Shahdara Industrial Area', 'G.T. Road Shahdara', 'East Delhi', 'Delhi', '110092', '07AABCM9988P1Z6', 1500000.00),
                ('CUST-BLR-03', 'Titan Engineering & Automation Systems', 'Ramesh Sundaram', '+91 80 6677 3344', 'stores@titansystems.co.in', 'Electronic City Phase 1', 'Hosur Main Road', 'Bengaluru', 'Karnataka', '560100', '29AAACT5566R1Z3', 1800000.00),
                ('CUST-PUN-04', 'Bharat Forge Industrial Assembly Plants', 'Sandeep Kulkarni', '+91 20 2670 1200', 'materials@bharatforge.com', 'Mundhwa Industrial Area', 'Pune Cantonment Road', 'Pune', 'Maharashtra', '411036', '27AAACB1100G1Z1', 2000000.00),
            ]

            customers = []
            for ccode, cname, contact, phone, email, bill, ship, city, st, pin, gstin, credit in customers_data:
                c, _ = Customer.objects.get_or_create(
                    organization=org,
                    code=ccode,
                    defaults={
                        'name': cname,
                        'contact_person': contact,
                        'phone_number': phone,
                        'email': email,
                        'billing_address': bill,
                        'shipping_address': ship,
                        'city': city,
                        'state': st,
                        'pin_code': pin,
                        'gstin': gstin,
                        'credit_limit': Decimal(str(credit))
                    }
                )
                customers.append(c)

            # 8. Stock Items & Opening Balances
            self.stdout.write("Initializing warehouse inventory balances and stock movements...")
            stock_quantities = [85, 310, 18, 42, 190, 80, 140, 180, 65, 320, 95, 28]

            for idx, p in enumerate(products):
                qty = stock_quantities[idx % len(stock_quantities)]
                target_bin = primary_bins[idx % len(primary_bins)]
                batch_code = f"BAT-2026-{idx+1:03d}"
                exp_date = (timezone.now().date() + timedelta(days=240)) if p.has_expiry else None

                si, _ = StockItem.objects.get_or_create(
                    warehouse=primary_wh,
                    bin=target_bin,
                    product=p,
                    batch_number=batch_code,
                    defaults={
                        'quantity_on_hand': qty,
                        'quantity_reserved': int(qty * 0.15),
                        'quantity_quarantined': 2 if idx == 2 else 0,
                        'unit_cost': p.cost_price,
                        'expiry_date': exp_date
                    }
                )

                # Record Opening Balance movement in ledger
                StockMovement.objects.get_or_create(
                    movement_id=f"MOV-INIT-{p.sku}",
                    defaults={
                        'product': p,
                        'warehouse': primary_wh,
                        'bin': target_bin,
                        'batch_number': batch_code,
                        'movement_type': 'opening_balance',
                        'quantity': qty,
                        'previous_balance': 0,
                        'resulting_balance': qty,
                        'unit_cost': p.cost_price,
                        'reference_document': 'OP-BAL-FY26',
                        'reason': 'Initial financial year stock migration and physical verification',
                        'created_by': admin_user
                    }
                )

                # Also seed some stock in Delhi and Bengaluru warehouses
                StockItem.objects.get_or_create(
                    warehouse=delhi_wh,
                    product=p,
                    defaults={'quantity_on_hand': int(qty * 0.4), 'unit_cost': p.cost_price}
                )
                StockItem.objects.get_or_create(
                    warehouse=blr_wh,
                    product=p,
                    defaults={'quantity_on_hand': int(qty * 0.35), 'unit_cost': p.cost_price}
                )

            # 9. 90-Day Daily Demand History (for realistic forecasting backtesting!)
            self.stdout.write("Generating 90 days of empirical daily demand records for forecasting engine...")
            today = timezone.now().date()
            for day_offset in range(90, 0, -1):
                cur_date = today - timedelta(days=day_offset)
                # Weekdays have higher demand than Sundays
                is_weekend = cur_date.weekday() in [5, 6]
                
                for p in products:
                    base_mean = 4.0 if 'PLC' in p.sku or 'INV' in p.sku else 14.0
                    if is_weekend:
                        base_mean *= 0.3
                    # Add mild trend
                    trend_factor = 1.0 + ((90 - day_offset) / 300.0)
                    demanded = max(0, int(np.random.poisson(base_mean * trend_factor)))
                    
                    DailyDemandRecord.objects.get_or_create(
                        product=p,
                        warehouse=primary_wh,
                        date=cur_date,
                        defaults={
                            'quantity_demanded': demanded,
                            'quantity_fulfilled': demanded,
                            'lost_sales': 0
                        }
                    )

            # 10. Purchase Orders & Goods Receipts
            self.stdout.write("Seeding Purchase Orders and Goods Receipt Notes (GRNs)...")
            po1 = PurchaseOrder.objects.create(
                po_number='PO-2026-00041',
                organization=org,
                supplier=suppliers[0],
                destination_warehouse=primary_wh,
                status='received',
                order_date=today - timedelta(days=22),
                expected_delivery_date=today - timedelta(days=14),
                payment_terms='Net 30 Days',
                created_by=users_map['procurement_officer'],
                approved_by=admin_user
            )
            PurchaseOrderItem.objects.create(
                purchase_order=po1,
                product=products[0],
                quantity_ordered=40,
                quantity_received=40,
                unit_cost=products[0].cost_price,
                gst_rate=products[0].gst_rate
            )
            po1.recalculate_totals()

            # GRN for PO1
            grn1 = GoodsReceiptNote.objects.create(
                grn_number='GRN-2026-00018',
                purchase_order=po1,
                received_warehouse=primary_wh,
                received_date=today - timedelta(days=14),
                supplier_invoice_number='INV-APEX-8821',
                supplier_invoice_date=today - timedelta(days=16),
                e_way_bill_number='281099238411',
                received_by=users_map['warehouse_manager'],
                is_on_time=True,
                notes='Full shipment received in factory sealed cartons. Quality cleared.'
            )
            GoodsReceiptItem.objects.create(
                grn=grn1,
                po_item=po1.items.first(),
                product=products[0],
                quantity_received=40,
                quantity_damaged=0,
                target_bin=primary_bins[0],
                batch_number='BAT-2026-REC-01'
            )

            # Open PO2
            po2 = PurchaseOrder.objects.create(
                po_number='PO-2026-00052',
                organization=org,
                supplier=suppliers[1],
                destination_warehouse=primary_wh,
                status='sent',
                order_date=today - timedelta(days=3),
                expected_delivery_date=today + timedelta(days=9),
                payment_terms='Net 45 Days',
                created_by=users_map['procurement_officer'],
                approved_by=admin_user
            )
            PurchaseOrderItem.objects.create(
                purchase_order=po2,
                product=products[2],
                quantity_ordered=25,
                quantity_received=0,
                unit_cost=products[2].cost_price,
                gst_rate=products[2].gst_rate
            )
            po2.recalculate_totals()

            # 11. Sales Orders & Dispatches
            self.stdout.write("Seeding Sales Orders and Dispatches with Delivery Challans...")
            so1 = SalesOrder.objects.create(
                so_number='SO-2026-00092',
                organization=org,
                customer=customers[0],
                source_warehouse=primary_wh,
                status='delivered',
                payment_status='paid',
                order_date=today - timedelta(days=10),
                expected_dispatch_date=today - timedelta(days=8),
                created_by=users_map['sales_manager']
            )
            SalesOrderItem.objects.create(
                sales_order=so1,
                product=products[4], # Oximeter
                quantity_ordered=30,
                quantity_reserved=30,
                quantity_dispatched=30,
                unit_price=products[4].selling_price,
                gst_rate=products[4].gst_rate
            )
            so1.recalculate_totals()

            dsp1 = DispatchOrder.objects.create(
                dispatch_number='DSP-2026-00045',
                delivery_challan_number='DC-2026-00045',
                sales_order=so1,
                warehouse=primary_wh,
                status='delivered',
                dispatch_date=today - timedelta(days=8),
                transporter_name='VRL Logistics Ltd',
                vehicle_number='MH-04-AZ-9214',
                driver_name='Suresh Jadhav',
                driver_phone='+91 99201 55667',
                e_way_bill_number='241088921477',
                package_count=4,
                total_weight_kg=Decimal('48.50'),
                proof_of_delivery_notes='Signed copy stamped by Reliance Central Receiving Dock.',
                dispatched_by=users_map['warehouse_manager'],
                delivered_at=timezone.now() - timedelta(days=6)
            )
            DispatchItem.objects.create(
                dispatch_order=dsp1,
                sales_order_item=so1.items.first(),
                product=products[4],
                quantity_dispatched=30
            )

            # Active Sales Order 2 (In Picking / Ready for Dispatch)
            so2 = SalesOrder.objects.create(
                so_number='SO-2026-00108',
                organization=org,
                customer=customers[2], # Titan
                source_warehouse=primary_wh,
                status='reserved',
                payment_status='pending',
                order_date=today - timedelta(days=1),
                expected_dispatch_date=today + timedelta(days=1),
                created_by=users_map['sales_manager']
            )
            SalesOrderItem.objects.create(
                sales_order=so2,
                product=products[0],
                quantity_ordered=8,
                quantity_reserved=8,
                unit_price=products[0].selling_price,
                gst_rate=products[0].gst_rate
            )
            so2.recalculate_totals()

            # 12. Run Intelligent Demand Forecasting Engine
            self.stdout.write("Executing DemandForecastingEngine algorithms on demo catalog...")
            for p in products[:6]:
                engine = DemandForecastingEngine(p, primary_wh)
                engine.generate_reorder_recommendation()

            # 13. Stock Audits
            self.stdout.write("Seeding Stocktake Audit Sessions with variance reconciliation...")
            aud = AuditSession.objects.create(
                audit_number='AUD-2026-0008',
                warehouse=primary_wh,
                audit_type='cycle_count',
                status='approved',
                is_blind_count=True,
                scheduled_date=today - timedelta(days=5),
                started_at=timezone.now() - timedelta(days=5, hours=8),
                completed_at=timezone.now() - timedelta(days=5, hours=4),
                auditor=users_map['stock_auditor'],
                supervisor=users_map['warehouse_manager'],
                notes='Monthly cycle count of Zone A high-velocity bins.'
            )
            for idx, p in enumerate(products[:4]):
                AuditItem.objects.create(
                    audit_session=aud,
                    product=p,
                    bin=primary_bins[idx],
                    system_quantity=80,
                    physical_quantity=80 if idx != 1 else 78, # 2 units variance on item 1
                    unit_cost=p.cost_price,
                    status='reconciled',
                    discrepancy_reason='Minor carton dent damage quarantined' if idx == 1 else 'Count verified'
                )

            # 14. Notifications
            self.stdout.write("Populating in-app notifications...")
            notifs = [
                ('low_stock', 'warning', 'Low Stock Warning: Solar Inverter 5kVA', 'Stock level at Bhiwandi Central is currently 18 units (Reorder point: 25). Review replenishment order.', '/forecasting'),
                ('reorder_rec', 'info', 'Replenishment Recommendation Ready', 'Forecasting engine has generated 6 new reorder suggestions based on 90-day trend velocity.', '/forecasting'),
                ('approval_needed', 'warning', 'Purchase Order Approval Pending', 'PO-2026-00052 awaiting executive authorization for Sahyadri Power Solutions.', '/purchase-orders'),
                ('dispatch_due', 'info', 'Dispatch Scheduled Today: SO-2026-00108', 'Titan Engineering consignment staged in Zone A Bay 2 ready for transporter pickup.', '/dispatches'),
            ]
            for ntype, sev, title, msg, link in notifs:
                Notification.objects.create(
                    organization=org,
                    notification_type=ntype,
                    severity=sev,
                    title=title,
                    message=msg,
                    link=link,
                    is_read=False
                )

            # 15. Audit Log
            AuditLog.objects.create(
                organization=org,
                user=admin_user,
                action='SYSTEM_DEMO_SEED',
                module='ADMIN',
                description='Demonstration environment populated with Indian distributor BDL dataset.',
                ip_address='127.0.0.1'
            )

        self.stdout.write(self.style.SUCCESS("""
========================================================================
STOCKPILOT DEMONSTRATION DATA SEEDING COMPLETE!
========================================================================
Company: Bharat DistroLogix Pvt Ltd (GSTIN: 27AABCB1234F1Z8, Mumbai)
Warehouses:
  1. Bhiwandi Central Fulfillment Hub (WH-BHW-01) - 45,000 sqft
  2. Gurugram Regional Distribution Hub (WH-GGN-02) - 30,000 sqft
  3. Peenya Logistics Tech Hub (WH-BLR-03) - 25,000 sqft

Demo Credentials:
  - Email: admin@stockpilot.in
  - Password: StockPilot@2026
  - Role: Organization Owner (Full System Access)

Additional Staff Logins (Password: StockPilot@2026):
  - warehouse.mgr@stockpilot.in  (Warehouse Manager)
  - procurement@stockpilot.in    (Procurement Officer)
  - sales@stockpilot.in          (Sales Manager)
  - auditor@stockpilot.in        (Stock Auditor)
========================================================================
"""))
