from django.urls import path
from .views import BarcodeLookupView, BarcodeGenerateView, PrintLabelsPDFView

urlpatterns = [
    path('lookup/', BarcodeLookupView.as_view(), name='barcode-lookup'),
    path('generate/', BarcodeGenerateView.as_view(), name='barcode-generate'),
    path('print-labels/', PrintLabelsPDFView.as_view(), name='barcode-print-labels'),
]
