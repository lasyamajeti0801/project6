from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'code', 'parent', 'description', 'is_active', 'subcategories', 'products_count', 'created_at']

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.filter(is_active=True), many=True).data
        return []

    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_of_measure_display = serializers.CharField(source='get_unit_of_measure_display', read_only=True)
    total_stock = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'internal_code', 'name', 'description',
            'category', 'category_name', 'brand', 'unit_of_measure',
            'unit_of_measure_display', 'hsn_code', 'gst_rate',
            'cost_price', 'selling_price', 'reorder_level',
            'preferred_reorder_quantity', 'lead_time_days',
            'barcode_value', 'has_batch_tracking', 'has_expiry',
            'image_url', 'is_active', 'created_at', 'updated_at',
            'total_stock', 'available_stock', 'stock_status'
        ]

    def get_total_stock(self, obj):
        from apps.inventory.models import StockItem
        items = StockItem.objects.filter(product=obj)
        return sum(item.quantity_on_hand for item in items)

    def get_available_stock(self, obj):
        from apps.inventory.models import StockItem
        items = StockItem.objects.filter(product=obj)
        return sum(item.quantity_available for item in items)

    def get_stock_status(self, obj):
        avail = self.get_available_stock(obj)
        if avail <= 0:
            return 'out_of_stock'
        elif avail <= obj.reorder_level:
            return 'low_stock'
        return 'in_stock'
