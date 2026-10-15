"""
StockPilot Enterprise Stock Replenishment & Reorder Optimization Engine
Implements:
- Wilson's Economic Order Quantity (EOQ) formula: sqrt((2 * D * S) / H)
- Dynamic Reorder Point (ROP) = (Daily Velocity * Lead Time) + Safety Stock
- Real-time Multi-Warehouse Stock Health Classification (Adequate, Warning, Critical, Stockout)
- Automated In-App Alert Notification Generation for Procurement Officers & Warehouse Managers
"""

import math
from decimal import Decimal
from typing import Dict, List, Optional, Any
from django.db.models import Sum
from django.utils import timezone


def calculate_eoq(
    annual_demand: float,
    order_cost: float = 500.0,
    holding_cost_rate: float = 0.20,
    unit_cost: float = 100.0
) -> int:
    """
    Computes Wilson's Economic Order Quantity (EOQ).
    
    Formula:
        EOQ = sqrt((2 * D * S) / H)
    Where:
        D = Annual demand velocity in units
        S = Fixed procurement order transaction cost (default: ₹500.00)
        H = Annual holding / carrying cost per unit (unit_cost * holding_cost_rate)
    """
    if annual_demand <= 0:
        return 0

    carrying_cost = max(unit_cost * holding_cost_rate, 1.0)
    numerator = 2.0 * float(annual_demand) * float(order_cost)
    raw_eoq = math.sqrt(numerator / carrying_cost)
    return max(1, int(round(raw_eoq)))


def calculate_reorder_point(
    daily_consumption: float,
    lead_time_days: int,
    safety_stock: Optional[int] = None,
    service_factor_z: float = 1.65,
    lead_time_std_dev: float = 1.5
) -> int:
    """
    Computes Reorder Point (ROP).
    If safety_stock is not provided, calculates statistical safety buffer:
        Safety Stock = Z * std_dev * sqrt(lead_time)
    """
    base_demand = float(daily_consumption) * max(1, lead_time_days)
    if safety_stock is not None:
        buffer_units = float(safety_stock)
    else:
        buffer_units = service_factor_z * lead_time_std_dev * math.sqrt(max(1, lead_time_days))

    return int(math.ceil(base_demand + buffer_units))


def evaluate_product_stock_health(
    product: Any,
    warehouse: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Evaluates current inventory levels against statutory reorder points
    for a given product, optionally scoped to a single warehouse.
    """
    from apps.inventory.models import StockItem

    qs = StockItem.objects.filter(product=product)
    if warehouse:
        qs = qs.filter(warehouse=warehouse)

    aggregates = qs.aggregate(
        total_on_hand=Sum('quantity_on_hand'),
        total_reserved=Sum('quantity_reserved'),
        total_quarantined=Sum('quantity_quarantined')
    )

    on_hand = aggregates['total_on_hand'] or 0
    reserved = aggregates['total_reserved'] or 0
    quarantined = aggregates['total_quarantined'] or 0
    available = max(0, on_hand - reserved - quarantined)

    reorder_level = product.reorder_level if product.reorder_level else 20
    lead_time = product.lead_time_days if product.lead_time_days else 7
    cost_price = float(product.cost_price or 100.0)

    # Health classification
    if available <= 0:
        status = 'STOCKOUT'
        urgency = 'critical'
    elif available <= int(reorder_level * 0.5):
        status = 'CRITICAL_REORDER_REQUIRED'
        urgency = 'critical'
    elif available <= reorder_level:
        status = 'LOW_STOCK_WARNING'
        urgency = 'warning'
    else:
        status = 'ADEQUATE'
        urgency = 'info'

    # Recommended replenishment quantity calculation
    annual_est = max(reorder_level * 12, 100)
    eoq = calculate_eoq(annual_est, unit_cost=cost_price)
    preferred_qty = product.preferred_reorder_quantity or 100

    if available < reorder_level:
        shortfall = reorder_level - available
        recommended_order = max(shortfall + preferred_qty, eoq)
    else:
        recommended_order = 0

    estimated_cost = round(Decimal(str(recommended_order)) * Decimal(str(product.cost_price or 0)), 2)

    return {
        'product_id': product.id,
        'sku': product.sku,
        'product_name': product.name,
        'uom': product.unit_of_measure,
        'warehouse_id': warehouse.id if warehouse else None,
        'warehouse_name': warehouse.name if warehouse else 'All Warehouses',
        'quantity_on_hand': on_hand,
        'quantity_reserved': reserved,
        'quantity_quarantined': quarantined,
        'quantity_available': available,
        'reorder_level': reorder_level,
        'lead_time_days': lead_time,
        'status': status,
        'urgency': urgency,
        'economic_order_quantity': eoq,
        'recommended_reorder_quantity': recommended_order,
        'cost_price': float(product.cost_price or 0.0),
        'estimated_reorder_value_inr': float(estimated_cost),
    }


def run_replenishment_audit(
    organization: Any,
    dispatch_notifications: bool = False
) -> Dict[str, Any]:
    """
    Runs an organizational audit across all active catalog products.
    Optionally dispatches in-app Notification records for at-risk items.
    """
    from apps.catalog.models import Product
    from apps.notifications.models import Notification

    products = Product.objects.filter(organization=organization, is_active=True).order_by('sku')
    results: List[Dict[str, Any]] = []

    stockout_count = 0
    critical_count = 0
    warning_count = 0
    adequate_count = 0
    total_reorder_value = Decimal("0.00")

    for prod in products:
        health = evaluate_product_stock_health(prod)
        results.append(health)

        if health['status'] == 'STOCKOUT':
            stockout_count += 1
            total_reorder_value += Decimal(str(health['estimated_reorder_value_inr']))
        elif health['status'] == 'CRITICAL_REORDER_REQUIRED':
            critical_count += 1
            total_reorder_value += Decimal(str(health['estimated_reorder_value_inr']))
        elif health['status'] == 'LOW_STOCK_WARNING':
            warning_count += 1
            total_reorder_value += Decimal(str(health['estimated_reorder_value_inr']))
        else:
            adequate_count += 1

        # Dispatch automated notification if requested
        if dispatch_notifications and health['status'] in ('STOCKOUT', 'CRITICAL_REORDER_REQUIRED', 'LOW_STOCK_WARNING'):
            notif_type = 'out_of_stock' if health['status'] == 'STOCKOUT' else 'low_stock'
            title = f"Stock Alert: {prod.sku} ({health['status']})"
            message = (
                f"Product '{prod.name}' is currently at {health['quantity_available']} {prod.unit_of_measure} "
                f"(Reorder Threshold: {health['reorder_level']}). Recommended PO Quantity: {health['recommended_reorder_quantity']}."
            )

            # Prevent duplicate unread alert flooding
            existing = Notification.objects.filter(
                organization=organization,
                notification_type=notif_type,
                title=title,
                is_read=False
            ).exists()

            if not existing:
                Notification.objects.create(
                    organization=organization,
                    notification_type=notif_type,
                    severity=health['urgency'],
                    title=title,
                    message=message,
                    link="/inventory"
                )

    return {
        'timestamp': timezone.now().isoformat(),
        'total_products_evaluated': len(results),
        'stockout_count': stockout_count,
        'critical_reorder_count': critical_count,
        'low_stock_warning_count': warning_count,
        'adequate_count': adequate_count,
        'total_recommended_reorder_budget_inr': float(total_reorder_value),
        'recommendations': results,
    }
