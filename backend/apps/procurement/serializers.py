from rest_framework import serializers
from .models import PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptItem
from apps.catalog.serializers import ProductSerializer

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_uom = serializers.CharField(source='product.unit_of_measure', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'
        read_only_fields = ['total_cost']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, required=False)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='destination_warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ['po_number', 'subtotal', 'tax_amount', 'total_amount', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = self.context.get('request').data.get('items', [])
        from apps.common.utils import generate_code
        po = PurchaseOrder.objects.create(
            po_number=generate_code('PO'),
            organization=self.context['request'].user.organization,
            created_by=self.context['request'].user,
            **validated_data
        )

        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                product_id=item_data['product'],
                quantity_ordered=item_data['quantity_ordered'],
                unit_cost=item_data['unit_cost'],
                gst_rate=item_data.get('gst_rate', 18.00)
            )
        po.recalculate_totals()
        return po

class GoodsReceiptItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = GoodsReceiptItem
        fields = '__all__'

class GoodsReceiptNoteSerializer(serializers.ModelSerializer):
    items = GoodsReceiptItemSerializer(many=True, read_only=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True)
    supplier_name = serializers.CharField(source='purchase_order.supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='received_warehouse.name', read_only=True)
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)

    class Meta:
        model = GoodsReceiptNote
        fields = '__all__'
        read_only_fields = ['grn_number', 'created_at']
