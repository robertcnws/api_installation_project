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
    ProjectDefaultMaterialConsumer,
    ProjectCalendarNotesConsumer,
    ProjectProfitReportConsumer,
    ProjectInstallationCrewConsumer,
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
    path('api/projects/ws/default-materials/', ProjectDefaultMaterialConsumer.as_asgi(), name='ws_default_materials'),
    path('api/projects/ws/project-calendar-notes/', ProjectCalendarNotesConsumer.as_asgi(), name='ws_project_calendar_notes'),
    path('api/projects/ws/project-profit-reports/', ProjectProfitReportConsumer.as_asgi(), name='ws_project_profit_reports'),
    path('api/projects/ws/project-installation-crews/', ProjectInstallationCrewConsumer.as_asgi(), name='ws_project_installation_crews'),
]
