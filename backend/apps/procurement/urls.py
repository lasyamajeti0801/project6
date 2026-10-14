from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseOrderViewSet, GoodsReceiptNoteViewSet

router = DefaultRouter()
router.register(r'orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'receipts', GoodsReceiptNoteViewSet, basename='goods-receipt')

urlpatterns = [
    path('', include(router.urls)),
]
