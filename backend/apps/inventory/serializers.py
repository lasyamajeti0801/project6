from rest_framework import serializers
from .models import StockItem, StockMovement, StockTransfer
from apps.catalog.serializers import ProductSerializer

class StockItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.code', read_only=True)
    bin_location = serializers.CharField(source='bin.full_location_code', read_only=True)
    quantity_available = serializers.IntegerField(read_only=True)
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = StockItem
        fields = [
            'id', 'warehouse', 'warehouse_name', 'warehouse_code',
            'bin', 'bin_location', 'product', 'product_details',
            'quantity_on_hand', 'quantity_reserved', 'quantity_quarantined',
            'quantity_available', 'batch_number', 'expiry_date',
            'unit_cost', 'total_value', 'updated_at'
        ]

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    user_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['movement_id', 'created_at']

class StockTransferSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    from_warehouse_name = serializers.CharField(source='from_warehouse.name', read_only=True)
    to_warehouse_name = serializers.CharField(source='to_warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = StockTransfer
        fields = '__all__'
        read_only_fields = ['transfer_number', 'created_at', 'completed_at']
