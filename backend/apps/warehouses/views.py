from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Warehouse, Zone, Aisle, Rack, Shelf, Bin
from .serializers import WarehouseSerializer, ZoneSerializer, BinSerializer

class WarehouseViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'city', 'state', 'pin_code']
    ordering_fields = ['name', 'created_at', 'total_capacity_sqft']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'super_admin':
            return Warehouse.objects.all().prefetch_related('zones')
        if user.organization:
            return Warehouse.objects.filter(organization=user.organization).prefetch_related('zones')
        return Warehouse.objects.none()

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class ZoneViewSet(viewsets.ModelViewSet):
    serializer_class = ZoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        warehouse_id = self.request.query_params.get('warehouse')
        qs = Zone.objects.all()
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)
        if self.request.user.organization:
            qs = qs.filter(warehouse__organization=self.request.user.organization)
        return qs

class BinViewSet(viewsets.ModelViewSet):
    serializer_class = BinSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'barcode_value']

    def get_queryset(self):
        qs = Bin.objects.select_related('shelf__rack__aisle__zone__warehouse')
        warehouse_id = self.request.query_params.get('warehouse')
        if warehouse_id:
            qs = qs.filter(shelf__rack__aisle__zone__warehouse_id=warehouse_id)
        if self.request.user.organization:
            qs = qs.filter(shelf__rack__aisle__zone__warehouse__organization=self.request.user.organization)
        return qs
