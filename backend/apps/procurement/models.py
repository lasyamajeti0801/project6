from django.db import models
from decimal import Decimal

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('sent', 'Sent to Supplier'),
        ('partially_received', 'Partially Received'),
        ('received', 'Fully Received'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]

    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='purchase_orders')
    po_number = models.CharField(max_length=40, unique=True)
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.PROTECT, related_name='purchase_orders')
    destination_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='incoming_purchase_orders')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='draft')
    order_date = models.DateField()
    expected_delivery_date = models.DateField()
    
    # Financials in INR
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Total GST amount")
    freight_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    payment_terms = models.CharField(max_length=60, default='Net 30 Days')
    notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='created_purchase_orders')
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_purchase_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-order_date', '-created_at']

    def __str__(self):
        return f"{self.po_number} - {self.supplier.name} ({self.get_status_display()})"

    def recalculate_totals(self):
        subtotal = Decimal('0.00')
        tax_total = Decimal('0.00')
        for item in self.items.all():
            item_sub = item.quantity_ordered * item.unit_cost
            item_tax = item_sub * (item.gst_rate / Decimal('100.00'))
            subtotal += item_sub
            tax_total += item_tax
        self.subtotal = round(subtotal, 2)
        self.tax_amount = round(tax_total, 2)
        self.total_amount = round(self.subtotal + self.tax_amount + Decimal(str(self.freight_charges or '0.00')), 2)
        self.save(update_fields=['subtotal', 'tax_amount', 'total_amount'])

class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    quantity_ordered = models.IntegerField()
    quantity_received = models.IntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        sub = Decimal(str(self.quantity_ordered)) * Decimal(str(self.unit_cost))
        tax = sub * (Decimal(str(self.gst_rate)) / Decimal('100.00'))
        self.total_cost = round(sub + tax, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.purchase_order.po_number}: {self.product.sku} ({self.quantity_ordered} ordered)"

class GoodsReceiptNote(models.Model):
    grn_number = models.CharField(max_length=40, unique=True)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT, related_name='receipts')
    received_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT)
    received_date = models.DateField()
    supplier_invoice_number = models.CharField(max_length=60, blank=True, null=True)
    supplier_invoice_date = models.DateField(blank=True, null=True)
    e_way_bill_number = models.CharField(max_length=40, blank=True, null=True)
    received_by = models.ForeignKey('accounts.User', on_delete=models.PROTECT)
    is_on_time = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-received_date', '-created_at']

    def __str__(self):
        return f"{self.grn_number} (PO: {self.purchase_order.po_number})"

class GoodsReceiptItem(models.Model):
    grn = models.ForeignKey(GoodsReceiptNote, on_delete=models.CASCADE, related_name='items')
    po_item = models.ForeignKey(PurchaseOrderItem, on_delete=models.PROTECT, related_name='receipt_entries')
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    quantity_received = models.IntegerField()
    quantity_damaged = models.IntegerField(default=0)
    quantity_shortage = models.IntegerField(default=0)
    target_bin = models.ForeignKey('warehouses.Bin', on_delete=models.SET_NULL, null=True, blank=True)
    batch_number = models.CharField(max_length=60, blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.grn.grn_number}: {self.product.sku} (+{self.quantity_received})"
