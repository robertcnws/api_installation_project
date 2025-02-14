import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from api_projects.ws_urls import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'system_installation_project.settings')
django.setup()

urlpatterns = websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            urlpatterns
        )
    ),
})