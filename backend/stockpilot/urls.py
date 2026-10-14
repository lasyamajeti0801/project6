from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.utils import timezone

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'application': 'StockPilot WMS',
        'version': '2.4.0-enterprise',
        'tagline': 'Every Item Accounted For. Every Warehouse Connected.',
        'timezone': 'Asia/Kolkata',
        'timestamp': timezone.now().isoformat(),
        'database': 'operational'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/catalog/', include('apps.catalog.urls')),
    path('api/warehouses/', include('apps.warehouses.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/procurement/', include('apps.procurement.urls')),
    path('api/suppliers/', include('apps.suppliers.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path('api/dispatch/', include('apps.dispatch.urls')),
    path('api/barcodes/', include('apps.barcodes.urls')),
    path('api/audits/', include('apps.audits.urls')),
    path('api/forecasting/', include('apps.forecasting.urls')),
    path('api/reports/', include('apps.reporting.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/auditlog/', include('apps.auditlog.urls')),
]
