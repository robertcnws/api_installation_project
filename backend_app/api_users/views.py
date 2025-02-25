from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    parse_custom_date,
    create_default_task_number,
    create_project_number,
    fix_order,
    fix_order_after_edit,
    get_current_stage_from_tasks,
    to_aware,
    create_notification,
)
from .models import UserRole
from api_authorization.models import LoginUser
from api_projects.models import ProjectTracking, Project
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# CREATE USER ROLE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user_role(request): 
    data = request.data
    name = data.get('name')
    description = data.get('description')
    user_reporter = data.get('userReporter')
    
    if not name:
        return Response({'error': 'Name is required'}, status=400)
    
    try:
        user_role = UserRole.objects.filter(name=name).first()
        if user_role:
            return Response({'error': 'User role already exists'}, status=400)
        
        user_role = UserRole(
            name=name,
            description=description,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
        )
        
        user_role.save()
        
        tracking_info = transform_data_to_mongo(user_role)
        
        project_tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create rol user ({user_role.id} - {user_role.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        
        project_tracking.save()
        
        if user_reporter:
            module='user_roles'
            info=f'has created a new user role ({user_role.name})'
            info_id=user_role.id
            type='create_user_role'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'success': 'User role created successfully'}, status=200)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT USER ROLE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_user_role(request, id): 
    try:
        user_role = UserRole.objects.filter(id=id).first()
        if not user_role:
            return Response({'error': 'User role does not exist'}, status=400)
        
        data = request.data
        name = data.get('name')
        description = data.get('description')
        user_reporter = data.get('userReporter')
        
        if not name:
            return Response({'error': 'Name is required'}, status=400)
    
        check_user_role = UserRole.objects.filter(name=name).first()
        if check_user_role and check_user_role.id != user_role.id:
            return Response({'error': 'User role already exists'}, status=400)
        
        user_role.name = name
        user_role.description = description
        user_role.last_modified_time = timezone.now()
        user_role.save()
        
        tracking_info = transform_data_to_mongo(user_role)
        
        users = LoginUser.objects.all()
        users = [user for user in users if str(user.user_role['id']) == id]
        for user in users:
            user.user_role = tracking_info
            user.save()
        
        project_tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'edit rol user ({user_role.id} - {user_role.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        
        project_tracking.save()
        
        if user_reporter:
            module='user_roles'
            info=f'has updated a user role ({user_role.name})'
            info_id=user_role.id
            type='update_user_role'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'success': 'User role created successfully'}, status=200)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    

#############################################
# DELETE USER ROLE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user_role(request, id): 
    try:
        user_role = UserRole.objects.filter(id=id).first()
        if not user_role:
            return Response({'error': 'User role does not exist'}, status=400)
        
        data = request.data
        user_reporter = data.get('userReporter')
        
        users = LoginUser.objects.all()
        users = [user for user in users if str(user.user_role['id']) == id]
        if users:
            return Response({'error': 'User role is in use'}, status=400)
        
        user_role.delete()
        
        tracking_info = transform_data_to_mongo(user_role)
        
        project_tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete rol user ({user_role.id} - {user_role.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        
        project_tracking.save()
        
        if user_reporter:
            module='user_roles'
            info=f'has deleted a user role ({user_role.name})'
            info_id=user_role.id
            type='delete_user_role'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'success': 'User role deleted successfully'}, status=200)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE USER ROLES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user_roles(request): 
    try:
        data = request.data
        user_reporter = data.get('userReporter')
        ids = data.get('userRoleIds')
        
        user_roles = UserRole.objects(id__in=ids)
        if not user_roles:
            return Response({'error': 'User roles not found'}, status=404)
        
        users = LoginUser.objects.all()
        
        for user_role in user_roles:
            users = [user for user in users if str(user.user_role['id']) == str(user_role.id)]
            if users:
                return Response({'error': 'User role(s) in use'}, status=400)
        
        user_roles.delete()
        
        tracking_info = [transform_data_to_mongo(user_role) for user_role in user_roles]
        
        project_tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete user roles ({", ".join([user_role.name for user_role in user_roles])})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        
        project_tracking.save()
        
        if user_reporter:
            module='user_roles'
            info=f'has deleted {len(user_roles)} user roles'
            info_id='list'
            type='delete_user_roles'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'success': 'User roles deleted successfully'}, status=200)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CREATE USER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user(request): 
    data = request.data
    username = data.get('username')
    email = data.get('email')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    phone_number = data.get('phoneNumber')
    role = data.get('role')
    password = data.get('password')
    user_reporter = data.get('userReporter')
    avatar_url = data.get('avatarUrl')
    
    try:
        user = LoginUser.objects.filter(username=username).first()
        if user:
            return Response({'error': 'User already exists'}, status=400)
        
        role = UserRole.objects.filter(id=role).first()
        if not role:
            return Response({'error': 'Role does not exist'}, status=400)
        
        role = transform_data_to_mongo(role)
        
        user = LoginUser(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            user_role=role,
            is_active=True,
            avatar_url=avatar_url,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
        )
        
        user.set_password(password)
        user.save()
        
        tracking_info = transform_data_to_mongo(user, exclude_fields=['password'])
        
        project_tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create user ({user.id} - {user.username})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        
        project_tracking.save()
        
        if user_reporter:
            module='users'
            info=f'has created a new user ({user.username})'
            info_id=user.id
            type='create_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'success': 'User created successfully'}, status=200)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
    
