from django.db import models

class Warehouse(models.Model):
    WAREHOUSE_TYPE_CHOICES = [
        ('fulfillment_center', 'Central Fulfillment Center'),
        ('distribution_hub', 'Regional Distribution Hub'),
        ('bonded', 'Bonded / Customs Warehouse'),
        ('cold_storage', 'Temperature-Controlled / Cold Chain'),
        ('retail_backroom', 'Retail Backroom / Micro-Hub'),
    ]

    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='warehouses')
    code = models.CharField(max_length=30)
    name = models.CharField(max_length=150)
    warehouse_type = models.CharField(max_length=40, choices=WAREHOUSE_TYPE_CHOICES, default='fulfillment_center')
    address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, help_text="Indian State or Union Territory")
    pin_code = models.CharField(max_length=10)
    contact_person = models.CharField(max_length=120)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    total_capacity_sqft = models.DecimalField(max_digits=12, decimal_places=2, default=25000.00)
    utilized_capacity_sqft = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('organization', 'code')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def utilization_percentage(self):
        if self.total_capacity_sqft and self.total_capacity_sqft > 0:
            return round((float(self.utilized_capacity_sqft) / float(self.total_capacity_sqft)) * 100, 1)
        return 0.0

class Zone(models.Model):
    ZONE_TYPE_CHOICES = [
        ('ambient', 'General / Ambient Storage'),
        ('cold', 'Cold Storage (2°C - 8°C)'),
        ('quarantine', 'Quarantine / Quality Inspection'),
        ('returns', 'Returns & Damaged Goods'),
        ('high_value', 'High Value / Secure Cage'),
        ('staging', 'Inbound / Outbound Staging Area'),
    ]

    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='zones')
    code = models.CharField(max_length=30)
    name = models.CharField(max_length=100)
    zone_type = models.CharField(max_length=30, choices=ZONE_TYPE_CHOICES, default='ambient')
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('warehouse', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.warehouse.code} / {self.code} - {self.name}"

class Aisle(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='aisles')
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        unique_together = ('zone', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.zone} / Aisle {self.code}"

class Rack(models.Model):
    aisle = models.ForeignKey(Aisle, on_delete=models.CASCADE, related_name='racks')
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = ('aisle', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.aisle} / Rack {self.code}"

class Shelf(models.Model):
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, related_name='shelves')
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = ('rack', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.rack} / Shelf {self.code}"

class Bin(models.Model):
    shelf = models.ForeignKey(Shelf, on_delete=models.CASCADE, related_name='bins')
    code = models.CharField(max_length=30)
    barcode_value = models.CharField(max_length=64, unique=True, blank=True, null=True)
    max_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('shelf', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.full_location_code}"

    @property
    def full_location_code(self):
        return f"{self.shelf.rack.aisle.zone.warehouse.code}/{self.shelf.rack.aisle.zone.code}/{self.shelf.rack.aisle.code}/{self.shelf.rack.code}/{self.shelf.code}/{self.code}"

    def save(self, *args, **kwargs):
        if not self.barcode_value:
            self.barcode_value = f"BIN-{self.id or 'TMP'}-{self.code}"
        super().save(*args, **kwargs)
        if self.barcode_value.startswith("BIN-TMP"):
            self.barcode_value = f"BIN-{self.id:06d}"
            super().save(update_fields=['barcode_value'])
