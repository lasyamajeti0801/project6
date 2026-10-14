from django.db import models

class SavedReport(models.Model):
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='saved_reports')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='saved_reports')
    report_type = models.CharField(max_length=50)
    title = models.CharField(max_length=150)
    filter_parameters = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.report_type})"
