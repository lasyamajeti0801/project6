from django.urls import path
from .views import ReportListView, ReportDataView

urlpatterns = [
    path('list/', ReportListView.as_view(), name='report-list'),
    path('<str:report_id>/', ReportDataView.as_view(), name='report-data'),
]
