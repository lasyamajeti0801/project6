from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=40)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('organization', 'code')
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name

class Product(models.Model):
    UOM_CHOICES = [
        ('PCS', 'Pieces (Pcs)'),
        ('BOX', 'Box / Carton'),
        ('KG', 'Kilogram (Kg)'),
        ('LTR', 'Litre (Ltr)'),
        ('MTR', 'Metre (Mtr)'),
        ('PKT', 'Packet (Pkt)'),
        ('SET', 'Set / Kit'),
        ('ROLL', 'Roll'),
        ('DRUM', 'Drum'),
    ]

    GST_RATE_CHOICES = [
        (0.00, '0% (Exempt)'),
        (5.00, '5% GST'),
        (12.00, '12% GST'),
        (18.00, '18% GST'),
        (28.00, '28% GST'),
    ]

    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='products')
    sku = models.CharField(max_length=60, help_text="Stock Keeping Unit")
    internal_code = models.CharField(max_length=60, blank=True, null=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    brand = models.CharField(max_length=100, blank=True, null=True)
    unit_of_measure = models.CharField(max_length=20, choices=UOM_CHOICES, default='PCS')
    hsn_code = models.CharField(max_length=15, blank=True, null=True, help_text="Indian Harmonized System of Nomenclature code")
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    
    # Financials in INR
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Inventory control parameters
    reorder_level = models.IntegerField(default=20, help_text="Trigger replenishment when available stock drops to this level")
    preferred_reorder_quantity = models.IntegerField(default=100)
    lead_time_days = models.IntegerField(default=7, help_text="Average supplier delivery lead time in calendar days")
    
    # Identification & Traceability
    barcode_value = models.CharField(max_length=64, blank=True, null=True)
    has_batch_tracking = models.BooleanField(default=False)
    has_expiry = models.BooleanField(default=False)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('organization', 'sku')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.barcode_value:
            self.barcode_value = self.sku
        super().save(*args, **kwargs)
