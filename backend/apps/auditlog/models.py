from django.db import models

class AuditLog(models.Model):
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, null=True, blank=True, related_name='audit_logs')
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_entries')
    action = models.CharField(max_length=60)
    module = models.CharField(max_length=50)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    extra_data = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.email if self.user else 'System'
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} | {user_str} | {self.action} ({self.module})"
