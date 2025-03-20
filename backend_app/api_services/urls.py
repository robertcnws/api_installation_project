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
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
