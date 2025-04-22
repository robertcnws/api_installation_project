# api_zoho/routing.py
from django.urls import path
from .consumers import (
    MeasurementConsumer,
    MeasurementByIdConsumer,
)

websocket_urlpatterns = [
    path('api/measurements/ws/measurements/', MeasurementConsumer.as_asgi(), name='ws_measurements'),
    path('api/measurements/ws/measurement/<str:measurement_id>/', MeasurementByIdConsumer.as_asgi(), name='ws_measurement_by_id'),
]
