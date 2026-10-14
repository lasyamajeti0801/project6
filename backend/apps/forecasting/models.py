from django.db import models
from decimal import Decimal

class DailyDemandRecord(models.Model):
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='demand_history')
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.CASCADE, related_name='demand_history')
    date = models.DateField()
    quantity_demanded = models.IntegerField(default=0)
    quantity_fulfilled = models.IntegerField(default=0)
    lost_sales = models.IntegerField(default=0)

    class Meta:
        unique_together = ('product', 'warehouse', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.date} - {self.product.sku} @ {self.warehouse.code}: {self.quantity_demanded} units"

class ForecastResult(models.Model):
    METHOD_CHOICES = [
        ('moving_average_7d', '7-Day Moving Average'),
        ('moving_average_30d', '30-Day Moving Average'),
        ('exponential_smoothing', 'Exponential Smoothing (Holt-Winters / Alpha 0.3)'),
        ('weighted_trend', 'Weighted Trend Decomposition'),
    ]

    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='forecast_results')
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.CASCADE, related_name='forecast_results')
    forecast_date = models.DateField(auto_now_add=True)
    horizon_days = models.IntegerField(default=30)
    method_used = models.CharField(max_length=40, choices=METHOD_CHOICES, default='exponential_smoothing')
    avg_daily_demand = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    projected_demand = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    mae_error = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Mean Absolute Error")
    wape_error = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Weighted Absolute Percentage Error %")
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, default=85.00)
    explanation = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-forecast_date']

    def __str__(self):
        return f"Forecast for {self.product.sku} ({self.horizon_days}d): {self.projected_demand} units ({self.method_used})"

class ReorderRecommendation(models.Model):
    STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('approved_to_po', 'Approved & Draft PO Created'),
        ('rejected', 'Rejected by Manager'),
        ('deferred', 'Deferred for Next Cycle'),
    ]

    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='reorder_recommendations')
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.CASCADE, related_name='reorder_recommendations')
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.SET_NULL, null=True, blank=True)
    generated_date = models.DateField(auto_now_add=True)
    current_on_hand = models.IntegerField(default=0)
    current_reserved = models.IntegerField(default=0)
    current_available = models.IntegerField(default=0)
    incoming_on_order = models.IntegerField(default=0)
    lead_time_days = models.IntegerField(default=7)
    expected_lead_time_demand = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    safety_stock_required = models.IntegerField(default=20)
    reorder_point = models.IntegerField(default=50)
    recommended_order_quantity = models.IntegerField(default=100)
    suggested_order_date = models.DateField()
    estimated_stockout_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_review')
    resulting_purchase_order = models.ForeignKey('procurement.PurchaseOrder', on_delete=models.SET_NULL, null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    explanation = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-generated_date']

    def __str__(self):
        return f"Reorder Rec: {self.product.sku} -> Order {self.recommended_order_quantity} units (Status: {self.status})"
