from django.db import models
from decimal import Decimal

class AuditSession(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'Counting in Progress'),
        ('pending_review', 'Counting Complete — Review Pending'),
        ('approved', 'Approved & Reconciled'),
        ('rejected', 'Audit Rejected'),
    ]

    AUDIT_TYPE_CHOICES = [
        ('full', 'Full Physical Stocktake'),
        ('cycle_count', 'Periodic Cycle Count'),
        ('spot_check', 'High-Value Spot Check'),
        ('zone_audit', 'Specific Zone Audit'),
    ]

    audit_number = models.CharField(max_length=40, unique=True)
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.CASCADE, related_name='audit_sessions')
    zone = models.ForeignKey('warehouses.Zone', on_delete=models.SET_NULL, null=True, blank=True)
    audit_type = models.CharField(max_length=30, choices=AUDIT_TYPE_CHOICES, default='cycle_count')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='scheduled')
    is_blind_count = models.BooleanField(default=True, help_text="Hide expected system quantities from stock auditors during physical counting")
    scheduled_date = models.DateField()
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    auditor = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='assigned_audits')
    supervisor = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_audits')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_date', '-created_at']

    def __str__(self):
        return f"{self.audit_number} - {self.warehouse.name} ({self.get_status_display()})"

    @property
    def total_items_count(self):
        return self.items.count()

    @property
    def total_variance_units(self):
        return sum(item.variance for item in self.items.all())

    @property
    def total_variance_value(self):
        return sum(item.variance_value for item in self.items.all())

class AuditItem(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Count'),
        ('counted', 'Counted'),
        ('recount_requested', 'Recount Requested'),
        ('recounted', 'Recounted'),
        ('reconciled', 'Reconciled & Adjusted'),
    ]

    audit_session = models.ForeignKey(AuditSession, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    bin = models.ForeignKey('warehouses.Bin', on_delete=models.SET_NULL, null=True, blank=True)
    system_quantity = models.IntegerField(help_text="Snapshot of on-hand quantity at audit start")
    physical_quantity = models.IntegerField(default=0)
    variance = models.IntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    variance_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    recount_required = models.BooleanField(default=False)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    discrepancy_reason = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        self.variance = self.physical_quantity - self.system_quantity
        self.variance_value = round(Decimal(self.variance) * self.unit_cost, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.audit_session.audit_number}: {self.product.sku} (Sys: {self.system_quantity}, Phys: {self.physical_quantity}, Var: {self.variance})"
