from rest_framework import viewsets, permissions, filters
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['action', 'module', 'description', 'user__email']
    ordering_fields = ['timestamp']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'super_admin':
            return AuditLog.objects.all().select_related('user')
        if user.organization:
            return AuditLog.objects.filter(organization=user.organization).select_related('user')
        return AuditLog.objects.none()
