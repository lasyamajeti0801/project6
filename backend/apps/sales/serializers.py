from rest_framework import serializers
from .models import Customer, SalesOrder, SalesOrderItem
from apps.common.utils import generate_code
from apps.common.statutory_validators import validate_gstin, validate_pincode

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

    def validate_gstin(self, value):
        if value:
            valid, err = validate_gstin(value)
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


class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_uom = serializers.CharField(source='product.unit_of_measure', read_only=True)

    class Meta:
        model = SalesOrderItem
        fields = '__all__'
        read_only_fields = ['total_price', 'quantity_reserved', 'quantity_picked', 'quantity_dispatched']

class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True, required=False)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    warehouse_name = serializers.CharField(source='source_warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = SalesOrder
        fields = '__all__'
        read_only_fields = ['so_number', 'subtotal', 'tax_amount', 'total_amount', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = self.context.get('request').data.get('items', [])
        so = SalesOrder.objects.create(
            so_number=generate_code('SO'),
            organization=self.context['request'].user.organization,
            created_by=self.context['request'].user,
            **validated_data
        )

        for item_data in items_data:
            SalesOrderItem.objects.create(
                sales_order=so,
                product_id=item_data['product'],
                quantity_ordered=item_data['quantity_ordered'],
                unit_price=item_data['unit_price'],
                gst_rate=item_data.get('gst_rate', 18.00)
            )
        so.recalculate_totals()
        return so
