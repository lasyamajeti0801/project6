from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import ForecastResult, ReorderRecommendation, DailyDemandRecord
from .serializers import ForecastResultSerializer, ReorderRecommendationSerializer, DailyDemandRecordSerializer
from .engine import DemandForecastingEngine
from apps.catalog.models import Product
from apps.warehouses.models import Warehouse
from apps.procurement.models import PurchaseOrder, PurchaseOrderItem
from apps.common.utils import generate_code

class ForecastResultViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ForecastResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__sku', 'warehouse__name']
    ordering_fields = ['forecast_date', 'projected_demand', 'confidence_score']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return ForecastResult.objects.none()
        return ForecastResult.objects.filter(product__organization=user.organization).select_related('product', 'warehouse')

class ReorderRecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = ReorderRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__sku', 'warehouse__name', 'supplier__name']
    ordering_fields = ['generated_date', 'recommended_order_quantity', 'suggested_order_date']

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return ReorderRecommendation.objects.none()
        qs = ReorderRecommendation.objects.filter(product__organization=user.organization).select_related(
            'product', 'warehouse', 'supplier', 'resulting_purchase_order'
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=False, methods=['post'])
    def trigger_engine(self, request):
        product_id = request.data.get('product')
        warehouse_id = request.data.get('warehouse')
        org = request.user.organization

        if product_id and warehouse_id:
            try:
                prod = Product.objects.get(id=product_id, organization=org)
                wh = Warehouse.objects.get(id=warehouse_id, organization=org)
            except (Product.DoesNotExist, Warehouse.DoesNotExist):
                return Response({'error': 'Product or Warehouse not found'}, status=status.HTTP_404_NOT_FOUND)

            engine = DemandForecastingEngine(prod, wh)
            rec = engine.generate_reorder_recommendation()
            return Response(ReorderRecommendationSerializer(rec).data)
        else:
            # Run for all active products across all active warehouses
            products = Product.objects.filter(organization=org, is_active=True)[:10]
            warehouses = Warehouse.objects.filter(organization=org, is_active=True)[:3]
            generated = []
            for wh in warehouses:
                for prod in products:
                    engine = DemandForecastingEngine(prod, wh)
                    rec = engine.generate_reorder_recommendation()
                    generated.append(rec)
            return Response({
                'message': f"Forecast and reorder models computed successfully for {len(generated)} product-warehouse pairs.",
                'count': len(generated)
            })

    @action(detail=True, methods=['post'])
    def approve_to_po(self, request, pk=None):
        rec = self.get_object()
        if rec.status == 'approved_to_po':
            return Response({'error': 'This recommendation has already generated a draft purchase order.'}, status=status.HTTP_400_BAD_REQUEST)

        if not rec.supplier:
            return Response({'error': 'Cannot generate PO without a designated supplier. Please assign a supplier first.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            po = PurchaseOrder.objects.create(
                po_number=generate_code('PO'),
                organization=rec.warehouse.organization,
                supplier=rec.supplier,
                destination_warehouse=rec.warehouse,
                status='draft',
                order_date=timezone.now().date(),
                expected_delivery_date=timezone.now().date() + timezone.timedelta(days=rec.lead_time_days),
                payment_terms='Net 30 Days',
                notes=f"Auto-generated draft from StockPilot Demand Forecasting (Rec #{rec.id})",
                created_by=request.user
            )

            PurchaseOrderItem.objects.create(
                purchase_order=po,
                product=rec.product,
                quantity_ordered=rec.recommended_order_quantity,
                unit_cost=rec.product.cost_price,
                gst_rate=rec.product.gst_rate
            )
            po.recalculate_totals()

            rec.status = 'approved_to_po'
            rec.resulting_purchase_order = po
            rec.save()

        return Response({
            'message': f"Draft Purchase Order {po.po_number} created successfully from recommendation.",
            'purchase_order_id': po.id,
            'recommendation': ReorderRecommendationSerializer(rec).data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        rec = self.get_object()
        reason = request.data.get('reason', 'Rejected by inventory planner')
        rec.status = 'rejected'
        rec.rejection_reason = reason
        rec.save()
        return Response(ReorderRecommendationSerializer(rec).data)

class DemandHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        product_id = request.query_params.get('product')
        warehouse_id = request.query_params.get('warehouse')
        days = int(request.query_params.get('days', 30))

        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        start_date = timezone.now().date() - timezone.timedelta(days=days)
        records = DailyDemandRecord.objects.filter(
            product_id=product_id,
            date__gte=start_date
        )
        if warehouse_id:
            records = records.filter(warehouse_id=warehouse_id)

        data = []
        for r in records.order_by('date'):
            data.append({
                'date': r.date.strftime('%Y-%m-%d'),
                'demanded': r.quantity_demanded,
                'fulfilled': r.quantity_fulfilled,
                'lost': r.lost_sales
            })
        return Response(data)
