# project/urls.py
from django.urls import path  
from django.conf.urls.static import static
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
from .schema import schema
from . import views
urlpatterns = [
    path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True, schema=schema))),
    # SERVICE ISSUES
    path('create/service-issue/', views.create_service_issue, name='create_service_issue'),
    path('edit/service-issue/<str:id>/', views.edit_service_issue, name='edit_service_issue'),
    path('delete/service-issue/<str:id>/', views.delete_service_issue, name='delete_service_issue'),
    path('delete/service-issues/', views.delete_service_issues, name='delete_service_issues'),
    # SERVICE
    path('create/service/', views.create_service, name='create_service'),
    path('delete/service/<str:id>/', views.delete_service, name='delete_service'),
    path('delete/services/', views.delete_services, name='delete_services'),
    path('update/service/<str:id>/add-new-issue/<str:issued_product_id>/', views.add_new_issue_service, name='add_new_issue_service'),
    path('update/service/<str:id>/edit-issue/<str:issued_product_id>/<str:issue_id>/', views.edit_issue_service, name='edit_issue_service'),
    path('update/service/<str:id>/delete-issue/<str:issued_product_id>/<str:issue_id>/', views.delete_issue_service, name='delete_issue_service'),
    path('update/service/<str:id>/change-address/', views.change_service_address, name='change_service_address'),
    path('update/service/<str:id>/change-phone-number/', views.change_service_phone_number, name='change_service_phone_number'),
    path('update/service/<str:id>/change-reference-number/', views.change_service_reference_number, name='change_service_reference_number'),
    path('update/service/<str:id>/change-user-manager/', views.change_service_manager, name='change_service_manager'),
    path('update/service/<str:id>/change-users-team/', views.change_service_team, name='change_service_team'),
    path('update/service/<str:id>/change-dates/', views.change_service_dates, name='change_service_dates'),
    path('update/service/<str:id>/add-issued-products/', views.add_issued_products, name='add_issued_products'),
    # SERVICE DEFAULT TASKS
    path('create/default-task/', views.create_service_default_task, name='create_service_default_task'),
    path('edit/default-task/<str:id>/', views.edit_service_default_task, name='edit_service_default_task'),
    path('delete/default-task/<str:id>/', views.delete_service_default_task, name='delete_service_default_task'),
    path('delete/default-tasks/', views.delete_service_default_tasks, name='delete_service_default_tasks'),
    # SERVICE STAGES
    path('create/stage/', views.create_service_stage, name='create_service_stage'),
    path('edit/stage/<str:id>/', views.edit_service_stage, name='edit_service_stage'),
    path('delete/stage/<str:id>/', views.delete_service_stage, name='delete_service_stage'),
    path('delete/stages/', views.delete_service_stages, name='delete_service_stages'),
    
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
