# api_zoho/routing.py
from django.urls import path
from .consumers import (
    ServiceConsumer,
    ServiceByIdConsumer,
    ServiceIssueConsumer,
    ServiceStageConsumer,
    ServiceDefaultTaskConsumer
)

websocket_urlpatterns = [
    path('api/services/ws/services/', ServiceConsumer.as_asgi(), name='ws_services'),
    path('api/services/ws/service-issues/', ServiceIssueConsumer.as_asgi(), name='ws_service_issues'),
    path('api/services/ws/service-stages/', ServiceStageConsumer.as_asgi(), name='ws_service_stages'),
    path('api/services/ws/service-default-tasks/', ServiceDefaultTaskConsumer.as_asgi(), name='ws_service_default_tasks'),
    path('api/services/ws/service/<str:service_id>/', ServiceByIdConsumer.as_asgi(), name='ws_service_by_id'),
]
