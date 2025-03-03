from django.contrib import admin
from django.urls import path, include
from rest_framework_mongoengine import routers   
from . import views

urlpatterns = [
    path("list_sales_orders/", views.list_sales_orders, name="list_sales_orders"),
    path("list_users_permissions/", views.list_users_permissions, name="list_users_permissions"),
    path("manage_user_permissions/", views.manage_user_permissions, name="manage_user_permissions"),
]