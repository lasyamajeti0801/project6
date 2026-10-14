from rest_framework import serializers
from .models import DispatchOrder, DispatchItem

class DispatchItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = DispatchItem
        fields = '__all__'

class DispatchOrderSerializer(serializers.ModelSerializer):
    items = DispatchItemSerializer(many=True, read_only=True)
    so_number = serializers.CharField(source='sales_order.so_number', read_only=True)
    customer_name = serializers.CharField(source='sales_order.customer.name', read_only=True)
    customer_city = serializers.CharField(source='sales_order.customer.city', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    dispatched_by_name = serializers.CharField(source='dispatched_by.get_full_name', read_only=True)

    class Meta:
        model = DispatchOrder
        fields = '__all__'
        read_only_fields = ['dispatch_number', 'delivery_challan_number', 'created_at', 'updated_at']
