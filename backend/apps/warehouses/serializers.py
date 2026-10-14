from rest_framework import serializers
from .models import Warehouse, Zone, Aisle, Rack, Shelf, Bin

class BinSerializer(serializers.ModelSerializer):
    full_location_code = serializers.CharField(read_only=True)

    class Meta:
        model = Bin
        fields = '__all__'

class ShelfSerializer(serializers.ModelSerializer):
    bins = BinSerializer(many=True, read_only=True)

    class Meta:
        model = Shelf
        fields = '__all__'

class RackSerializer(serializers.ModelSerializer):
    shelves = ShelfSerializer(many=True, read_only=True)

    class Meta:
        model = Rack
        fields = '__all__'

class AisleSerializer(serializers.ModelSerializer):
    racks = RackSerializer(many=True, read_only=True)

    class Meta:
        model = Aisle
        fields = '__all__'

class ZoneSerializer(serializers.ModelSerializer):
    aisles = AisleSerializer(many=True, read_only=True)
    zone_type_display = serializers.CharField(source='get_zone_type_display', read_only=True)

    class Meta:
        model = Zone
        fields = '__all__'

class WarehouseSerializer(serializers.ModelSerializer):
    zones = ZoneSerializer(many=True, read_only=True)
    utilization_percentage = serializers.FloatField(read_only=True)
    warehouse_type_display = serializers.CharField(source='get_warehouse_type_display', read_only=True)
    total_bins_count = serializers.SerializerMethodField()

    class Meta:
        model = Warehouse
        fields = '__all__'

    def get_total_bins_count(self, obj):
        return Bin.objects.filter(shelf__rack__aisle__zone__warehouse=obj).count()
