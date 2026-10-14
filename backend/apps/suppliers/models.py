from django.db import models
from django.db.models import Avg, Count, Sum

class Supplier(models.Model):
    PAYMENT_TERMS_CHOICES = [
        ('immediate', 'Immediate / Cash on Delivery'),
        ('net_15', 'Net 15 Days'),
        ('net_30', 'Net 30 Days'),
        ('net_45', 'Net 45 Days'),
        ('net_60', 'Net 60 Days'),
        ('advance', '100% Advance Payment'),
    ]

    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='suppliers')
    code = models.CharField(max_length=40)
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=120)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    billing_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pin_code = models.CharField(max_length=10)
    gstin = models.CharField(max_length=15, blank=True, null=True, help_text="Indian GSTIN")
    pan = models.CharField(max_length=10, blank=True, null=True, help_text="Indian PAN")
    payment_terms = models.CharField(max_length=30, choices=PAYMENT_TERMS_CHOICES, default='net_30')
    lead_time_days = models.IntegerField(default=7, help_text="Default supplier fulfillment lead time in days")
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
    def total_purchases_value(self):
        from apps.procurement.models import PurchaseOrder
        val = PurchaseOrder.objects.filter(supplier=self, status__in=['received', 'closed', 'partially_received']).aggregate(total=Sum('total_amount'))['total']
        return val or 0.00

    @property
    def on_time_delivery_rate(self):
        # Calculated from actual received purchase orders vs expected delivery date
        from apps.procurement.models import GoodsReceiptNote
        grns = GoodsReceiptNote.objects.filter(purchase_order__supplier=self)
        if not grns.exists():
            return 95.0 # baseline
        total = grns.count()
        on_time = grns.filter(is_on_time=True).count()
        return round((on_time / total) * 100, 1) if total > 0 else 100.0
