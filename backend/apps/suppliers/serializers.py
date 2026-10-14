from rest_framework import serializers
from .models import Supplier

class SupplierSerializer(serializers.ModelSerializer):
    payment_terms_display = serializers.CharField(source='get_payment_terms_display', read_only=True)
    total_purchases_value = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    on_time_delivery_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Supplier
        fields = '__all__'
