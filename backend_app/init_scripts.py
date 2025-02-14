# ./django/init_scripts.py
import os
import django
from datetime import datetime
from api_authorization.models import LoginUser
from api_projects.models import ProjectPermissions

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

def create_project_permissions():
    
    if not ProjectPermissions.objects(name='full access').first():
        permission = ProjectPermissions(
            name='full access',
            description='full access to project',
        )
        permission.save()
    if not ProjectPermissions.objects(name='read').first():
        permission = ProjectPermissions(
            name='read',
            description='read access to project',
        )
        permission.save()
    if not ProjectPermissions.objects(name='write').first():
        permission = ProjectPermissions(
            name='write',
            description='write access to project',
        )
        permission.save()
    if not ProjectPermissions.objects(name='delete').first():
        permission = ProjectPermissions(
            name='delete',
            description='delete access to project',
        )
        permission.save()

if __name__ == "__main__":
    create_superuser()
    create_project_permissions()
