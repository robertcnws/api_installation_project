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
    # MEASUREMENTS
    path('create/measurement/', views.create_measurement, name='create_measurement'),
    path('update/measurement/<str:id>/check-mark/', views.check_mark, name='check_mark'),
    path('update/measurement/<str:id>/delete-mark/<str:mark_id>/', views.delete_mark, name='delete_mark'),
    path('update/measurement/<str:id>/save-general-notes/', views.save_general_notes, name='save_general_notes'),
    path('update/measurement/<str:id>/change-date/', views.change_date, name='change_date'),
    path('update/measurement/<str:id>/remove-date/', views.remove_date, name='remove_date'),
    path('update/measurement/<str:id>/change-assignee/', views.change_assignee, name='change_assignee'),
    path('update/measurement/<str:id>/change-address/', views.change_address, name='change_address'),
    path('update/measurement/<str:id>/change-color/', views.change_color, name='change_color'),
    path('update/measurement/<str:id>/change-phone-number/', views.change_phone_number, name='change_phone_number'),
    path('delete/measurement/<str:id>/', views.delete_measurement, name='delete_measurement'),
    path('delete/measurements/', views.delete_measurements, name='delete_measurements'),
    path('create/measurement/<str:id>/comment/', views.create_comment, name='create_comment'),
    path('edit/measurement/<str:measurementId>/comment/<str:id>/', views.edit_comment, name='edit_comment'),
    path('delete/measurement/<str:measurementId>/comment/<str:id>/', views.delete_comment, name='delete_comment'),
    
    
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
