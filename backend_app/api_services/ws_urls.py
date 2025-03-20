# api_zoho/routing.py
from django.urls import path
from .consumers import (
    ServiceConsumer,
    ServiceByIdConsumer,
    ServiceIssueConsumer
)

websocket_urlpatterns = [
    path('api/services/ws/services/', ServiceConsumer.as_asgi(), name='ws_services'),
    path('api/services/ws/service-issues/', ServiceIssueConsumer.as_asgi(), name='ws_service_issues'),
    path('api/services/ws/service/<str:service_id>/', ServiceByIdConsumer.as_asgi(), name='ws_service_by_id'),
]
