# ./django/init_scripts.py
import os
import django
from datetime import datetime
from api_authorization.models import LoginUser

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'system_installation_project.settings')
django.setup()

# connect_mongo()

def create_superuser():
    username = os.getenv('DJANGO_SUPERUSER_USERNAME')
    email = os.getenv('DJANGO_SUPERUSER_EMAIL')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

    if not LoginUser.objects(username=username).first():
        print("Creating superuser...")
        superuser = LoginUser(
            username=username,
            email=email,
            is_staff=True,
            is_active=True,
            date_joined=datetime.now(),
        )
        superuser.set_password(password)
        superuser.save()
        print("Superuser created!")

def create_loginuser():
    username = os.getenv('LOGINUSER_USERNAME')
    email = os.getenv('LOGINUSER_EMAIL')
    password = os.getenv('LOGINUSER_PASSWORD')

    if not LoginUser.objects(username=username).first():
        print("Creating LoginUser...")
        loginuser = LoginUser(
            username=username,
            email=email,
            is_staff=True,
            is_active=True,
            date_joined=datetime.now(),
        )
        loginuser.set_password(password)
        loginuser.save()
        print("LoginUser created!")

if __name__ == "__main__":
    create_superuser()
    create_loginuser()
