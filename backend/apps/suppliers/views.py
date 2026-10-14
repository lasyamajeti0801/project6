from rest_framework import viewsets, permissions, filters
from .models import Supplier
from .serializers import SupplierSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'contact_person', 'gstin', 'pan', 'city', 'state']
    ordering_fields = ['name', 'lead_time_days', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return Supplier.objects.filter(organization=user.organization)
        return Supplier.objects.none()

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
