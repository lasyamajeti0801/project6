from rest_framework import serializers
from .models import ForecastResult, ReorderRecommendation, DailyDemandRecord

class DailyDemandRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyDemandRecord
        fields = '__all__'

class ForecastResultSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    method_display = serializers.CharField(source='get_method_used_display', read_only=True)

    class Meta:
        model = ForecastResult
        fields = '__all__'

class ReorderRecommendationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_cost = serializers.DecimalField(source='product.cost_price', max_digits=12, decimal_places=2, read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    resulting_po_number = serializers.CharField(source='resulting_purchase_order.po_number', read_only=True)

    class Meta:
        model = ReorderRecommendation
        fields = '__all__'
