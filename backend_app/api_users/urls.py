from django.urls import path  
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from .schema import schema
from . import views

urlpatterns = [
    path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True, schema=schema))),
    path('create/user-role/', views.create_user_role, name='create_user_role'),
    path('edit/user-role/<str:id>/', views.edit_user_role, name='edit_user_role'),
    path('delete/user-role/<str:id>/', views.delete_user_role, name='delete_user_role'),
    path('delete/user-roles/', views.delete_user_roles, name='delete_user_roles'),
    path('create/user/', views.create_user, name='create_user'),
    path('edit/user/<str:id>/', views.edit_user, name='edit_user'),
    path('delete/user/<str:id>/', views.delete_user, name='delete_user'),
    path('delete/users/', views.delete_users, name='delete_users'),
    path('change-password/<str:id>/', views.change_password, name='change_password'),
]