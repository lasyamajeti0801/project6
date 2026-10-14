from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockItemViewSet, StockMovementViewSet, StockTransferViewSet, StockAdjustmentView

router = DefaultRouter()
router.register(r'items', StockItemViewSet, basename='stock-item')
router.register(r'movements', StockMovementViewSet, basename='stock-movement')
router.register(r'transfers', StockTransferViewSet, basename='stock-transfer')

urlpatterns = [
    path('adjust/', StockAdjustmentView.as_view(), name='stock-adjust'),
    path('', include(router.urls)),
]
