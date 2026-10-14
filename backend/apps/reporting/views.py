import csv
import io
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, Count, Avg, F, Q

from apps.catalog.models import Product
from apps.warehouses.models import Warehouse
from apps.inventory.models import StockItem, StockMovement
from apps.procurement.models import PurchaseOrder
from apps.suppliers.models import Supplier
from apps.sales.models import SalesOrder
from apps.dispatch.models import DispatchOrder
from apps.audits.models import AuditSession, AuditItem
from apps.forecasting.models import ForecastResult, ReorderRecommendation
from apps.auditlog.models import AuditLog
from apps.common.utils import format_inr

class ReportListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reports = [
            {'id': 'current_stock', 'name': '1. Current Stock Report', 'category': 'Inventory', 'description': 'Complete on-hand, reserved, and available quantities by SKU.'},
            {'id': 'warehouse_stock', 'name': '2. Warehouse-Wise Stock Report', 'category': 'Inventory', 'description': 'Stock breakdown across all active fulfillment and distribution hubs.'},
            {'id': 'stock_movement', 'name': '3. Product Movement Report', 'category': 'Inventory', 'description': 'Traceable transaction ledger entries across receipts, issues, and transfers.'},
            {'id': 'stock_valuation', 'name': '4. Stock Valuation Report', 'category': 'Financials', 'description': 'Weighted average cost inventory valuation in INR.'},
            {'id': 'low_stock', 'name': '5. Low-Stock Alert Report', 'category': 'Inventory', 'description': 'Items at or below configured reorder levels.'},
            {'id': 'out_of_stock', 'name': '6. Out-of-Stock Report', 'category': 'Inventory', 'description': 'Critical stockouts currently halting sales fulfillment.'},
            {'id': 'expiry_batch', 'name': '7. Expiry & Batch Report', 'category': 'Quality', 'description': 'Batches nearing expiry within 30, 60, or 90 days.'},
            {'id': 'purchase_orders', 'name': '8. Purchase Order Report', 'category': 'Procurement', 'description': 'Procurement order statuses, lead times, and fulfillment progress.'},
            {'id': 'supplier_performance', 'name': '9. Supplier Performance Report', 'category': 'Procurement', 'description': 'On-time delivery rates and order fulfillment metrics by vendor.'},
            {'id': 'sales_orders', 'name': '10. Sales Order Report', 'category': 'Sales', 'description': 'Customer demand, reservation statuses, and dispatch readiness.'},
            {'id': 'dispatch_operations', 'name': '11. Dispatch & Transit Report', 'category': 'Fulfillment', 'description': 'Shipments, vehicles, transporters, and delivery challan tracking.'},
            {'id': 'audit_variance', 'name': '12. Stock Audit Variance Report', 'category': 'Auditing', 'description': 'Discrepancies identified during physical stocktaking sessions.'},
            {'id': 'demand_forecast', 'name': '13. Demand Forecast Report', 'category': 'Intelligence', 'description': 'Projected 30-day demand and algorithm error rates (MAE, WAPE).'},
            {'id': 'reorder_recommendations', 'name': '14. Reorder Recommendation Report', 'category': 'Intelligence', 'description': 'AI-driven replenishment orders with safety stock and ROP.'},
            {'id': 'inventory_aging', 'name': '15. Inventory Aging Report', 'category': 'Inventory', 'description': 'Aging buckets (0-30d, 31-60d, 61-90d, 90d+) to identify slow-moving stock.'},
            {'id': 'audit_log', 'name': '16. User Activity & Security Log', 'category': 'Security', 'description': 'Timestamped user actions, logins, and sensitive data changes.'},
        ]
        return Response(reports)

class ReportDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, report_id):
        org = request.user.organization
        export_format = request.query_params.get('export') # 'csv' or None
        
        data = []
        columns = []

        if report_id == 'current_stock':
            columns = ['SKU', 'Product Name', 'Category', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'UOM', 'Unit Cost (INR)']
            items = StockItem.objects.filter(warehouse__organization=org).select_related('product', 'warehouse')
            for it in items:
                data.append({
                    'SKU': it.product.sku,
                    'Product Name': it.product.name,
                    'Category': it.product.category.name,
                    'Warehouse': it.warehouse.name,
                    'On Hand': it.quantity_on_hand,
                    'Reserved': it.quantity_reserved,
                    'Available': it.quantity_available,
                    'UOM': it.product.unit_of_measure,
                    'Unit Cost (INR)': float(it.unit_cost)
                })

        elif report_id == 'warehouse_stock':
            columns = ['Warehouse', 'Code', 'State', 'Total Capacity (sqft)', 'Total Stock Value (INR)', 'Item Count']
            whs = Warehouse.objects.filter(organization=org)
            for w in whs:
                items = StockItem.objects.filter(warehouse=w)
                val = sum(it.total_value for it in items)
                data.append({
                    'Warehouse': w.name,
                    'Code': w.code,
                    'State': w.state,
                    'Total Capacity (sqft)': float(w.total_capacity_sqft),
                    'Total Stock Value (INR)': float(val),
                    'Item Count': items.count()
                })

        elif report_id == 'stock_movement':
            columns = ['Date', 'Movement ID', 'Type', 'Product', 'Warehouse', 'Delta Qty', 'Resulting Bal', 'Ref Doc', 'Reason']
            movs = StockMovement.objects.filter(warehouse__organization=org).select_related('product', 'warehouse')[:100]
            for m in movs:
                data.append({
                    'Date': m.created_at.strftime('%Y-%m-%d %H:%M'),
                    'Movement ID': m.movement_id,
                    'Type': m.get_movement_type_display(),
                    'Product': f"{m.product.sku} - {m.product.name}",
                    'Warehouse': m.warehouse.code,
                    'Delta Qty': m.quantity,
                    'Resulting Bal': m.resulting_balance,
                    'Ref Doc': m.reference_document or '-',
                    'Reason': m.reason
                })

        elif report_id == 'stock_valuation':
            columns = ['SKU', 'Product Name', 'Category', 'Quantity On Hand', 'Unit Cost (INR)', 'Total Valuation (INR)']
            items = StockItem.objects.filter(warehouse__organization=org).select_related('product', 'warehouse')
            for it in items:
                data.append({
                    'SKU': it.product.sku,
                    'Product Name': it.product.name,
                    'Category': it.product.category.name,
                    'Quantity On Hand': it.quantity_on_hand,
                    'Unit Cost (INR)': float(it.unit_cost),
                    'Total Valuation (INR)': float(it.total_value)
                })

        elif report_id == 'low_stock':
            columns = ['SKU', 'Product Name', 'Available Stock', 'Reorder Level', 'Preferred Reorder Qty', 'Deficit']
            products = Product.objects.filter(organization=org, is_active=True)
            for p in products:
                items = StockItem.objects.filter(product=p)
                avail = sum(i.quantity_available for i in items)
                if 0 < avail <= p.reorder_level:
                    data.append({
                        'SKU': p.sku,
                        'Product Name': p.name,
                        'Available Stock': avail,
                        'Reorder Level': p.reorder_level,
                        'Preferred Reorder Qty': p.preferred_reorder_quantity,
                        'Deficit': p.reorder_level - avail
                    })

        elif report_id == 'out_of_stock':
            columns = ['SKU', 'Product Name', 'Category', 'Reorder Level', 'Preferred Order Qty', 'Lead Time Days']
            products = Product.objects.filter(organization=org, is_active=True)
            for p in products:
                items = StockItem.objects.filter(product=p)
                avail = sum(i.quantity_available for i in items)
                if avail <= 0:
                    data.append({
                        'SKU': p.sku,
                        'Product Name': p.name,
                        'Category': p.category.name,
                        'Reorder Level': p.reorder_level,
                        'Preferred Order Qty': p.preferred_reorder_quantity,
                        'Lead Time Days': p.lead_time_days
                    })

        elif report_id == 'supplier_performance':
            columns = ['Supplier Code', 'Supplier Name', 'City', 'On-Time Delivery %', 'Total Purchases (INR)', 'Lead Time Days']
            sups = Supplier.objects.filter(organization=org)
            for s in sups:
                data.append({
                    'Supplier Code': s.code,
                    'Supplier Name': s.name,
                    'City': s.city,
                    'On-Time Delivery %': s.on_time_delivery_rate,
                    'Total Purchases (INR)': float(s.total_purchases_value),
                    'Lead Time Days': s.lead_time_days
                })

        elif report_id == 'purchase_orders':
            columns = ['PO Number', 'Supplier', 'Warehouse', 'Order Date', 'Expected Date', 'Status', 'Total Amount (INR)']
            pos = PurchaseOrder.objects.filter(organization=org).select_related('supplier', 'destination_warehouse')[:100]
            for po in pos:
                data.append({
                    'PO Number': po.po_number,
                    'Supplier': po.supplier.name,
                    'Warehouse': po.destination_warehouse.code,
                    'Order Date': str(po.order_date),
                    'Expected Date': str(po.expected_delivery_date),
                    'Status': po.get_status_display(),
                    'Total Amount (INR)': float(po.total_amount)
                })

        elif report_id == 'sales_orders':
            columns = ['SO Number', 'Customer', 'City', 'Order Date', 'Status', 'Payment Status', 'Total Amount (INR)']
            sos = SalesOrder.objects.filter(organization=org).select_related('customer')[:100]
            for so in sos:
                data.append({
                    'SO Number': so.so_number,
                    'Customer': so.customer.name,
                    'City': so.customer.city,
                    'Order Date': str(so.order_date),
                    'Status': so.get_status_display(),
                    'Payment Status': so.get_payment_status_display(),
                    'Total Amount (INR)': float(so.total_amount)
                })

        elif report_id == 'dispatch_operations':
            columns = ['Dispatch No', 'Delivery Challan', 'SO Number', 'Customer', 'Transporter', 'Vehicle No', 'Status', 'Date']
            dsps = DispatchOrder.objects.filter(warehouse__organization=org).select_related('sales_order__customer')[:100]
            for d in dsps:
                data.append({
                    'Dispatch No': d.dispatch_number,
                    'Delivery Challan': d.delivery_challan_number,
                    'SO Number': d.sales_order.so_number,
                    'Customer': d.sales_order.customer.name,
                    'Transporter': d.transporter_name or '-',
                    'Vehicle No': d.vehicle_number or '-',
                    'Status': d.get_status_display(),
                    'Date': str(d.dispatch_date)
                })

        elif report_id == 'reorder_recommendations':
            columns = ['SKU', 'Product Name', 'Warehouse', 'Current Avail', 'ROP', 'Recommended Qty', 'Status', 'Order Date']
            recs = ReorderRecommendation.objects.filter(warehouse__organization=org).select_related('product', 'warehouse')[:100]
            for r in recs:
                data.append({
                    'SKU': r.product.sku,
                    'Product Name': r.product.name,
                    'Warehouse': r.warehouse.code,
                    'Current Avail': r.current_available,
                    'ROP': r.reorder_point,
                    'Recommended Qty': r.recommended_order_quantity,
                    'Status': r.get_status_display(),
                    'Order Date': str(r.suggested_order_date)
                })

        else:
            # Generic fallback / Audit Log
            columns = ['Timestamp', 'User', 'Action', 'Module', 'Description']
            logs = AuditLog.objects.filter(organization=org)[:100]
            for l in logs:
                data.append({
                    'Timestamp': l.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'User': l.user.email if l.user else 'System',
                    'Action': l.action,
                    'Module': l.module,
                    'Description': l.description
                })

        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="report_{report_id}.csv"'
            writer = csv.DictWriter(response, fieldnames=columns)
            writer.writeheader()
            for row in data:
                writer.writerow(row)
            return response

        return Response({
            'report_id': report_id,
            'columns': columns,
            'data': data,
            'total_rows': len(data),
            'generated_at': timezone.now().strftime('%Y-%m-%d %H:%M:%S IST')
        })
