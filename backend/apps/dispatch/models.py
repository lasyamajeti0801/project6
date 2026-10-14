from django.db import models

class DispatchOrder(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Dispatch Planned'),
        ('picking', 'Picking in Progress'),
        ('picked', 'Picked & Staged'),
        ('packed', 'Packed & Labelled'),
        ('dispatched', 'Dispatched / In Transit'),
        ('delivered', 'Delivered & Confirmed'),
        ('failed', 'Delivery Attempt Failed'),
        ('returned', 'Returned to Warehouse'),
    ]

    dispatch_number = models.CharField(max_length=40, unique=True)
    sales_order = models.ForeignKey('sales.SalesOrder', on_delete=models.PROTECT, related_name='dispatches')
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='dispatches')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    dispatch_date = models.DateField()
    
    # Transport & Indian Transit Compliance
    transporter_name = models.CharField(max_length=120, blank=True, null=True, help_text="e.g. VRL Logistics, Delhivery, TCI Express")
    vehicle_number = models.CharField(max_length=30, blank=True, null=True, help_text="e.g. MH-04-AZ-9214")
    driver_name = models.CharField(max_length=100, blank=True, null=True)
    driver_phone = models.CharField(max_length=20, blank=True, null=True)
    e_way_bill_number = models.CharField(max_length=40, blank=True, null=True, help_text="12-digit Indian E-Way Bill Reference")
    delivery_challan_number = models.CharField(max_length=40, unique=True)
    
    package_count = models.IntegerField(default=1)
    total_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    proof_of_delivery_notes = models.TextField(blank=True, null=True)
    dispatched_by = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='dispatches_handled')
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-dispatch_date', '-created_at']

    def __str__(self):
        return f"{self.dispatch_number} ({self.delivery_challan_number}) -> SO: {self.sales_order.so_number}"

class DispatchItem(models.Model):
    dispatch_order = models.ForeignKey(DispatchOrder, on_delete=models.CASCADE, related_name='items')
    sales_order_item = models.ForeignKey('sales.SalesOrderItem', on_delete=models.PROTECT)
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    quantity_dispatched = models.IntegerField()
    source_bin = models.ForeignKey('warehouses.Bin', on_delete=models.SET_NULL, null=True, blank=True)
    batch_number = models.CharField(max_length=60, blank=True, null=True)

    def __str__(self):
        return f"{self.dispatch_order.dispatch_number}: {self.product.sku} ({self.quantity_dispatched} units)"
