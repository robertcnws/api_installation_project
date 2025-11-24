"""
URL configuration for system_installation_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.urls.conf import include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from api_authorization import views

urlpatterns = [
    path('api/admin/', admin.site.urls),
    path('api/integration/', include('api_integration.urls')),
    path('api/authorization/', include('api_authorization.urls')),
    path('api/projects/', include('api_projects.urls')),
    path('api/users/', include('api_users.urls')),
    path('api/services/', include('api_services.urls')),
    path('api/measurements/', include('api_measurements.urls')),
    path('api/health-check/', views.health_check, name='health_check'),
]

urlpatterns += staticfiles_urlpatterns()
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
