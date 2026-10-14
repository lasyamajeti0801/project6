from django.db import models

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('low_stock', 'Low Stock Warning'),
        ('out_of_stock', 'Out of Stock Alert'),
        ('reorder_rec', 'Replenishment Reorder Recommendation'),
        ('expiring_batch', 'Batch Expiry Approaching'),
        ('po_delayed', 'Purchase Order Delivery Delayed'),
        ('approval_needed', 'Approval Required'),
        ('dispatch_due', 'Dispatch Due Today'),
        ('audit_discrepancy', 'Physical Stock Audit Variance'),
        ('system_info', 'System Notice'),
    ]

    SEVERITY_CHOICES = [
        ('critical', 'Critical (Red)'),
        ('warning', 'Warning (Amber)'),
        ('info', 'Information (Green)'),
    ]

    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    severity = models.CharField(max_length=15, choices=SEVERITY_CHOICES, default='info')
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title} ({'Read' if self.is_read else 'Unread'})"
