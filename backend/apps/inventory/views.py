from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import StockItem, StockMovement, StockTransfer
from .serializers import StockItemSerializer, StockMovementSerializer, StockTransferSerializer
from apps.catalog.models import Product
from apps.warehouses.models import Warehouse, Bin
from apps.common.utils import generate_code

class StockItemViewSet(viewsets.ModelViewSet):
    serializer_class = StockItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__sku', 'warehouse__name', 'warehouse__code', 'bin__code', 'batch_number']
    ordering_fields = ['product__name', 'quantity_on_hand', 'unit_cost', 'updated_at']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return StockItem.objects.none()

        qs = StockItem.objects.filter(warehouse__organization=user.organization).select_related('product', 'warehouse', 'bin')
        
        warehouse_id = self.request.query_params.get('warehouse')
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)
            
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)

        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = self.get_queryset()
        total_units = sum(item.quantity_on_hand for item in qs)
        total_reserved = sum(item.quantity_reserved for item in qs)
        total_available = sum(item.quantity_available for item in qs)
        total_valuation = sum(item.total_value for item in qs)
        
        return Response({
            'total_units_on_hand': total_units,
            'total_units_reserved': total_reserved,
            'total_units_available': total_available,
            'total_stock_value': float(total_valuation),
            'unique_items_count': qs.count(),
        })

class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['movement_id', 'product__sku', 'product__name', 'reference_document', 'reason']
    ordering_fields = ['created_at', 'quantity']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return StockMovement.objects.none()

        qs = StockMovement.objects.filter(warehouse__organization=user.organization).select_related('product', 'warehouse', 'bin', 'created_by')
        
        warehouse_id = self.request.query_params.get('warehouse')
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)
            
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
            
        movement_type = self.request.query_params.get('movement_type')
        if movement_type:
            qs = qs.filter(movement_type=movement_type)

        return qs

class StockTransferViewSet(viewsets.ModelViewSet):
    serializer_class = StockTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return StockTransfer.objects.none()
        return StockTransfer.objects.filter(from_warehouse__organization=user.organization).select_related('from_warehouse', 'to_warehouse', 'product', 'created_by')

    def perform_create(self, serializer):
        transfer_num = generate_code('TRF')
        serializer.save(
            transfer_number=transfer_num,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def mark_in_transit(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'draft':
            return Response({'error': f"Cannot dispatch transfer in status: {transfer.status}"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Check and deduct source stock
            stock_item = StockItem.objects.select_for_update().filter(
                warehouse=transfer.from_warehouse,
                product=transfer.product
            ).first()

            if not stock_item or stock_item.quantity_available < transfer.quantity:
                return Response({'error': 'Insufficient available stock in origin warehouse'}, status=status.HTTP_400_BAD_REQUEST)

            prev_balance = stock_item.quantity_on_hand
            stock_item.quantity_on_hand -= transfer.quantity
            stock_item.save()

            # Record transfer out movement
            StockMovement.objects.create(
                movement_id=generate_code('MOV'),
                product=transfer.product,
                warehouse=transfer.from_warehouse,
                movement_type='transfer_out',
                quantity=-transfer.quantity,
                previous_balance=prev_balance,
                resulting_balance=stock_item.quantity_on_hand,
                unit_cost=stock_item.unit_cost,
                reference_document=transfer.transfer_number,
                reason=f"Transfer to {transfer.to_warehouse.name} ({transfer.transfer_number})",
                created_by=request.user
            )

            transfer.status = 'in_transit'
            transfer.save()

        return Response(StockTransferSerializer(transfer).data)

    @action(detail=True, methods=['post'])
    def complete_transfer(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'in_transit':
            return Response({'error': f"Transfer must be in_transit to receive. Current status: {transfer.status}"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            stock_dest, _ = StockItem.objects.select_for_update().get_or_create(
                warehouse=transfer.to_warehouse,
                product=transfer.product,
                defaults={'unit_cost': transfer.product.cost_price}
            )

            prev_balance = stock_dest.quantity_on_hand
            stock_dest.quantity_on_hand += transfer.quantity
            stock_dest.save()

            # Record transfer in movement
            StockMovement.objects.create(
                movement_id=generate_code('MOV'),
                product=transfer.product,
                warehouse=transfer.to_warehouse,
                movement_type='transfer_in',
                quantity=transfer.quantity,
                previous_balance=prev_balance,
                resulting_balance=stock_dest.quantity_on_hand,
                unit_cost=stock_dest.unit_cost,
                reference_document=transfer.transfer_number,
                reason=f"Received transfer from {transfer.from_warehouse.name} ({transfer.transfer_number})",
                created_by=request.user
            )

            transfer.status = 'completed'
            transfer.received_by = request.user
            transfer.completed_at = timezone.now()
            transfer.save()

        return Response(StockTransferSerializer(transfer).data)

class StockAdjustmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product')
        warehouse_id = request.data.get('warehouse')
        bin_id = request.data.get('bin')
        quantity_delta = request.data.get('quantity_delta')
        reason = request.data.get('reason')

        if not all([product_id, warehouse_id, quantity_delta, reason]):
            return Response({'error': 'Product, warehouse, quantity_delta, and reason are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            delta = int(quantity_delta)
        except ValueError:
            return Response({'error': 'quantity_delta must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            stock_item, _ = StockItem.objects.select_for_update().get_or_create(
                warehouse_id=warehouse_id,
                product_id=product_id,
                bin_id=bin_id,
                defaults={'unit_cost': Product.objects.get(id=product_id).cost_price}
            )

            prev_balance = stock_item.quantity_on_hand
            new_balance = prev_balance + delta

            if new_balance < 0:
                return Response({'error': f"Cannot adjust stock below zero. Current balance is {prev_balance}"}, status=status.HTTP_400_BAD_REQUEST)

            stock_item.quantity_on_hand = new_balance
            stock_item.save()

            movement = StockMovement.objects.create(
                movement_id=generate_code('MOV'),
                product_id=product_id,
                warehouse_id=warehouse_id,
                bin_id=bin_id,
                movement_type='stock_adjustment',
                quantity=delta,
                previous_balance=prev_balance,
                resulting_balance=new_balance,
                unit_cost=stock_item.unit_cost,
                reference_document=f"ADJ-{request.user.id}",
                reason=reason,
                created_by=request.user
            )

        return Response({
            'message': 'Stock adjustment recorded successfully',
            'stock_item': StockItemSerializer(stock_item).data,
            'movement': StockMovementSerializer(movement).data
        })
