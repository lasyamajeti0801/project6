from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return Category.objects.filter(organization=user.organization)
        return Category.objects.none()

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku', 'barcode_value', 'brand', 'hsn_code', 'internal_code']
    ordering_fields = ['name', 'sku', 'selling_price', 'cost_price', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return Product.objects.none()

        qs = Product.objects.filter(organization=user.organization).select_related('category')
        
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
            
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            qs = qs.filter(is_active=True)
        elif status_filter == 'inactive':
            qs = qs.filter(is_active=False)

        return qs

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        products = self.get_queryset().filter(is_active=True)
        low_stock_list = []
        for p in products:
            serializer = ProductSerializer(p)
            data = serializer.data
            if data['stock_status'] in ['low_stock', 'out_of_stock']:
                low_stock_list.append(data)
        return Response(low_stock_list)
