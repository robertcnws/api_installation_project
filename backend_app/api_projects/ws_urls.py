# api_zoho/routing.py
from django.urls import path
from .consumers import (
    ProjectStageConsumer, 
    ProjectTaskStageConsumer,
    ProjectConsumer,
    ProjectDefaultTaskConsumer,
    ProjectByIdConsumer,
    ProjectNotificationUserConsumer,
    ProjectTrackingConsumer,
    ProjectDefaultGuideProductConsumer,
    ProjectReminderConsumer,
)

websocket_urlpatterns = [
    path('api/projects/ws/stages/', ProjectStageConsumer.as_asgi(), name='ws_project_stages'),
    path('api/projects/ws/stages-task/', ProjectTaskStageConsumer.as_asgi(), name='ws_project_task_stages'),
    path('api/projects/ws/projects/', ProjectConsumer.as_asgi(), name='ws_projects'),
    path('api/projects/ws/project-default-tasks/', ProjectDefaultTaskConsumer.as_asgi(), name='ws_project_default_tasks'),
    path('api/projects/ws/project-notification-users/', ProjectNotificationUserConsumer.as_asgi(), name='ws_project_notification_users'),
    path('api/projects/ws/tracks/', ProjectTrackingConsumer.as_asgi(), name='ws_project_tracks'),
    path('api/projects/ws/project/<str:project_id>/', ProjectByIdConsumer.as_asgi(), name='ws_project_by_id'),
    path('api/projects/ws/default-guide-products/', ProjectDefaultGuideProductConsumer.as_asgi(), name='ws_default_guide_products'),
    path('api/projects/ws/project-reminders/', ProjectReminderConsumer.as_asgi(), name='ws_project_reminders'),
]
