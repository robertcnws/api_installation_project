from django.contrib import admin
from django.urls import path, include
from rest_framework_mongoengine import routers   
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView 
from . import views

urlpatterns = [
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]