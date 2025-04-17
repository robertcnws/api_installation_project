from django.contrib import admin
from django.urls import path, include
from rest_framework_mongoengine import routers   
from . import views

urlpatterns = [
    path("list_sales_orders/", views.list_sales_orders, name="list_sales_orders"),
    path("delete_sales_orders/", views.delete_sales_orders, name="delete_sales_orders"),
    path("list_customers/<str:zoho_org_id>/", views.list_customers, name="list_customers"),
    path("list_salesorder_to_service/", views.list_salesorder_to_service, name="list_salesorder_to_service"),
    path("refetch_salesorder/<str:project_id>/", views.refetch_salesorder, name="refetch_salesorder"),
    path("refetch_salesorder_service/<str:service_id>/", views.refetch_salesorder_service, name="refetch_salesorder_service"),
    path("list_users_permissions/", views.list_users_permissions, name="list_users_permissions"),
    path("manage_user_permissions/", views.manage_user_permissions, name="manage_user_permissions"),
]