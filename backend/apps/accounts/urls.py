from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, LoginView, UserProfileView, OrganizationView, UserManagementViewSet

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='manage-users')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('profile/', UserProfileView.as_view(), name='auth-profile'),
    path('organization/', OrganizationView.as_view(), name='auth-organization'),
    path('', include(router.urls)),
]