#############################################
# EDIT USER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_user(request, id): 
    try:
        user = LoginUser.objects.filter(id=id).first()
        if not user:
            return Response({'error': 'User does not exist'}, status=400)
        
        data = request.data
        username = data.get('username')
        email = data.get('email')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        phone_number = data.get('phoneNumber')
        role = data.get('role')
        password = data.get('password')
        user_reporter = data.get('userReporter')
    
    
        check_user = LoginUser.objects.filter(username=username).first()
        if check_user and check_user.id != user.id:
            return Response({'error': 'User already exists'}, status=400)
        
        role = UserRole.objects.filter(id=role).first()
        if not role:
            return Response({'error': 'Role does not exist'}, status=400)
        
        role = transform_data_to_mongo(role)
        
        user.username = username if username else user.username
        user.email = email if email else user.email
        user.first_name = first_name if first_name else user.first_name
        user.last_name = last_name if last_name else user.last_name
        user.phone_number = phone_number if phone_number else user.phone_number
        user.user_role = role if role else user.user_role
        user.last_modified_time = timezone.now()
        if password:
            user.set_password(password)
        user.save()
        
        tracking_info = transform_data_to_mongo(user, exclude_fields=['password'])
        
        projects = Project.objects.all()
        for project in projects:
            has_change = False
            if project.user_reporter and str(project.user_reporter.get('id', '')) == id:
                tracking_info['avatar_url'] = project.user_reporter['avatarUrl'] if project.user_reporter.get('avatarUrl') else \
                                              project.user_reporter['avatar_url'] if project.user_reporter.get('avatar_url') else None  
                project.user_reporter = tracking_info
                has_change = True
            if project.user_manager is not None:
                if str(project.user_manager.get('id', '')) == id:
                    tracking_info['avatar_url'] = project.user_manager['avatarUrl'] if project.user_manager.get('avatarUrl') else \
                                                project.user_manager['avatar_url'] if project.user_manager.get('avatar_url') else None
                    new_info = {
                        **project.user_manager, 
                        'firstName': tracking_info['first_name'],
                        'lastName': tracking_info['last_name'],
                        'avatarUrl': tracking_info['avatar_url'],
                        'email': tracking_info['email'],
                        'phoneNumber': tracking_info['phone_number'],
                        'name': f"{tracking_info['first_name']} {tracking_info['last_name']}",
                    }                              
                    project.user_manager = new_info
                    has_change = True
            current_assignee = next((assignee for assignee in (project.users_assignees or []) if str(assignee['id']) == id), None)
            if current_assignee:
                user_assignees = [assignee for assignee in (project.users_assignees or []) if str(assignee['id']) != id]
                user_assignees.append({
                        **current_assignee,
                        'id': tracking_info['id'],
                        'username': tracking_info['username'],
                        'firstName': tracking_info['first_name'],
                        'lastName': tracking_info['last_name'],
                        'avatarUrl': tracking_info['avatar_url'],
                        'email': tracking_info['email'],
                        'phoneNumber': tracking_info['phone_number'],
                        'name': f"{tracking_info['first_name']} {tracking_info['last_name']}",
                })
                user_assignees = sorted(user_assignees, key=lambda x: x['username'], reverse=True)
                project.users_assignees = user_assignees
                has_change = True
            default_tasks = project.project_default_tasks or []
            for default_task in default_tasks:
                current_user_assignees = next((assignee for assignee in (default_task['users_assignees'] or []) if str(assignee['id']) == id), None)
                if current_user_assignees:
                    task_user_assignees = [assignee for assignee in (default_task['users_assignees'] or []) if str(assignee['id']) != id]
                    task_user_assignees.append({
                        **current_user_assignees,
                        'id': tracking_info['id'],
                        'username': tracking_info['username'],
                        'firstName': tracking_info['first_name'],
                        'lastName': tracking_info['last_name'],
                        'avatarUrl': tracking_info['avatar_url'],
                        'email': tracking_info['email'],
                        'phoneNumber': tracking_info['phone_number'],
                        'name': f"{tracking_info['first_name']} {tracking_info['last_name']}",
                    })
                    task_user_assignees = sorted(task_user_assignees, key=lambda x: x['username'], reverse=True)
                    default_task['users_assignees'] = task_user_assignees
                    has_change = True
            if has_change:
                project.save()
                
        project_tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'edit user ({user.id} - {user.username})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        project_tracking.save()
        
        if user_reporter:
            module='users'
            info=f'has updated a user ({user.username})'
            info_id=user.id
            type='update_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'success': 'User updated successfully'}, status=200)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    

