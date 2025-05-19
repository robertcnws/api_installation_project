# ./django/init_scripts.py
import os
import django
from mongoengine import connection as mongo_connection
from datetime import datetime
from api_authorization.models import LoginUser
from api_projects.models import ProjectPermissions

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'system_installation_project.settings')
django.setup()

# connect_mongo()

db = mongo_connection.get_db()

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
        
def _create_view(view_name: str, source: str, pipeline: list):
    """Borra y (re)crea una view en MongoDB."""
    if view_name in db.list_collection_names():
        db.drop_collection(view_name)
    db.create_collection(
        view_name,
        viewOn=source,
        pipeline=pipeline
    )
    print(f"View '{view_name}' created/recreated.")


def create_projects_view():
    _create_view(
        view_name="project_view",
        source="project",
        pipeline=[
            {"$project": {
                'address': 1,
                'created_time': 1,
                'current_stage': 1,
                'description': 1,
                'end_date': 1,
                'has_permission': 1,
                '_id': 1,
                'is_active': 1,
                'last_modified_time': 1,
                'name': 1,
                'number': 1,
                'project_attachments': 1,
                'project_comments': 1,
                'project_default_tasks': 1,
                'project_history': 1,
                'project_tasks': 1,
                'reference_number': 1,
                'sales_order': 1,
                'stage_history': 1,
                'start_date': 1,
                'user_manager': 1,
                'user_reporter': 1,
                'users_assignees': 1,
                'user_installer': 1,
                'all_products_marked': 1,
                'all_windows_marked': 1,
                'all_screw_marked': 1,
                'all_trash_marked': 1,
                'feedback': 1,
                'work_scope': 1,
                'project_materials': 1,
                'project_guide_products': 1,
                'project_materials_other_notes': 1,
                'inspection_date': 1,
                'finish_permission_date': 1,
                'is_part_days': 1,
            }},
            {"$sort": {"start_date": 1}}
        ]
    )


def create_services_view():
    _create_view(
        view_name="service_view",
        source="service",
        pipeline=[
            {"$project": {
                'address': 1,
                'number': 1,
                'version': 1,
                'name': 1,
                'client': 1,
                'created_time': 1,
                'current_stage': 1,
                'end_date': 1,
                '_id': 1,
                'is_active': 1,
                'last_modified_time': 1,
                'phone': 1,
                'reference_number': 1,
                'sales_order': 1,
                'service_attachments': 1,
                'service_comments': 1,
                'service_default_tasks': 1,
                'service_history': 1,
                'stage_history': 1,
                'start_date': 1,
                'issued_products': 1,
                'user_manager': 1,
                'user_reporter': 1,
                'users_assignees': 1,
                'users_service_team': 1,
                'service_type': 1,
                'service_place': 1,
                'service_notes': 1,
                'has_to_pay': 1,
                'paid': 1,
                'by_factory': 1,
                'repaired': 1,
                'created_by': 1,
                'is_part_days': 1,
                'is_closed': 1,
            }},
            {"$sort": {"start_date": 1}}
        ]
    )


def create_measurements_view():
    _create_view(
        view_name="measurement_view",
        source="measurement",
        pipeline=[
            {"$project": {
                'address': 1,
                'color': 1,
                'created_time': 1,
                'customer': 1,
                '_id': 1,
                'is_active': 1,
                'last_modified_time': 1,
                'marks': 1,
                'number': 1,
                'phone': 1,
                'project': 1,
                'sales_order': 1,
                'service': 1,
                'user_manager': 1,
                'user_reporter': 1,
                'first_date': 1,
                'check_date': 1,
                'first_assignee': 1,
                'check_assignee': 1,
                'measurement_attachments': 1,
                'general_notes': 1,
            }},
            {"$sort": {"created_time": 1}}
        ]
    )


def create_project_tracking_view():
    _create_view(
        view_name="project_tracking_view",
        source="project_tracking",
        pipeline=[
            {"$project": {
                'created_time': 1,
                '_id': 1,
                'managed_data': 1,
                'user_reporter': 1,
                'action': 1,
            }},
            {"$sort": {"created_time": -1}}
        ]
    )


def create_project_notification_view():
    _create_view(
        view_name="project_notification_view",
        source="project_notification",
        pipeline=[
            {"$project": {
                'created_time': 1,
                '_id': 1,
                'notification': 1,
                'read': 1,
                'last_modified_time': 1,
                'user': 1,
                'username': "$user.username",
            }},
            {"$sort": {"created_time": -1}}
        ]
    )


if __name__ == "__main__":
    create_superuser()
    create_project_permissions()
    create_projects_view()
    create_services_view()
    create_measurements_view()
    create_project_tracking_view()
    create_project_notification_view()
    print("Initialization script executed successfully.")
