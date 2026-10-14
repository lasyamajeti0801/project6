from django.db import models

class LabelTemplate(models.Model):
    LABEL_TYPE_CHOICES = [
        ('product', 'Product SKU Label (50mm x 25mm)'),
        ('bin', 'Warehouse Bin Label (100mm x 50mm)'),
        ('pallet', 'Pallet / Shipping Label (100mm x 150mm)'),
        ('batch', 'Batch & Expiry Label (75mm x 50mm)'),
    ]

    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='label_templates')
    name = models.CharField(max_length=100)
    label_type = models.CharField(max_length=30, choices=LABEL_TYPE_CHOICES, default='product')
    width_mm = models.IntegerField(default=50)
    height_mm = models.IntegerField(default=25)
    include_qr = models.BooleanField(default=True)
    include_barcode_128 = models.BooleanField(default=True)
    include_price = models.BooleanField(default=True)
    include_org_name = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.get_label_type_display()})"

class BarcodeScanLog(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    barcode_value = models.CharField(max_length=100)
    matched_entity_type = models.CharField(max_length=50, blank=True, null=True) # product, bin, po, dispatch
    matched_entity_id = models.IntegerField(blank=True, null=True)
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scanned_at']
