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
    
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
