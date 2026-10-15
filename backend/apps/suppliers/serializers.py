from rest_framework import serializers
from .models import Supplier
from apps.common.statutory_validators import validate_gstin, validate_pan, validate_pincode

class SupplierSerializer(serializers.ModelSerializer):
    payment_terms_display = serializers.CharField(source='get_payment_terms_display', read_only=True)
    total_purchases_value = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    on_time_delivery_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Supplier
        fields = '__all__'

    def validate_gstin(self, value):
        if value:
            valid, err = validate_gstin(value)
            if not valid:
                raise serializers.ValidationError(err)
            return value.strip().upper()
        return value

    def validate_pan(self, value):
        if value:
            valid, _, err = validate_pan(value)
            if not valid:
                raise serializers.ValidationError(err)
            return value.strip().upper()
        return value

    def validate_postal_code(self, value):
        if value:
            valid, err = validate_pincode(value)
            if not valid:
                raise serializers.ValidationError(err)
            return value.strip()
        return value

