from django.db import models
from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal

class StockItem(models.Model):
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.CASCADE, related_name='stock_items')
    bin = models.ForeignKey('warehouses.Bin', on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_items')
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='stock_items')
    quantity_on_hand = models.IntegerField(default=0)
    quantity_reserved = models.IntegerField(default=0)
    quantity_quarantined = models.IntegerField(default=0)
    batch_number = models.CharField(max_length=60, blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Weighted average cost")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('warehouse', 'bin', 'product', 'batch_number')
        ordering = ['product__name']

    def __str__(self):
        return f"{self.product.sku} @ {self.warehouse.code} (On hand: {self.quantity_on_hand})"

    @property
    def quantity_available(self):
        available = self.quantity_on_hand - self.quantity_reserved - self.quantity_quarantined
        return max(0, available)

    @property
    def total_value(self):
        return round(Decimal(self.quantity_on_hand) * self.unit_cost, 2)

class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ('opening_balance', 'Opening Balance'),
        ('purchase_receipt', 'Purchase Receipt (GRN)'),
        ('sales_dispatch', 'Sales Dispatch'),
        ('sales_return', 'Sales Customer Return'),
        ('transfer_in', 'Warehouse Transfer In'),
        ('transfer_out', 'Warehouse Transfer Out'),
        ('stock_adjustment', 'Audit / Physical Count Adjustment'),
        ('damage_writeoff', 'Damage / Expiry Write-Off'),
        ('quarantine', 'Moved to Quarantine / Inspection'),
        ('reservation', 'Order Allocation / Reservation'),
        ('reservation_release', 'Order Reservation Release'),
    ]

    movement_id = models.CharField(max_length=40, unique=True)
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT, related_name='movements')
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='movements')
    bin = models.ForeignKey('warehouses.Bin', on_delete=models.SET_NULL, null=True, blank=True)
    batch_number = models.CharField(max_length=60, blank=True, null=True)
    movement_type = models.CharField(max_length=30, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField(help_text="Positive for addition, negative for deduction")
    previous_balance = models.IntegerField()
    resulting_balance = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    reference_document = models.CharField(max_length=80, blank=True, null=True, help_text="e.g. PO-0012, SO-0045, AUD-001")
    reason = models.TextField(help_text="Detailed audit justification for the inventory change")
    created_by = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='created_movements')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.movement_id}: {self.product.sku} ({self.quantity:+d}) -> Balance: {self.resulting_balance}"

class StockTransfer(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_transit', 'In Transit'),
        ('completed', 'Received & Completed'),
        ('cancelled', 'Cancelled'),
    ]

    transfer_number = models.CharField(max_length=40, unique=True)
    from_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='transfers_out')
    to_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='transfers_in')
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    transporter_name = models.CharField(max_length=120, blank=True, null=True)
    vehicle_number = models.CharField(max_length=30, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='initiated_transfers')
    received_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='received_transfers')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transfer_number} ({self.from_warehouse.code} -> {self.to_warehouse.code}): {self.quantity} {self.product.sku}"
