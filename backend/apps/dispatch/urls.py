from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DispatchOrderViewSet

router = DefaultRouter()
router.register(r'orders', DispatchOrderViewSet, basename='dispatch-order')

urlpatterns = [
    path('', include(router.urls)),
]
