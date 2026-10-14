import numpy as np
import pandas as pd
from datetime import date, timedelta
from decimal import Decimal
from django.utils import timezone
from apps.forecasting.models import DailyDemandRecord, ForecastResult, ReorderRecommendation
from apps.catalog.models import Product
from apps.warehouses.models import Warehouse
from apps.inventory.models import StockItem
from apps.procurement.models import PurchaseOrder, PurchaseOrderItem
from apps.suppliers.models import Supplier

class DemandForecastingEngine:
    def __init__(self, product: Product, warehouse: Warehouse):
        self.product = product
        self.warehouse = warehouse

    def get_demand_series(self, lookback_days=90):
        start_date = timezone.now().date() - timedelta(days=lookback_days)
        records = DailyDemandRecord.objects.filter(
            product=self.product,
            warehouse=self.warehouse,
            date__gte=start_date
        ).order_by('date').values('date', 'quantity_demanded')

        if not records:
            # Fallback to empty series with zero demand
            date_range = pd.date_range(start=start_date, end=timezone.now().date(), freq='D')
            return pd.Series(0, index=date_range)

        df = pd.DataFrame(list(records))
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        # Resample daily and fill missing days with 0
        idx = pd.date_range(start=start_date, end=timezone.now().date(), freq='D')
        series = df['quantity_demanded'].reindex(idx, fill_value=0)
        return series

    def run_forecast(self, horizon_days=30):
        series = self.get_demand_series(lookback_days=90)
        
        # Check if cold start
        total_demand = series.sum()
        non_zero_days = (series > 0).sum()

        if non_zero_days < 5:
            # Cold-start handling
            avg_daily = float(np.mean(series)) if total_demand > 0 else 1.0
            projected = avg_daily * horizon_days
            explanation = (
                f"Cold-start heuristic applied for {self.product.sku}. Limited sales history "
                f"({non_zero_days} demand events over 90 days). Baseline rate: {avg_daily:.2f} units/day."
            )
            return ForecastResult.objects.create(
                product=self.product,
                warehouse=self.warehouse,
                horizon_days=horizon_days,
                method_used='moving_average_7d',
                avg_daily_demand=round(Decimal(avg_daily), 2),
                projected_demand=round(Decimal(projected), 2),
                mae_error=Decimal('0.00'),
                wape_error=Decimal('15.00'),
                confidence_score=Decimal('65.00'),
                explanation=explanation
            )

        # Backtesting: test Exponential Smoothing vs 7-day MA on last 14 days
        test_window = min(14, len(series) // 3)
        train = series.iloc[:-test_window]
        test = series.iloc[-test_window:]

        # Method 1: 7-day Moving Average
        ma_7_pred = train.rolling(window=7, min_periods=1).mean().iloc[-1]
        ma_errors = np.abs(test - ma_7_pred)
        mae_ma = float(ma_errors.mean())
        wape_ma = float(ma_errors.sum() / max(1, test.sum())) * 100

        # Method 2: Exponential Smoothing (alpha=0.3)
        exp_smooth = train.ewm(alpha=0.3, adjust=False).mean()
        exp_pred = exp_smooth.iloc[-1]
        exp_errors = np.abs(test - exp_pred)
        mae_exp = float(exp_errors.mean())
        wape_exp = float(exp_errors.sum() / max(1, test.sum())) * 100

        # Pick best method
        if wape_exp <= wape_ma:
            best_method = 'exponential_smoothing'
            chosen_daily = float(series.ewm(alpha=0.3, adjust=False).mean().iloc[-1])
            chosen_mae = mae_exp
            chosen_wape = min(wape_exp, 99.9)
        else:
            best_method = 'moving_average_7d'
            chosen_daily = float(series.rolling(window=7, min_periods=1).mean().iloc[-1])
            chosen_mae = mae_ma
            chosen_wape = min(wape_ma, 99.9)

        # Project demand
        chosen_daily = max(0.1, chosen_daily)
        projected = chosen_daily * horizon_days
        confidence = max(50.0, min(98.0, 100.0 - chosen_wape))

        explanation = (
            f"Evaluated against 90-day demand history ({non_zero_days} active sales days). "
            f"Backtesting selected {best_method} with MAE={chosen_mae:.2f} and WAPE={chosen_wape:.1f}%. "
            f"Projected demand for next {horizon_days} days is {projected:.0f} units ({chosen_daily:.2f}/day)."
        )

        forecast = ForecastResult.objects.create(
            product=self.product,
            warehouse=self.warehouse,
            horizon_days=horizon_days,
            method_used=best_method,
            avg_daily_demand=round(Decimal(chosen_daily), 2),
            projected_demand=round(Decimal(projected), 2),
            mae_error=round(Decimal(chosen_mae), 2),
            wape_error=round(Decimal(chosen_wape), 2),
            confidence_score=round(Decimal(confidence), 2),
            explanation=explanation
        )
        return forecast

    def generate_reorder_recommendation(self):
        forecast = self.run_forecast(horizon_days=30)
        daily_demand = float(forecast.avg_daily_demand)
        lead_time = self.product.lead_time_days or 7

        # Inventory position
        stock_items = StockItem.objects.filter(warehouse=self.warehouse, product=self.product)
        on_hand = sum(item.quantity_on_hand for item in stock_items)
        reserved = sum(item.quantity_reserved for item in stock_items)
        available = max(0, on_hand - reserved)

        # Incoming on order from open POs
        incoming = 0
        open_pos = PurchaseOrder.objects.filter(
            destination_warehouse=self.warehouse,
            status__in=['approved', 'sent', 'partially_received']
        )
        for po in open_pos:
            for item in po.items.filter(product=self.product):
                incoming += max(0, item.quantity_ordered - item.quantity_received)

        # Lead time demand & standard deviation
        series = self.get_demand_series(lookback_days=60)
        std_dev = float(series.std()) if len(series) > 1 and series.std() > 0 else (daily_demand * 0.35)
        
        # Safety stock formula: Z * sigma * sqrt(lead_time), Z=1.65 for 95% service level
        z_score = 1.65
        safety_stock = int(np.ceil(z_score * std_dev * np.sqrt(lead_time)))
        safety_stock = max(5, safety_stock)

        lead_time_demand = daily_demand * lead_time
        reorder_point = int(np.ceil(lead_time_demand + safety_stock))

        # Net effective inventory
        effective_inventory = available + incoming

        # Check stockout date
        if daily_demand > 0:
            days_to_stockout = int(available / daily_demand)
            estimated_stockout = timezone.now().date() + timedelta(days=days_to_stockout)
        else:
            estimated_stockout = None

        # Reorder quantity: target coverage 30 days
        target_coverage_days = 30
        target_demand = int(np.ceil(daily_demand * target_coverage_days))
        recommended_qty = max(self.product.preferred_reorder_quantity, target_demand)

        # Suggested order date
        if effective_inventory <= reorder_point:
            suggested_date = timezone.now().date() # Immediate replenishment needed!
            rec_status = 'pending_review'
            explanation = (
                f"REPLENISHMENT REQUIRED IMMEDIATELY. Effective inventory ({effective_inventory}) "
                f"has breached Reorder Point ({reorder_point}). Lead time is {lead_time} days. "
                f"Estimated stockout date: {estimated_stockout}. Order {recommended_qty} {self.product.unit_of_measure} "
                f"to maintain 95% service level and {target_coverage_days} days coverage."
            )
        else:
            days_until_rop = int((effective_inventory - reorder_point) / max(0.1, daily_demand))
            suggested_date = timezone.now().date() + timedelta(days=days_until_rop)
            rec_status = 'deferred'
            explanation = (
                f"Healthy inventory position. Effective inventory ({effective_inventory}) exceeds Reorder Point ({reorder_point}). "
                f"Next replenishment estimated on {suggested_date}."
            )

        # Best supplier
        supplier = Supplier.objects.filter(organization=self.warehouse.organization, is_active=True).first()

        rec = ReorderRecommendation.objects.create(
            product=self.product,
            warehouse=self.warehouse,
            supplier=supplier,
            current_on_hand=on_hand,
            current_reserved=reserved,
            current_available=available,
            incoming_on_order=incoming,
            lead_time_days=lead_time,
            expected_lead_time_demand=round(Decimal(lead_time_demand), 2),
            safety_stock_required=safety_stock,
            reorder_point=reorder_point,
            recommended_order_quantity=recommended_qty,
            suggested_order_date=suggested_date,
            estimated_stockout_date=estimated_stockout,
            status=rec_status,
            explanation=explanation
        )
        return rec
