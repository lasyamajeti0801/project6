from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditSessionViewSet

router = DefaultRouter()
router.register(r'sessions', AuditSessionViewSet, basename='audit-session')

urlpatterns = [
    path('', include(router.urls)),
]
