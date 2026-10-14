from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Organization

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    warehouse_name = serializers.CharField(source='assigned_warehouse.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'role', 'role_display', 'organization',
            'organization_name', 'assigned_warehouse', 'warehouse_name',
            'theme_preference', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']

class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=20)
    organization_name = serializers.CharField(max_length=200)
    business_type = serializers.CharField(max_length=50, default='distributor')
    password = serializers.CharField(write_only=True, min_length=6)
    state = serializers.CharField(max_length=100, default='Maharashtra')
    city = serializers.CharField(max_length=100, default='Mumbai')

    def create(self, validated_data):
        org_name = validated_data['organization_name']
        org_code = "".join([w[0].upper() for w in org_name.split()[:4]]) or "ORG"
        # Ensure unique org code
        base_code = org_code
        counter = 1
        while Organization.objects.filter(code=org_code).exists():
            org_code = f"{base_code}{counter}"
            counter += 1

        org = Organization.objects.create(
            name=org_name,
            code=org_code,
            business_type=validated_data.get('business_type', 'distributor'),
            state=validated_data.get('state', 'Maharashtra'),
            city=validated_data.get('city', 'Mumbai'),
            primary_contact_name=validated_data['full_name'],
            primary_contact_email=validated_data['email'],
            primary_contact_phone=validated_data['phone_number'],
        )

        name_parts = validated_data['full_name'].split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone_number=validated_data['phone_number'],
            organization=org,
            role='org_owner',
            theme_preference='light'
        )
        return user
