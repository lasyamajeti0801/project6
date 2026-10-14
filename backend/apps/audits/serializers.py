from rest_framework import serializers
from .models import AuditSession, AuditItem

class AuditItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    bin_code = serializers.CharField(source='bin.full_location_code', read_only=True)

    class Meta:
        model = AuditItem
        fields = '__all__'
        read_only_fields = ['variance', 'variance_value']

class AuditSessionSerializer(serializers.ModelSerializer):
    items = AuditItemSerializer(many=True, read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    auditor_name = serializers.CharField(source='auditor.get_full_name', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_items_count = serializers.IntegerField(read_only=True)
    total_variance_units = serializers.IntegerField(read_only=True)
    total_variance_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = AuditSession
        fields = '__all__'
        read_only_fields = ['audit_number', 'started_at', 'completed_at', 'created_at']
