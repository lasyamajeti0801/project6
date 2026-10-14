from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ForecastResultViewSet, ReorderRecommendationViewSet, DemandHistoryView

router = DefaultRouter()
router.register(r'results', ForecastResultViewSet, basename='forecast-result')
router.register(r'recommendations', ReorderRecommendationViewSet, basename='reorder-recommendation')

urlpatterns = [
    path('history/', DemandHistoryView.as_view(), name='demand-history'),
    path('', include(router.urls)),
]
