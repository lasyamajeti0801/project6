from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Organization
from .serializers import UserSerializer, OrganizationSerializer, RegisterSerializer
from apps.auditlog.models import AuditLog

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            # Record audit log
            AuditLog.objects.create(
                organization=user.organization,
                user=user,
                action='USER_REGISTRATION',
                module='AUTH',
                description=f"New organization registered: {user.organization.name} by {user.email}",
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'organization': OrganizationSerializer(user.organization).data,
                'message': 'Registration successful'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Please provide both email and password.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=email, password=password)
        if not user:
            # Try username matching if email failed
            try:
                user_obj = User.objects.get(email__iexact=email)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                pass

        if user:
            if not user.is_active:
                return Response({'error': 'Account is inactive. Please contact your administrator.'}, status=status.HTTP_403_FORBIDDEN)

            refresh = RefreshToken.for_user(user)
            
            # Record audit log
            AuditLog.objects.create(
                organization=user.organization,
                user=user,
                action='USER_LOGIN',
                module='AUTH',
                description=f"User {user.email} logged in successfully.",
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'organization': OrganizationSerializer(user.organization).data if user.organization else None,
                'message': 'Login successful'
            })
        
        return Response({'error': 'Invalid credentials. Please verify your email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'user': UserSerializer(request.user).data,
            'organization': OrganizationSerializer(request.user.organization).data if request.user.organization else None,
        })

    def patch(self, request):
        user = request.user
        theme = request.data.get('theme_preference')
        if theme in ['light', 'dark', 'sage']:
            user.theme_preference = theme
            user.save(update_fields=['theme_preference'])

        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        phone_number = request.data.get('phone_number')

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if phone_number is not None:
            user.phone_number = phone_number

        user.save()
        return Response(UserSerializer(user).data)

class OrganizationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.organization:
            return Response({'error': 'No organization associated with this account'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrganizationSerializer(request.user.organization).data)

    def patch(self, request):
        if not request.user.organization:
            return Response({'error': 'No organization found'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.user.role not in ['super_admin', 'org_owner']:
            return Response({'error': 'Only Organization Owners can modify company details.'}, status=status.HTTP_403_FORBIDDEN)

        org = request.user.organization
        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserManagementViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'super_admin':
            return User.objects.all()
        if user.organization:
            return User.objects.filter(organization=user.organization)
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        user = serializer.save(organization=self.request.user.organization)
        # Set default password if provided
        pwd = self.request.data.get('password', 'StockPilot@2026')
        user.set_password(pwd)
        user.save()
