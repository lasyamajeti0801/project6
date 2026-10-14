from django.db import models
from decimal import Decimal

class Customer(models.Model):
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='customers')
    code = models.CharField(max_length=40)
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=120)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    billing_address = models.TextField()
    shipping_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pin_code = models.CharField(max_length=10)
    gstin = models.CharField(max_length=15, blank=True, null=True, help_text="Indian GSTIN")
    pan = models.CharField(max_length=10, blank=True, null=True, help_text="Indian PAN")
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=500000.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('organization', 'code')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class SalesOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('reserved', 'Stock Reserved'),
        ('picking', 'Picking in Progress'),
        ('packed', 'Packed & Ready for Dispatch'),
        ('dispatched', 'Dispatched / In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Payment Pending'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid in Full'),
    ]

    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='sales_orders')
    so_number = models.CharField(max_length=40, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='sales_orders')
    source_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='outgoing_sales_orders')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='draft')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    order_date = models.DateField()
    expected_dispatch_date = models.DateField()
    
    # Financials in INR
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    shipping_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='created_sales_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-order_date', '-created_at']

    def __str__(self):
        return f"{self.so_number} - {self.customer.name} ({self.get_status_display()})"

    def recalculate_totals(self):
        subtotal = Decimal('0.00')
        tax_total = Decimal('0.00')
        for item in self.items.all():
            item_sub = item.quantity_ordered * item.unit_price
            item_tax = item_sub * (item.gst_rate / Decimal('100.00'))
            subtotal += item_sub
            tax_total += item_tax
        self.subtotal = round(subtotal, 2)
        self.tax_amount = round(tax_total, 2)
        self.total_amount = round(self.subtotal + self.tax_amount + Decimal(str(self.shipping_charges or '0.00')), 2)
        self.save(update_fields=['subtotal', 'tax_amount', 'total_amount'])

class SalesOrderItem(models.Model):
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    quantity_ordered = models.IntegerField()
    quantity_reserved = models.IntegerField(default=0)
    quantity_picked = models.IntegerField(default=0)
    quantity_dispatched = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        sub = Decimal(str(self.quantity_ordered)) * Decimal(str(self.unit_price))
        tax = sub * (Decimal(str(self.gst_rate)) / Decimal('100.00'))
        self.total_price = round(sub + tax, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.sales_order.so_number}: {self.product.sku} ({self.quantity_ordered} ordered)"
