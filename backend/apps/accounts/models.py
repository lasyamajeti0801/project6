from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'super_admin')
        return self.create_user(email, password, **extra_fields)

class Organization(models.Model):
    BUSINESS_TYPE_CHOICES = [
        ('distributor', 'Distributor / Wholesaler'),
        ('manufacturer', 'Manufacturer'),
        ('retailer', 'Retailer / Chain Store'),
        ('ecommerce', 'E-Commerce Seller'),
        ('sme', 'Small-to-Medium Enterprise (SME)'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPE_CHOICES, default='distributor')
    gstin = models.CharField(max_length=15, blank=True, null=True, help_text="15-character Indian GSTIN")
    pan = models.CharField(max_length=10, blank=True, null=True, help_text="10-character Indian PAN")
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, default='Mumbai')
    state = models.CharField(max_length=100, default='Maharashtra')
    pin_code = models.CharField(max_length=10, default='400001')
    primary_contact_name = models.CharField(max_length=120, blank=True, null=True)
    primary_contact_email = models.EmailField(blank=True, null=True)
    primary_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    currency = models.CharField(max_length=10, default='INR')
    financial_year_start_month = models.IntegerField(default=4, help_text="4 for April")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrator'),
        ('org_owner', 'Organization Owner'),
        ('warehouse_manager', 'Warehouse Manager'),
        ('inventory_manager', 'Inventory Manager'),
        ('procurement_officer', 'Procurement Officer'),
        ('sales_manager', 'Sales Manager'),
        ('dispatch_operator', 'Dispatch Operator'),
        ('stock_auditor', 'Stock Auditor'),
        ('finance_viewer', 'Finance Viewer'),
        ('read_only', 'Read-Only User'),
    ]

    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='inventory_manager')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members', null=True, blank=True)
    assigned_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_staff')
    theme_preference = models.CharField(max_length=20, default='light', choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('sage', 'Soft Sage'),
    ])

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.get_full_name() or self.email} ({self.get_role_display()})"
