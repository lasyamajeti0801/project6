from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, ZoneViewSet, BinViewSet

router = DefaultRouter()
router.register(r'locations', WarehouseViewSet, basename='warehouse')
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'bins', BinViewSet, basename='bin')

urlpatterns = [
    path('', include(router.urls)),
]
