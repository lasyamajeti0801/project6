from rest_framework import serializers
from .models import LabelTemplate, BarcodeScanLog

class LabelTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabelTemplate
        fields = '__all__'

class BarcodeScanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BarcodeScanLog
        fields = '__all__'