#############################################
# CHANGE PASSWORD
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request, id):
    data = request.data
    current_password = data.get('password')
    new_password = data.get('newPassword')
    confirm_password = data.get('confirmPassword')
    
    try:
        user = LoginUser.objects(id=id).first()
    except LoginUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=400)
    
    if new_password != confirm_password:
        return Response({'error': 'New password and confirm password must match'}, status=400)
    
    user.set_password(new_password)
    user.save()
    
    tracking_info = transform_data_to_mongo(user, exclude_fields=['password'])
    
    project_tracking = ProjectTracking(
        user_reporter=tracking_info,
        action=f'change password user ({user.id} - {user.username})',
        created_time=timezone.now(),
        managed_data={
            'data': tracking_info
        },
    )
    
    project_tracking.save()
    
    return Response({'message': 'Password updated successfully'}, status=200)


#############################################
# DELETE USER
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user(request, id):
    data = request.data
    user_reporter = data.get('userReporter')
    try:
        user = LoginUser.objects(id=id).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)
        
        if user.username == user_reporter['username']:
            return Response({'error': 'You cannot delete your own account'}, status=400)
        
        user.delete()
        
        tracking_info = transform_data_to_mongo(user, exclude_fields=['password'])
        
        projects = Project.objects.all()
        for project in projects:
            has_change = False
            if project.user_reporter and str(project.user_reporter.get('id', '')) == id:
                project.user_reporter = None
                has_change = True
            if project.user_manager is not None:
                if str(project.user_reporter.get('id', '')) == id:
                    project.user_manager = None
                    has_change = True
                user_assignees = next((assignee for assignee in (project.users_assignees or []) if str(assignee['id']) == id), None)
                if user_assignees:
                    user_assignees = [assignee for assignee in (project.users_assignees or []) if str(assignee['id']) != id]
                    project.users_assignees = user_assignees
                    has_change = True
            default_tasks = project.project_default_tasks or []
            for default_task in default_tasks:
                task_user_assignees = next((assignee for assignee in (default_task['users_assignees'] or []) if str(assignee['id']) == id), None)
                if task_user_assignees:
                    task_user_assignees = [assignee for assignee in (default_task['users_assignees'] or []) if str(assignee['id']) != id]
                    default_task['users_assignees'] = task_user_assignees
                    has_change = True
            if has_change:
                project.save()
        
        project_tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete user ({user.id} - {user.username})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        project_tracking.save()
        
        if user_reporter:
            module='users'
            info=f'has deleted a user ({user.username})'
            info_id=user.id
            type='delete_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'message': 'User deleted successfully'}, status=200)
    except LoginUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        
#############################################
# DELETE USERS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_users(request):
    data = request.data
    user_reporter = data.get('userReporter')
    ids = data.get('userIds')
    try:
        users = LoginUser.objects(id__in=ids)
        if not users:
            return Response({'error': 'Users not found'}, status=404)
        
        users = [user for user in users if user.username != user_reporter['username']] 
        if not users:
            return Response({'error': 'You cannot delete your own account'}, status=400)
        
        for user in users:
            user.delete()
        
        tracking_info = [transform_data_to_mongo(user, exclude_fields=['password']) for user in users]
        
        projects = Project.objects.all()
        for project in projects:
            has_change = False
            for user in users:
                if project.user_reporter and str(project.user_reporter.get('id', '')) == str(user.id):
                    project.user_reporter = None
                    has_change = True
                if project.user_manager is not None:
                    if str(project.user_manager.get('id', '')) == str(user.id):
                        project.user_manager = None
                        has_change = True
                user_assignees = next((assignee for assignee in (project.users_assignees or []) if str(assignee['id']) == str(user.id)), None)
                if user_assignees:
                    user_assignees = [assignee for assignee in (project.users_assignees or []) if str(assignee['id']) != str(user.id)]
                    project.users_assignees = user_assignees
                    has_change = True
                default_tasks = project.project_default_tasks or []
                for default_task in default_tasks:
                    task_user_assignees = next((assignee for assignee in (default_task['users_assignees'] or []) if str(assignee['id']) == str(user.id)), None)
                    if task_user_assignees:
                        task_user_assignees = [assignee for assignee in (default_task['users_assignees'] or []) if str(assignee['id']) != str(user.id)]
                        default_task['users_assignees'] = task_user_assignees
                        has_change = True
            if has_change:
                project.save()
        
        project_tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete users ({", ".join([user.username for user in users])})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        project_tracking.save()
        
        if user_reporter:
            module='users'
            info=f'has deleted {len(users)} users'
            info_id='list'
            type='delete_users'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'message': 'Users deleted successfully'}, status=200)
    except LoginUser.DoesNotExist:
            return Response({'error': 'Users not found'}, status=404)
