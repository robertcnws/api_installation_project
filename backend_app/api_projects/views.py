from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from pymongo import MongoClient
from bson import json_util
from django.utils import timezone
from django.conf import settings
from api_authorization.models import LoginUser
from api_users.models import UserRole
from .models import (
    Project, 
    ProjectAttachment, 
    ProjectPermissions, 
    ProjectStage,
    ProjectTaskStage,
    ProjectTask,
    ProjectTaskAttachment,
    ProjectTracking,
    ProjectDefaultTask,
    ProjectTaskComment,
    ProjectNotification,
    ProjectNotificationUser,
    ProjectDefaultGuideProduct,
    ProjectReminder,
    ProjectDefaultMaterial,
)
from .s3_utils import (
    upload_attachment_to_s3, 
    generate_default_file_url,
    delete_attachment_from_s3,
    backup_mongo_to_s3,
    make_s3_archive_stream,
)
from .data_util import (
    transform_data_to_mongo,
    parse_custom_date,
    create_notification,
    create_entity_number,
    fix_order,
    fix_order_after_edit,
    get_current_stage_from_tasks,
    to_aware,
    find_task_in_stage,
    transform_dict_to_camelcase,
)
import zipstream
from django.http import StreamingHttpResponse
import zipfile
from django.http import HttpResponse
import json
import logging
import io

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


def create_task_number():
    last_task = ProjectTask.objects().order_by('-created_time').first()
    if not last_task:
        return 'T-00001'
    last_number = int(last_task.number.split('-')[1])
    return f'T-{str(last_number + 1).zfill(5)}'
    
    
#############################################
# DELETE PROJECT FILE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_file(request, id, folder, file):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try: 
        obj = Project.objects(id=id).first()
        attachments = obj.project_attachments if obj.project_attachments else []
        attachments = [attachment for attachment in attachments if attachment['file'] !=  folder + '/' + file]
        attachments = sorted(attachments, key=lambda x: to_aware(x['created_time']), reverse=True)
        obj.project_attachments = attachments
        obj.save()
        attachment = ProjectAttachment.objects(file=folder + '/' + file).first()
        attachment.project = transform_data_to_mongo(obj, include_fields=['id', 'name', 'number'])
        if not attachment:
            return Response({'error': 'Attachment not found'}, status=404)
        delete_attachment_from_s3(attachment.file)
        tracking_info = transform_data_to_mongo(attachment)
        attachment.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete project ({obj.id} - {obj.name}) file attachment',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has deleted file attachment in project {obj.name}'
            info_id=obj.id
            type='delete_project_file'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Project file deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE PROJECT DEFAULT TASK FILE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_task_file(request, projectId, id, folder, file):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try: 
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        tasks = project.project_default_tasks if project.project_default_tasks else []
        task = next((task for task in tasks if str(task['project_default_task']['_id']) == id), None)
        tasks = [task for task in tasks if str(task['project_default_task']['_id']) != id]
        attachments = task['project_task_attachments'] if task['project_task_attachments'] else []
        attachments = [attachment for attachment in attachments if attachment['file'] != folder + '/' + file]
        attachments = sorted(attachments, key=lambda x: to_aware(x['created_time']), reverse=True)
        task['project_task_attachments'] = attachments
        tasks.append(task)
        project.project_default_tasks = tasks
        project.save()
        attachment = ProjectTaskAttachment.objects(file=folder + '/' + file).first()
        attachment.project = transform_data_to_mongo(project, include_fields=['id', 'name', 'number'])
        if not attachment:
            return Response({'error': 'Attachment not found'}, status=404)
        delete_attachment_from_s3(attachment.file)
        tracking_info = transform_data_to_mongo(attachment)
        attachment.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete default task ({task['project_default_task']['id']} - {task['project_default_task']['name']}) file attachment in project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has deleted file attachment from task {task['project_default_task']['name']} in project {project.name}'
            info_id=project.id
            type='delete_task_file'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Project file deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# CREATE PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_project(request):         
    data = request.data

    # start_date = parse_custom_date(logger, data.get('startDate'))
    # end_date = parse_custom_date(logger, data.get('endDate'))
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    permission = ProjectPermissions.objects(name='full access').first()
    if not permission:
        permission = ProjectPermissions(
            name='full access',
            description='Full access to project',
        )
        permission.save()
    permission = transform_data_to_mongo(permission)
    
    users_assignees = json.loads(data.get('usersAssignees', []))
    
    user_manager = data.get('userManager', None)
    
    if user_manager:
        user_manager['project_permissions'] = [permission]
        users_assignees.append(user_manager)
        
    else:
        user_manager = {
            'id': user_reporter.get('id'),
            'name': user_reporter.get('name') if user_reporter.get('name') else f'{user_reporter.get('first_name')} {user_reporter.get('last_name')}'.strip(),
            'firstName': user_reporter.get('first_name'),
            'lastName': user_reporter.get('last_name'),
            'avatarUrl': user_reporter.get('avatar_url'),
            'username': user_reporter.get('username'),
            'email': user_reporter.get('email'),
            'isStaff': user_reporter.get('is_staff'),
            'isActive': user_reporter.get('is_active'),
            'userRole': user_reporter.get('user_role'),
            'project_permissions': [permission],
        }
    
    has_permission_str = data.get('hasPermission', 'false') if data.get('hasPermission') else None
    if has_permission_str:
        has_permission = True if has_permission_str.lower() == 'true' else False
    
    current_stage = ProjectStage.objects(name='Preparation').first()
    
    current_stage = transform_data_to_mongo(current_stage)
    
    for user in users_assignees:
        user['project_permissions'] = [permission]
    
    user_reporter['project_permissions'] = [permission]
    
    sales_order = json.loads(data.get('salesOrder'))

    number = create_entity_number(sales_order.get('salesorder_number'))
    
    project_attachments = []
    files = request.FILES.getlist('projectAttachments')
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj)
        if key:
            # Ejemplo: url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{key}"
            attachment = ProjectAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload = user_reporter,
            )
            attachment.save()
            project_attachments.append(transform_data_to_mongo(attachment))
            
    project_attachments = sorted(project_attachments, key=lambda x: x['name'], reverse=True)
    
    default_tasks = ProjectDefaultTask.objects.all().order_by('order')
    
    list_default_tasks_info = []
    
    for default_task in default_tasks:
        info = {
            'project_default_task': transform_data_to_mongo(default_task),
            'status': 'not started',
            'percentage': 0,
            'created_time': timezone.now(),
            'last_modified_time': timezone.now(),
            'users_assignees': [user_manager] if user_manager else [],
            'user_reporter': user_reporter,
            'priority': 'medium',
            'project_task_attachments': [],
        }
        list_default_tasks_info.append(info)
        
    warehouse_role = UserRole.objects(name__iexact='warehouse staff').first()
        
    warehouse_users = LoginUser.objects.all()
    
    warehouse_users = [user for user in warehouse_users if user.user_role.get('id') == warehouse_role.id]
        
    def add_name_field(user_obj):
        transformed = transform_data_to_mongo(user_obj, exclude_fields=['password'])
        transformed = transform_dict_to_camelcase(transformed)
        first = transformed.get('firstName') or (user_obj.get('first_name') if isinstance(user_obj, dict) else '')
        last  = transformed.get('lastName')  or (user_obj.get('last_name') if isinstance(user_obj, dict) else '')
        transformed['name'] = f"{first} {last}".strip()
        transformed['project_permissions'] = [permission]
        return transformed
        
    for default_task in list_default_tasks_info:
        if default_task['project_default_task']['name'].lower() == settings.TASK_ORDER_IS_READY_TO_PICK_UP.lower() or \
            default_task['project_default_task']['name'].lower() == settings.TASK_PICK_UP_ORDER.lower():
                assignees = [add_name_field(user) for user in warehouse_users]
                default_task['users_assignees'] = assignees
                
    if isinstance(users_assignees, list):
        users_assignees.extend(add_name_field(user) for user in warehouse_users)
        
    installation_description = sales_order.get('line_items', [])
    installation_description = [
        item.get('description') for item in installation_description if item.get('description') \
        and item.get('name').lower() == settings.PROJECT_ITEM_INSTALLATION_NAME.lower()
    ]
    structural_description = sales_order.get('line_items', [])
    structural_description = [
        item.get('description') for item in structural_description if item.get('description') \
        and item.get('name').lower() == settings.PROJECT_ITEM_STRUCTURAL_NAME.lower()
    ]
    
    description = f'{data.get('description')} & ' + '.'.join(installation_description) + ' & ' + '.'.join(structural_description)
    
    work_scope = '.'.join(installation_description) + ' & ' + '.'.join(structural_description)
    
    existing_number_project = Project.objects(number=number).first()
    
    if existing_number_project is None:
        try:
            project = Project(
                name=data.get('name', ''),
                description=description, 
                sales_order=sales_order, 
                users_assignees=users_assignees,
                # start_date=start_date,
                # end_date=end_date,
                address=data.get('address', ''),
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                is_active=True,
                current_stage=current_stage,    
                user_reporter=user_reporter,
                project_attachments=project_attachments,
                number=number,
                user_manager=user_manager,
                has_permission=has_permission,
                project_default_tasks=list_default_tasks_info,
                all_products_marked=False,
                all_windows_marked=False,
                all_screw_marked=False,
                all_trash_marked=False,
                feedback='',
                work_scope=work_scope,
                project_materials=[],
                project_materials_other_notes='',
            )
            
            project.save()
            
            tracking = ProjectTracking(
                user_reporter=user_reporter,
                action=f'create project ({project.id} - {project.name})',
                created_time=timezone.now(),
                managed_data={
                    'data': transform_data_to_mongo(project, exclude_fields=['sales_order'])
                },
            )
            tracking.save()
            
            if user_reporter:
                module='projects'
                info=f'has created new project {project.name}'
                info_id=project.id
                type='create_project'
                create_notification(module, info_id, info, type, user_reporter['username'])
            
            return Response({
                'message': 'Project created successfully',
                'data': json.loads(project.to_json())
            }, status=201)

        except Exception as e:
            return Response({'error': str(e)}, status=500)
    

#############################################
# CREATE PROJECTS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_projects(request):         
    data = request.data
    
    sales_orders = data.get('salesOrders', [])
    
    user_reporter = data.get('userReporter', None)
    
    today = timezone.now()
    a_week_later = today + timezone.timedelta(days=7)

    # start_date = parse_custom_date(logger, today.strftime('%Y-%m-%d'))
    # end_date = parse_custom_date(logger, a_week_later.strftime('%Y-%m-%d'))
    
    permission = ProjectPermissions.objects(name='full access').first()
    permission = transform_data_to_mongo(permission)
    
    users_assignees = []
    
    user_manager = None
    
    has_permission = False
    
    current_stage = ProjectStage.objects(name='Preparation').first()
    
    current_stage = transform_data_to_mongo(current_stage)
    
    user_reporter['project_permissions'] = [permission]
    
    project_attachments = []
    
    count = 0
    
    list_tracking_info = []
    
    default_tasks = ProjectDefaultTask.objects().all().order_by('order')
    
    list_default_tasks_info = []
    
    for default_task in default_tasks:
        info = {
            'project_default_task': transform_data_to_mongo(default_task),
            'status': 'not started',
            'percentage': 0,
            'created_time': timezone.now(),
            'last_modified_time': timezone.now(),
            'users_assignees': [],
            'user_reporter': user_reporter,
            'priority': 'medium',
            'project_task_attachments': [],
        }
        list_default_tasks_info.append(info)
        
    
    warehouse_role = UserRole.objects(name__iexact='warehouse staff').first()
        
    warehouse_users = LoginUser.objects.all()
    
    warehouse_users = [user for user in warehouse_users if user.user_role.get('id') == str(warehouse_role.id)]
    
    def add_name_field(user_obj):
        transformed = transform_data_to_mongo(user_obj, exclude_fields=['password'])
        transformed = transform_dict_to_camelcase(transformed)
        first = transformed.get('firstName') or (user_obj.get('first_name') if isinstance(user_obj, dict) else '')
        last  = transformed.get('lastName')  or (user_obj.get('last_name') if isinstance(user_obj, dict) else '')
        transformed['name'] = f"{first} {last}".strip()
        transformed['project_permissions'] = [permission]
        return transformed
        
    for default_task in list_default_tasks_info:
        if default_task['project_default_task']['name'].lower() == settings.TASK_ORDER_IS_READY_TO_PICK_UP.lower() or \
            default_task['project_default_task']['name'].lower() == settings.TASK_PICK_UP_ORDER.lower():
                assignees = [add_name_field(user) for user in warehouse_users]
                default_task['users_assignees'] = assignees
                
    if user_manager:    
        user_manager['project_permissions'] = [permission]
        
    else:
        user_manager = {
            'id': user_reporter.get('id'),
            'name': user_reporter.get('name') if user_reporter.get('name') else f'{user_reporter.get('first_name')} {user_reporter.get('last_name')}'.strip(),
            'firstName': user_reporter.get('first_name'),
            'lastName': user_reporter.get('last_name'),
            'avatarUrl': user_reporter.get('avatar_url'),
            'username': user_reporter.get('username'),
            'email': user_reporter.get('email'),
            'isStaff': user_reporter.get('is_staff'),
            'isActive': user_reporter.get('is_active'),
            'userRole': user_reporter.get('user_role'),
            'project_permissions': [permission],
        }
                  
    users_assignees = [user_manager] if user_manager else []
    
    users_assignees.extend(add_name_field(user) for user in warehouse_users)
    
    for sales_order in sales_orders:
        
        installation_description = sales_order.get('line_items', [])
        installation_description = [
            item.get('description') for item in installation_description if item.get('description') \
            and item.get('name').lower() == settings.PROJECT_ITEM_INSTALLATION_NAME.lower()
        ]
        structural_description = sales_order.get('line_items', [])
        structural_description = [
            item.get('description') for item in structural_description if item.get('description') \
            and item.get('name').lower() == settings.PROJECT_ITEM_STRUCTURAL_NAME.lower()
        ]
        description = f'Project for sales order {sales_order.get("salesorder_number")} & ' + '.'.join(installation_description) + ' & ' + '.'.join(structural_description)

        work_scope = '.'.join(installation_description) + ' & ' + '.'.join(structural_description)
        
        number = create_entity_number(sales_order.get('salesorder_number'))
        
        existing_number_project = Project.objects(number=number).first()
        
        if existing_number_project is None:
            try:
                project = Project(
                    name=f'{sales_order.get("salesorder_number")} ({sales_order.get("customer_name")})',
                    description=description, 
                    sales_order=sales_order, 
                    users_assignees=users_assignees,
                    # start_date=start_date,
                    # end_date=end_date,
                    address='You can add the address here',
                    created_time=timezone.now(),
                    last_modified_time=timezone.now(),
                    is_active=True,
                    current_stage=current_stage,
                    user_reporter=user_reporter,
                    project_attachments=project_attachments,
                    project_tasks=[],
                    number = number, 
                    user_manager=user_manager,
                    has_permission=has_permission,
                    project_default_tasks=list_default_tasks_info,
                    all_products_marked=False,
                    all_windows_marked=False,
                    all_screw_marked=False,
                    all_trash_marked=False,
                    feedback='',
                    work_scope=work_scope,
                    project_materials=[],
                    project_materials_other_notes='',
                )
                project.save()
                tracking_info = transform_data_to_mongo(project, exclude_fields=['sales_order'])
                list_tracking_info.append(tracking_info)
                count += 1
            except Exception as e:
                return Response({'error': str(e)}, status=500)
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'create list projects',
        created_time=timezone.now(),
        managed_data={
            'data': list_tracking_info
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has created {count} new projects'
        info_id='list'
        type='create_projects'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': f'{count} Project(s) created successfully',
        'data': tracking_info
    }, status=200)
    

#############################################
# UPDATE PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_project(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    last_stage = project.current_stage
    last_attachments = project.project_attachments if project.project_attachments else []   
            
    data = request.data
    
    include_fields = ['id', 'name', 'number']
    
    has_permission_str = data.get('hasPermission', 'false') if data.get('hasPermission') else None
    if data.get('hasPermission'):
        include_fields.append('has_permission')
        
    if has_permission_str:
        has_permission = True if has_permission_str.lower() == 'true' else False
    
    user_manager = json.loads(data.get('userManager', None)) if data.get('userManager') else project.user_manager
    if data.get('userManager'):
        include_fields.append('user_manager')
        
    project_default_tasks = json.loads(data.get('projectDefaultTasks', [])) if data.get('projectDefaultTasks') else project.project_default_tasks
    if data.get('projectDefaultTasks'):
        include_fields.append('project_default_tasks')
    
    project_comments = json.loads(data.get('projectComments', [])) if data.get('projectComments') else project.project_comments
    if data.get('projectComments'):
        include_fields.append('project_comments')

    start_date = parse_custom_date(logger, data.get('startDate')) if data.get('startDate') else project.start_date
    if data.get('startDate'):
        include_fields.append('start_date')
        
    end_date = parse_custom_date(logger, data.get('endDate')) if data.get('endDate') else project.end_date
    if data.get('endDate'):
        include_fields.append('start_date')
    
    inspection_date = parse_custom_date(logger, data.get('inspectionDate')) if data.get('inspectionDate') else project.inspection_date
    if data.get('inspectionDate'):
        include_fields.append('inspection_date')
    
    finish_permission_date = parse_custom_date(logger, data.get('finishPermissionDate')) if data.get('finishPermissionDate') else project.finish_permission_date
    if data.get('finishPermissionDate'):
        include_fields.append('finish_permission_date')
        
    
    is_part_days_str = data.get('isPartDays', '')
    if is_part_days_str:
        is_part_days = True if is_part_days_str.lower() == 'true' else False
        if data.get('isPartDays') and is_part_days != project.is_part_days:
            include_fields.append('is_part_days')
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    users_assignees = json.loads(data.get('usersAssignees', [])) if data.get('usersAssignees') else project.users_assignees
    if data.get('usersAssignees'):
        include_fields.append('users_assignees')
    
    if user_manager:
        if user_manager.get('id') not in [user.get('id') for user in users_assignees]:
            users_assignees.append(user_manager)
        
        for task in project_default_tasks:
            if user_manager.get('id') not in [user.get('id') for user in task['users_assignees']]:
                task['users_assignees'].append(user_manager)
    
    current_stage = json.loads(data.get('currentStage', {})) if data.get('currentStage') else project.current_stage
    if data.get('currentStage'):
        include_fields.append('current_stage')
    
    last_stage_id = last_stage['_id'] if '_id' in last_stage else last_stage['id']
    current_stage_id = current_stage['_id'] if '_id' in current_stage else current_stage['id']
    
    if last_stage_id != current_stage_id:
        project_history = project.project_history if project.project_history else []
        project_history.append({
            'initial_stage': last_stage,
            'final_stage': current_stage,
            'created_time': timezone.now()
        })
        project.project_history = project_history
    
    project_attachments = []
    files = request.FILES.getlist('projectAttachments')
    
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj)
        if key:
            attachment = ProjectAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload = user_reporter,
            )
            attachment.save()
            project_attachments.append(transform_data_to_mongo(attachment))
            
    last_attachments.extend(project_attachments)
            
    last_attachments = sorted(last_attachments, key=lambda x: x['name'], reverse=True)
    
    if files:
        include_fields.append('project_attachments')
    
    if start_date or inspection_date:
        all_tasks = project.project_default_tasks if project.project_default_tasks else []
        for task in all_tasks:
            if start_date and settings.TASK_COORDINATE_INSTALLATION_DATE.lower() in task['project_default_task']['name'].lower():
                task['status'] = 'finished'
                task['percentage'] = 100
                task['last_modified_time'] = timezone.now()
            if inspection_date and settings.TASK_COORDINATE_INSPECTION.lower() in task['project_default_task']['name'].lower():
                task['status'] = 'finished'
                task['percentage'] = 100
                task['last_modified_time'] = timezone.now()
        project.project_default_tasks = all_tasks
    
    
    project.name = data.get('name', project.name) if data.get('name') else project.name
    project.description = data.get('description', project.description) if data.get('description') else project.description
    project.users_assignees = users_assignees if users_assignees else project.users_assignees
    project.start_date = start_date if start_date else project.start_date
    project.end_date = end_date if end_date else project.end_date
    project.address = data.get('address', project.address) if data.get('address') else project.address
    project.last_modified_time = timezone.now()
    project.current_stage = current_stage if current_stage else project.current_stage
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    project.project_attachments = last_attachments if last_attachments else project.project_attachments
    project.user_manager = user_manager if user_manager else project.user_manager
    project.has_permission = has_permission if has_permission_str else project.has_permission
    project.project_default_tasks = project_default_tasks if project_default_tasks else project.project_default_tasks
    project.project_comments = project_comments if project_comments else project.project_comments
    project.inspection_date = inspection_date if inspection_date else project.inspection_date
    project.finish_permission_date = finish_permission_date if finish_permission_date else project.finish_permission_date
    project.is_part_days = is_part_days if is_part_days_str else project.is_part_days
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'update project ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=include_fields)
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has updated project {project.name}'
        info_id=project.id
        type='update_project'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT PERMISSION
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_permission(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    has_permission_str = data.get('hasPermission', 'false') if data.get('hasPermission') else None
    if has_permission_str:
        has_permission = True if has_permission_str.lower() == 'true' else False
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    project.has_permission = has_permission if has_permission_str else project.has_permission
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project permission ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'has_permission'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed permission in project {project.name}'
        info_id=project.id
        type='change_project_permission'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT ADDRESS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_address(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    project.address = data.get('address', project.address) if data.get('address') else project.address
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project address ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'address'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed address in project {project.name}'
        info_id=project.id
        type='change_project_address'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT PHONE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_phone_number(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    current_phone_number = project.sales_order.get('customer', None).get('phone', '') or project.sales_order.get('customer', None).get('mobile', '')
    
    phone_number = data.get('phoneNumber', current_phone_number) if data.get('phoneNumber') else current_phone_number
    
    sales_order = project.sales_order
    
    sales_order['customer']['phone'] = phone_number
    sales_order['customer']['mobile'] = phone_number
    
    project.sales_order = sales_order
    
    project.phone = phone_number if phone_number else ''
    
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project phone number ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed phone number in project {project.name}'
        info_id=project.id
        type='change_project_phone_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT REFERENCE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_reference_number(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    ref_number = data.get('refNumber', '')
        
    sales_order = project.sales_order if project.sales_order else {}
    sales_order['reference_number'] = ref_number
    
    project.sales_order = sales_order
    project.reference_number = ref_number if ref_number else '000000'
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project reference number ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'reference_number', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed reference number in project {project.name}'
        info_id=project.id
        type='change_project_reference_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    

#############################################
# CHECK ITEM INSTALLATION GUIDE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def check_project_item_installation_guide(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    new_product = json.loads(data.get('product', {})) if data.get('product') else {}
    
    products_guide = project.project_guide_products if project.project_guide_products else []
    
    new_product_id = new_product.get("id")
    
    product_exists = next((p for p in products_guide if p.get("id") == new_product_id), None)
        
    if product_exists:
        products_guide = [p for p in products_guide if p.get("id") != new_product_id]
        
    products_guide.append(new_product)
        
    products_guide = sorted(products_guide, key=lambda x: x["id"], reverse=True)
        
    project.project_guide_products = products_guide
            
    project.save()
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'check project item in installation guide ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'project_guide_products'])
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has checked item in installation guide for project {project.name}'
        info_id=project.id
        type='check_project_item_installation_guide'
        create_notification(module, info_id, info, type, user_reporter['username'])
            
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT RELEASE FORM
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_release_form(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    all_products_marked_str = data.get('allProductsMarked', 'false') if data.get('allProductsMarked') else None
    if all_products_marked_str:
        all_products_marked = True if all_products_marked_str.lower() == 'true' else False
        
    all_windows_marked_str = data.get('allWindowsMarked', 'false') if data.get('allWindowsMarked') else None
    if all_windows_marked_str:
        all_windows_marked = True if all_windows_marked_str.lower() == 'true' else False
        
    all_screw_marked_str = data.get('allScrewMarked', 'false') if data.get('allScrewMarked') else None
    if all_screw_marked_str:
        all_screw_marked = True if all_screw_marked_str.lower() == 'true' else False
        
    all_trash_marked_str = data.get('allTrashMarked', 'false') if data.get('allTrashMarked') else None
    if all_trash_marked_str:
        all_trash_marked = True if all_trash_marked_str.lower() == 'true' else False
    
    project.all_products_marked = all_products_marked if all_products_marked_str else project.all_products_marked
    project.all_windows_marked = all_windows_marked if all_windows_marked_str else project.all_windows_marked
    project.all_screw_marked = all_screw_marked if all_screw_marked_str else project.all_screw_marked
    project.all_trash_marked = all_trash_marked if all_trash_marked_str else project.all_trash_marked
    project.feedback = data.get('feedback', project.feedback) if data.get('feedback') else project.feedback
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    
    all_tasks = project.project_default_tasks if project.project_default_tasks else []
    for task in all_tasks:
        if settings.TASK_COMPLETE_SATISFACTION_FORM.lower() in task['project_default_task']['name'].lower():
            task['status'] = 'finished'
            task['percentage'] = 100
            task['last_modified_time'] = timezone.now()
            
    project.project_default_tasks = all_tasks
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project release form ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(
                project, include_fields=['id', 'name', 'all_products_marked', 'all_windows_marked', 'all_screw_marked', 'all_trash_marked', 'feedback']
            )
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed release form in project {project.name}'
        info_id=project.id
        type='change_project_release_form'
        create_notification(module, info_id, info, type, user_reporter.get('username'))
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    

#############################################
# CHANGE PROJECT INSTALLATION GUIDE FORM
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_installation_guide_form(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    work_scope = data.get('workScope', project.work_scope) if data.get('workScope') else project.work_scope
    
    other_notes = data.get('projectMaterialsOtherNotes', project.project_materials_other_notes) \
                    if data.get('projectMaterialsOtherNotes') else project.project_materials_other_notes
    
    project_materials = json.loads(data.get('projectMaterials', [])) if data.get('projectMaterials') else project.project_materials
    
    project_guide_products = json.loads(data.get('projectGuideProducts', [])) if data.get('projectGuideProducts') else project.project_guide_products
    
    if project.project_guide_products is not None or isinstance(project.project_guide_products, list):
        deleted_products = [p for p in project.project_guide_products if p.get('deleted', False) == True]
        project_guide_products.extend(deleted_products)
    
    project.work_scope = work_scope
    project.project_materials_other_notes = other_notes
    project.project_materials = project_materials
    project.project_guide_products = project_guide_products
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    
    all_tasks = project.project_default_tasks if project.project_default_tasks else []
    for task in all_tasks:
        if settings.TASK_GENERATE_INSTALLATION_GUIDE.lower() in task['project_default_task']['name'].lower():
            task['status'] = 'finished'
            task['percentage'] = 100
            task['last_modified_time'] = timezone.now()
    
    project.project_default_tasks = all_tasks
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project installation guide form ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(
                project, include_fields=['id', 'name', 'work_scope', 'project_materials_other_notes', 'project_materials', 'project_guide_products']
            )
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed installation guide form in project {project.name}'
        info_id=project.id
        type='change_project_installation_guide_form'
        create_notification(module, info_id, info, type, user_reporter.get('username'))
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    

#############################################
# ADD USERS ASSIGNEES TO PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def add_project_users_assignees(request, id): 
    
    data = request.data
    user_reporter = data.get('userReporter', None)
    users_assignees = data.get('usersAssignees', [])
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    project.users_assignees = users_assignees
    project.user_reporter = user_reporter
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'add project users assignees',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'users_assignees', 'number'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has added users assignees in project {project.name}'
        info_id=project.id
        type='add_project_users_assignees'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project users assignees added successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    

#############################################
# DELETE PROJECT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        project = Project.objects(id=id).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        attachments = project.project_attachments if project.project_attachments else []
        ProjectAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
        for attachment in attachments:
            delete_attachment_from_s3(attachment['file'])
        project.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(project)
            },
        )
        tracking.save()
        if user_reporter:
            module='projects'
            info=f'has deleted project {project.name}'
            info_id=project.id
            type='delete_project'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Project deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE PROJECTS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_projects(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    list_tracking_info = []
    try:
        projects = Project.objects(id__in=ids).all()
        if not projects:
            return Response({'error': 'Projects not found'}, status=404)
        for project in projects:
            tracking_info = transform_data_to_mongo(project, exclude_fields=['sales_order'])
            list_tracking_info.append(tracking_info)
            attachments = project.project_attachments if project.project_attachments else []
            ProjectAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
            for attachment in attachments:
                delete_attachment_from_s3(attachment['file'])
            tasks = project.project_tasks if project.project_tasks else []
            for task in tasks:
                attachments = task['project_task_attachments'] if task['project_task_attachments'] else []
                ProjectTaskAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
                for attachment in attachments:
                    delete_attachment_from_s3(attachment['file'])
                ProjectTask.objects(id__in=[task['_id'] for task in tasks]).delete()
            project.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list projects',
            created_time=timezone.now(),
            managed_data={
                'data': list_tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='projects'
            info=f'has deleted {len(ids)} projects'
            info_id='list'
            type='delete_projects'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Projects deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE PROJECT USER
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_user(request, id, userId):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        project = Project.objects(id=id).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        users_assignees = project.users_assignees if project.users_assignees else []
        tracking_info = next((user for user in users_assignees if str(user['id']) == userId), None)
        users_assignees = [user for user in users_assignees if str(user['id']) != userId]
        users_assignees = sorted(
            users_assignees, key=lambda x: x['created_time' if 'created_time' in x else 'username'], reverse=True
        )
        project.users_assignees = users_assignees
        default_tasks = project.project_default_tasks if project.project_default_tasks else []
        new_default_tasks = []
        for task in default_tasks:
            users_assignees = task['users_assignees'] if task['users_assignees'] else []
            users_assignees = [user for user in users_assignees if str(user['id']) != userId]
            task['users_assignees'] = users_assignees
            new_default_tasks.append(task)
            sorted_tasks = sorted(new_default_tasks, key=lambda x: to_aware(x['created_time']), reverse=True)
        project.project_default_tasks = sorted_tasks
        project.save()
        if tracking_info:
            tracking = ProjectTracking(
                user_reporter=user_reporter,
                action=f'delete project user ({tracking_info["id"]} - {tracking_info["username"]}) from project ({project.id} - {project.name})',
                created_time=timezone.now(),
                managed_data={
                    'data': tracking_info
                },
            )
            tracking.save()
        if user_reporter:
            module='projects'
            info=f'has deleted user {tracking_info["username"]} from project {project.name}'
            info_id=project.id
            type='delete_project_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Project user deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# GET FILE URL
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_default_file_url(request):
    object_key = request.query_params.get('key')
    if not object_key:
        return Response({'error': 'A key was not sended'}, status=400)
    try:
        url = generate_default_file_url(object_key)
        return Response({'url': url})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CREATE STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_stage(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        other_name = data.get('otherName', '')
        stage = ProjectStage.objects(name=name).first()
        if stage:
            return Response({'error': 'Stage already exists'}, status=404)
        stage = ProjectStage.objects(order=order).first()
        if stage:
            return Response({'error': 'Stage with this order already exists'}, status=404)
        stage = ProjectStage(
            name=name,
            order=order,
            description=description,
            other_name=other_name
        )
        stage.save()
        tracking_info = transform_data_to_mongo(stage)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create stage ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='stages'
            info=f'has created new stage {stage.name}'
            info_id=stage.id
            type='create_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_stage(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        other_name = data.get('otherName', '')
        order = data.get('order', 0)
        stage = ProjectStage.objects(name=name).first()
        if stage and str(stage.id) != id:
            return Response({'error': 'Stage already exists'}, status=404)
        stage = ProjectStage.objects(order=order).first()
        if stage and str(stage.id) != id:
            return Response({'error': 'Stage with this order already exists'}, status=404)
        stage = ProjectStage.objects(id=id).first()
        if not stage:
            return Response({'error': 'Stage not found'}, status=404)
        stage.name = name
        stage.description = description
        stage.order = order
        stage.other_name = other_name
        stage.save()
        
        projects = Project.objects.all()
        current_stage_projects = [project for project in projects if project.current_stage and str(project.current_stage.get('id')) == id]
        for project in current_stage_projects:
            project.current_stage = transform_data_to_mongo(stage)
            project.save()
        
        default_tasks_projects = [
            p for p in projects
            if any(
                task.get('project_default_task', {})\
                    .get('project_stage', {})\
                    .get('id') == id
                for task in (p.project_default_tasks or [])
            )
        ]
        for project in default_tasks_projects:
            all_tasks = project.project_default_tasks if project.project_default_tasks else []
            for task in all_tasks:
                if task.get('project_default_task').get('project_stage').get('id') == id:
                    task['project_default_task']['project_stage'] = transform_data_to_mongo(stage)
            project.project_default_tasks = all_tasks
            project.save()
        
        
        default_task_attachments_projects = [
            p for p in projects
            if any(
                any(
                    (attach.get('due_project_stage') or {}).get('id') == id 
                    for attach in (task.get('project_task_attachments') or [])
                )
                for task in (p.project_default_tasks or [])
            )
        ]
        for project in default_task_attachments_projects:
            all_tasks = project.project_default_tasks if project.project_default_tasks else []
            for task in all_tasks:
                if task.get('project_task_attachments'):
                    for attachment in task.get('project_task_attachments'):
                        if attachment.get('due_project_stage').get('id') == id:
                            attachment['due_project_stage'] = transform_data_to_mongo(stage)
            project.project_default_tasks = all_tasks
            project.save()
        
        
        attachments_projects = [
            p for p in projects
            if any(
                task.get('current_stage', {})\
                    .get('id') == id
                for task in (p.project_attachments or [])
            )
        ]
        for project in attachments_projects:
            attachments = project.project_attachments if project.project_attachments else []
            for attachment in attachments:
                if attachment.get('current_stage').get('id') == stage.id:
                    attachment['current_stage'] = transform_data_to_mongo(stage)
            project.project_attachments = attachments
            project.save()
        
        
        tracking_info = transform_data_to_mongo(stage)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update stage ({tracking_info.get("id")} - {tracking_info.get("name")})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='stages'
            info=f'has updated stage {stage.name}'
            info_id=stage.id
            type='update_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE STAGE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_stage(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        stage = ProjectStage.objects(id=id).first()
        if not stage:
            return Response({'error': 'Stage not found'}, status=404)
        tracking_info = transform_data_to_mongo(stage)
        stage.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete stage ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='stages'
            info=f'has deleted stage {stage.name}'
            info_id=stage.id
            type='delete_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE STAGES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_stages(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        stages = ProjectStage.objects(id__in=ids).all()
        if not stages:
            return Response({'error': 'Stages not found'}, status=404)
        tracking_info = [transform_data_to_mongo(stage) for stage in stages]
        ProjectStage.objects(id__in=ids).delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list stages',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='stages'
            info=f'has deleted {len(ids)} stages'
            info_id='list'
            type='delete_stages'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stages deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    

#############################################
# CREATE STAGE TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_stage_task(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = ProjectTaskStage.objects(name=name).first()
        if stage:
            return Response({'error': 'Stage task already exists'}, status=404)
        stage = ProjectTaskStage.objects(order=order).first()
        if stage:
            return Response({'error': 'Stage task with this order already exists'}, status=404)
        stage = ProjectTaskStage(
            name=name,
            order=order,
            description=description
        )
        stage.save()
        tracking_info = transform_data_to_mongo(stage)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create stage task ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='stage_tasks'
            info=f'has created new stage task {stage.name}'
            info_id=stage.id
            type='create_stage_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage task created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT STAGE TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_stage_task(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = ProjectTaskStage.objects(name=name).first()
        if stage and str(stage.id) != id:
            return Response({'error': 'Stage task already exists'}, status=404)
        stage = ProjectTaskStage.objects(order=order).first()
        if stage and str(stage.id) != id:
            return Response({'error': 'Stage task with this order already exists'}, status=404)
        stage = ProjectTaskStage.objects(id=id).first()
        if not stage:
            return Response({'error': 'Stage task not found'}, status=404)
        stage.name = name
        stage.description = description
        stage.order = order
        stage.save()
        tracking_info = transform_data_to_mongo(stage)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update stage task ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='stage_tasks'
            info=f'has updated stage task {stage.name}'
            info_id=stage.id
            type='update_stage_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage task updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE STAGE TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_stage_task(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        stage = ProjectTaskStage.objects(id=id).first()
        if not stage:
            return Response({'error': 'Stage task not found'}, status=404)
        tracking_info = transform_data_to_mongo(stage)
        stage.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete stage task ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='stage_tasks'
            info=f'has deleted stage task {stage.name}'
            info_id=stage.id
            type='delete_stage_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage task deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE STAGES TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_stages_task(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        stages_tasks = ProjectTaskStage.objects(id__in=ids).all()
        if not stages_tasks:
            return Response({'error': 'Stages tasks not found'}, status=404)
        tracking_info = [transform_data_to_mongo(stage) for stage in stages_tasks]
        ProjectTaskStage.objects(id__in=ids).delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list stages task',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='stage_tasks'
            info=f'has deleted {len(ids)} stages tasks'
            info_id='list'
            type='delete_stage_tasks'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stages task deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CREATE PROJECT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_project_task(request):         
    data = request.data

    start_date = parse_custom_date(logger, data.get('startDate'))
    end_date = parse_custom_date(logger, data.get('endDate'))
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    project_id = data.get('projectId')
    
    project = Project.objects(id=project_id).first()
    
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    project = transform_data_to_mongo(project, include_fields=['id', 'name', 'number'])
    
    users_assignees = json.loads(data.get('usersAssignees', []))
    
    current_stage = json.loads(data.get('currentStage', {}))
    
    priority = data.get('priority', None)
    
    project_task_attachments = []
    
    files = request.FILES.getlist('projectTaskAttachments')
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj, folder=settings.AWS_S3_FOLDER_TASKS)
        if key:
            # Ejemplo: url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{key}"
            attachment = ProjectTaskAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload = user_reporter,
            )
            attachment.save()
            project_task_attachments.append(transform_data_to_mongo(attachment))
            
    project_task_attachments = sorted(project_task_attachments, key=lambda x: x['name'], reverse=True)

    try:
        project_task = ProjectTask(
            name=data.get('name', ''),
            description=data.get('description'),
            users_assignees=users_assignees,
            start_date=start_date,
            end_date=end_date,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            is_active=True,
            current_stage=current_stage,  
            user_reporter=user_reporter,
            project_task_attachments=project_task_attachments,
            project=project,
            number=create_task_number(),
            priority=priority,  
        )
        
        project_task.save()
        
        tracking_info = transform_data_to_mongo(project_task)
        
        project = Project.objects(id=project_id).first()
        existing_tasks = project.project_tasks if project.project_tasks is not None else []
        project_task = transform_data_to_mongo(project_task, exclude_fields=['project'])
        
        existing_tasks.append(project_task)
        sorted_tasks = sorted(existing_tasks, key=lambda x: x['number'], reverse=True)
        project.project_tasks = sorted_tasks
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create project task ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='project_tasks'
            info=f'has created new task {project_task["name"]} in project {project.name}'
            info_id=project_task['id']
            type='create_project_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({
            'message': 'Project task created successfully',
            'data': project_task
        }, status=201)

    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# UPDATE PROJECT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_project_task(request, id):
    
    project_task = ProjectTask.objects(id=id).first()
    if not project_task:
        return Response({'error': 'Project task not found'}, status=404)
    initial_tasks_attachments = project_task.project_task_attachments if project_task.project_task_attachments else []
    initial_stage = project_task.current_stage
             
    data = request.data

    start_date = parse_custom_date(logger, data.get('startDate'))
    end_date = parse_custom_date(logger, data.get('endDate'))
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    project_id = data.get('projectId')
    
    project = Project.objects(id=project_id).first()
    
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    project = transform_data_to_mongo(project, include_fields=['id', 'name', 'number'])
    
    users_assignees = json.loads(data.get('usersAssignees', []))
    
    current_stage = json.loads(data.get('currentStage', {}))
    
    priority = data.get('priority', None)
    
    project_task_attachments = []
    
    files = request.FILES.getlist('projectTaskAttachments')
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj, folder=settings.AWS_S3_FOLDER_TASKS)
        if key:
            attachment = ProjectTaskAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload = user_reporter,
            )
            attachment.save()
            project_task_attachments.append(transform_data_to_mongo(attachment))
            
    project_task_attachments = sorted(project_task_attachments, key=lambda x: x['name'], reverse=True)
    initial_tasks_attachments.extend(project_task_attachments)
    initial_tasks_attachments = sorted(initial_tasks_attachments, key=lambda x: x['name'], reverse=True)
    
    initial_stage_id = initial_stage['_id'] if '_id' in initial_stage else initial_stage['id']
    current_stage_id = current_stage['_id'] if '_id' in current_stage else current_stage['id']
    
    if initial_stage_id != current_stage_id:
        task_history = project_task.project_task_history if project_task.project_task_history else []
        task_history.append({
            'initial_stage': initial_stage,
            'final_stage': current_stage,
            'created_time': timezone.now()
        })
        project_task.project_task_history = task_history
    
    project_task.name = data.get('name', '')
    project_task.description = data.get('description')
    project_task.users_assignees = users_assignees
    project_task.start_date = start_date
    project_task.end_date = end_date
    project_task.last_modified_time = timezone.now()
    project_task.current_stage = current_stage
    project_task.user_reporter = user_reporter
    project_task.project_task_attachments = initial_tasks_attachments
    project_task.priority = priority
    project_task.project = project  
    project_task.save()
    
    tracking_info = transform_data_to_mongo(project_task)
        
    project = Project.objects(id=project_id).first()
    existing_tasks = project.project_tasks if project.project_tasks is not None else []
    project_task = transform_data_to_mongo(project_task, exclude_fields=['project'])
    existing_tasks = [task for task in existing_tasks if str(task['_id']) != id]
    existing_tasks.append(project_task)
    sorted_tasks = sorted(existing_tasks, key=lambda x: x['number'], reverse=True)
    project.project_tasks = sorted_tasks
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'update project task ({tracking_info["id"]} - {tracking_info["name"]})',
        created_time=timezone.now(),
        managed_data={
            'data': tracking_info
        },
    )
    tracking.save()
    
    if user_reporter:
        module='project_tasks'
        info=f'has updated task {project_task["name"]} in project {project.name}'
        info_id=project_task['id']
        type='update_project_task'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project task updated successfully',
        'data': project_task
    }, status=201)
    
    
#############################################
# ADD USERS ASSIGNEES TO PROJECT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def add_project_task_users_assignees(request, projectId, id): 
    
    data = request.data
    user_reporter = data.get('userReporter', None)
    users_assignees = data.get('usersAssignees', [])
    
    project = Project.objects(id=projectId).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    all_tasks = project.project_default_tasks if project.project_default_tasks else []
    
    project_task = next((task for task in all_tasks if str(task['project_default_task']['_id']) == id), None)
    if not project_task:
        return Response({'error': 'Project task not found'}, status=404)
    
    all_tasks = [task for task in all_tasks if str(task['project_default_task']['_id']) != id]
    
    project_task['users_assignees'] = users_assignees
    project_task['user_reporter'] = user_reporter
    project_task['last_modified_time'] = timezone.now()
    
    all_tasks.append(project_task)
    
    sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
    
    project.project_default_tasks = sorted_tasks
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'add project task users assignees',
        created_time=timezone.now(),
        managed_data={
            'data': project_task
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has added users assignees in project task {project_task["project_default_task"]["name"]} in project {project.name}'
        info_id=project.id
        type='add_project_default_task_users_assignees'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project task users assignees added successfully',
        'data': project_task
    }, status=201)
    
    
#############################################
# DELETE PROJECT TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_task(request, projectId, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        project_task = ProjectTask.objects(id=id).first()
        if not project_task:
            return Response({'error': 'Project task not found'}, status=404)
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        existing_tasks = project.project_tasks if project.project_tasks else []
        existing_tasks = [task for task in existing_tasks if str(task['_id']) != id]
        existing_tasks = sorted(existing_tasks, key=lambda x: x['created_time'], reverse=True)
        project.project_tasks = existing_tasks
        project.save()
        attachments = project_task.project_task_attachments if project_task.project_task_attachments else []
        ProjectTaskAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
        for attachment in attachments:
            delete_attachment_from_s3(attachment['file'])
        tracking_info = transform_data_to_mongo(project_task)
        project_task.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete project task',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has deleted task {project_task.name} in project {project.name}'
            info_id=project.id
            type='delete_project_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Project task deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE PROJECT TASK USER
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_task_user(request, projectId, id, userId):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        all_tasks = project.project_default_tasks if project.project_default_tasks else []
        
        project_task = next((task for task in all_tasks if str(task['project_default_task']['_id']) == id), None)
        if not project_task:
            return Response({'error': 'Project task not found'}, status=404)
        
        task_users_assignees = project_task['users_assignees'] if project_task['users_assignees'] else []
        
        tracking_info = next((user for user in task_users_assignees if str(user['id']) == userId), None)
        
        task_users_assignees = [user for user in task_users_assignees if str(user['id']) != userId]
        
        task_users_assignees = sorted(task_users_assignees, key=lambda x: x['created_time' if 'created_time' in x else 'username'], reverse=True)
        
        project_task['users_assignees'] = task_users_assignees
        project_task['user_reporter'] = user_reporter
        project_task['last_modified_time'] = timezone.now()
        
        all_tasks = [task for task in all_tasks if str(task['project_default_task']['_id']) != id]
        all_tasks.append(project_task)
        sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        project.project_tasks = sorted_tasks
        project.save()
        
        if tracking_info:
            tracking = ProjectTracking(
                user_reporter=user_reporter,
                action=f'delete project task user ({project_task["project_default_task"]["_id"]} - {project_task["project_default_task"]["name"]})',
                created_time=timezone.now(),
                managed_data={
                    'data': tracking_info
                },
            )
            tracking.save()
            
        if user_reporter:
            module='projects'
            info=f'has deleted user {tracking_info["username"]} from task {project_task["project_default_task"]["name"]} in project {project.name}'
            info_id=project.id
            type='delete_project_task_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Project task user deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CREATE DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_default_task(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = data.get('projectStage', {})
        has_attachments = None
        has_attachments_str = data.get('hasAttachments', 'false') if data.get('hasAttachments') else None
        if has_attachments_str:
            if not isinstance(has_attachments_str, bool):
                has_attachments = True if has_attachments_str.lower() == 'true' else False
            else:
                has_attachments = has_attachments_str
        project_stage_status = data.get('projectStageStatus', 'not started')
        project_stage = ProjectStage.objects(id=stage['id']).first()
        
        task = ProjectDefaultTask(
            name=name,
            order=order,
            description=description,
            project_stage=transform_data_to_mongo(project_stage),
            project_stage_status=project_stage_status,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            has_attachments=has_attachments if has_attachments is not None else False,
        )
        task.save()
        tasks_after_order = ProjectDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        task = ProjectDefaultTask.objects(id=task.id).first()
        
        projects = Project.objects.all()
        for project in projects:
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            project_default_tasks.append({
                'project_default_task': transform_data_to_mongo(task),
                'status': 'not started',
                'percentage': 0,
                'created_time': timezone.now(),
                'last_modified_time': timezone.now(),
                'users_assignees': [],
                'priority': 'medium',
                'project_task_attachments': [],
            })
            project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
            project.project_default_tasks = project_default_tasks
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            
            for default_task in project_default_tasks:
                new_task = ProjectDefaultTask.objects(id=default_task['project_default_task']['_id']).first()
                default_task['project_default_task'] = transform_data_to_mongo(new_task)
            project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
            project.project_default_tasks = project_default_tasks
                 
            project.save()
        
        tracking_info = transform_data_to_mongo(task)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create default task ({task.id} - {task.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_tasks'
            info=f'has created new default task {task.name}'
            info_id=task.id
            type='create_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default task created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_default_task(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = data.get('projectStage', {})
        has_attachments = None
        has_attachments_str = data.get('hasAttachments', 'false') if data.get('hasAttachments') else None
        if has_attachments_str:
            if not isinstance(has_attachments_str, bool):
                has_attachments = True if has_attachments_str.lower() == 'true' else False
            else:
                has_attachments = has_attachments_str
        project_stage_status = data.get('projectStageStatus', 'not started')
        project_stage = ProjectStage.objects(id=stage['id']).first()
        
        default_task = ProjectDefaultTask.objects(name=name).first()
        if default_task and str(default_task.id) != id:
            return Response({'error': 'Default task already exists'}, status=404)
        default_task = ProjectDefaultTask.objects(id=id).first()
        if not stage:
            return Response({'error': 'Default task not found'}, status=404)
        default_task.name = name
        default_task.description = description
        default_task.project_stage = transform_data_to_mongo(project_stage)
        default_task.project_stage_status = project_stage_status
        default_task.has_attachments = has_attachments if has_attachments is not None else default_task.has_attachments
        default_task.last_modified_time = timezone.now()
        default_task.save()
        
        tasks = ProjectDefaultTask.objects.all()
        fix_order_after_edit(tasks, default_task, order)
        
        default_task = ProjectDefaultTask.objects(id=default_task.id).first()
        
        projects = Project.objects.all()
        for project in projects:
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            task = next((task for task in project_default_tasks if str(task['project_default_task']['_id']) == id), None)
            project_default_tasks = [task for task in project_default_tasks if str(task['project_default_task']['_id']) != id]
            project_default_tasks.append({
                'project_default_task': transform_data_to_mongo(default_task),
                'status': task['status'] if task else 'not started',
                'percentage': task['percentage'] if task else 0,
                'created_time': task['created_time'] if task else timezone.now(),
                'last_modified_time': timezone.now(),
                'users_assignees': task['users_assignees'] if task else [],
                'priority': task['priority'] if task else 'medium',
                'project_task_attachments': task['project_task_attachments'] if task else [],
            })
            project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
            project.project_default_tasks = project_default_tasks
            
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            for task in project_default_tasks:
                new_task = ProjectDefaultTask.objects(id=task['project_default_task']['_id']).first()
                task['project_default_task'] = transform_data_to_mongo(new_task)
            project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
            project.project_default_tasks = project_default_tasks
            project.save()
        
        tracking_info = transform_data_to_mongo(default_task)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update default task ({default_task.id} - {default_task.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_tasks'
            info=f'has updated default task {default_task.name}'
            info_id=default_task.id
            type='update_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Stage updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE DEFAULT TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_task(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        default_task = ProjectDefaultTask.objects(id=id).first()
        if not default_task:
            return Response({'error': 'Default task not found'}, status=404)
        tracking_info = transform_data_to_mongo(default_task)
        default_task.delete()
        
        tasks_after_order = ProjectDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        projects = Project.objects.all()
        for project in projects:
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            project_default_tasks = [task for task in project_default_tasks if str(task['project_default_task']['_id']) != id]
            project.project_default_tasks = project_default_tasks
            project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete default task ({tracking_info['id']} - {tracking_info['name']})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_tasks'
            info=f'has deleted default task {default_task.name}'
            info_id=default_task.id
            type='delete_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default task deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE DEFAULT TASKS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_tasks(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        default_tasks = ProjectDefaultTask.objects(id__in=ids).all()
        if not default_tasks:
            return Response({'error': 'Default tasks not found'}, status=404)
        tracking_info = [transform_data_to_mongo(default_task) for default_task in default_tasks]
        ProjectDefaultTask.objects(id__in=ids).delete()
        
        tasks_after_order = ProjectDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        projects = Project.objects.all()
        for project in projects:
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            project_default_tasks = [task for task in project_default_tasks if str(task['project_default_task']['_id']) not in ids]
            project.project_default_tasks = project_default_tasks
            project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list default tasks',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_tasks'
            info=f'has deleted {len(ids)} default tasks'
            info_id='list'
            type='delete_default_tasks'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default tasks deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE STATUS PROJECT DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_status_project_default_task(request, projectId, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        status = data.get('status', 'not started')
        percentage = data.get('percentage', 0)
        
        all_tasks = project.project_default_tasks if project.project_default_tasks else []
        task = next((task for task in all_tasks if str(task['project_default_task']['_id']) == id), None)
        if not task:
            return Response({'error': 'Project task not found'}, status=404)
        task['status'] = status
        task['percentage'] = percentage
        task['user_reporter'] = user_reporter
        task['last_modified_time'] = timezone.now()
        
        tracking_task = task
        
        not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['project_default_task']['order'] > task['project_default_task']['order']]
        # not_started_tasks.append(task)
        if not project.has_permission:
            not_started_tasks = [t for t in not_started_tasks if t['project_default_task']['project_stage']['name'] != 'Permission']
            
        sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['project_default_task']['order'])
        
        def get_next_task(task, sorted_tasks):
            return next(
                (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
                None
            )
            # if has_permission:
            #     return next(
            #         (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
            #         None
            #     )
            # else:
            #     last_task = find_task_in_stage(sorted_tasks, 'Installation', position='last')
            #     print('last task name', last_task['project_default_task']['name'])
            #     print('task name', task['project_default_task']['name'])
            #     if str(last_task['project_default_task']['_id']) == str(task['project_default_task']['_id']):
            #         return find_task_in_stage(sorted_tasks, 'Closing')
            #     else:
            #         return next(
            #             (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
            #             None
            #         )
        
        if status == 'finished':
            next_task = get_next_task(task, sorted_tasks)
            print('next name', next_task)
            if next_task and next_task['status'] == 'not started':
                less_ordered_tasks = [t for t in all_tasks if t['project_default_task']['order'] < next_task['project_default_task']['order']]
                if not project.has_permission:
                    less_ordered_tasks = [t for t in less_ordered_tasks if t['project_default_task']['project_stage']['name'] != 'Permission']
                print('less ordered tasks', less_ordered_tasks)
                unfinished_tasks = [t for t in less_ordered_tasks if t['status'] != 'finished']
                print('unfinished tasks', unfinished_tasks)
                if not unfinished_tasks:
                    next_task['status'] = 'in progress'
                    next_task['percentage'] = 50
                    next_task['user_reporter'] = user_reporter
                    next_task['last_modified_time'] = timezone.now()
                    all_tasks = [t for t in all_tasks if str(t['project_default_task']['_id']) != str(next_task['project_default_task']['_id'])]
                    all_tasks.append(next_task)
        
        all_tasks = [task for task in all_tasks if str(task['project_default_task']['_id']) != id]
        all_tasks.append(task)
        sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        
        current_stage = get_current_stage_from_tasks(sorted_tasks)
        
        if not current_stage:
            current_stage = ProjectStage.objects(name='Finished').first()
        
        current_stage = ProjectStage.objects(name=current_stage['name']).first() 
        
        if current_stage:
            if current_stage.name == 'Permission' and not project.has_permission:
                order = current_stage.order + 1
                current_stage = ProjectStage.objects(order=order).first()
            
            if project.current_stage['name'] != current_stage.name:
                history = project.project_history if project.project_history else []
                current_stage = transform_data_to_mongo(current_stage)
                history.append({
                    'initial_stage': project.current_stage,
                    'final_stage': current_stage,
                    'created_time': timezone.now()
                })
                project.current_stage = current_stage 
                project.project_history = history
                
                tracking = ProjectTracking(
                    user_reporter=user_reporter,
                    action=f'change stage project ({project.id} - {project.name})',
                    created_time=timezone.now(),
                    managed_data={
                        'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_history'])
                    },
                )
                tracking.save()
        
        project.project_default_tasks = sorted_tasks
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'change status default task ({task["project_default_task"]["id"]} - {task["project_default_task"]["name"]}) in project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_task
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has changed status in task {task["project_default_task"]["name"]} in project {project.name}'
            info_id=project.id
            type='change_status_project_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Status in default task updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE PRIORITY PROJECT DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_priority_project_default_task(request, projectId, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        priority = data.get('priority', 'medium')
        
        all_tasks = project.project_default_tasks if project.project_default_tasks else []
        task = next((task for task in all_tasks if str(task['project_default_task']['_id']) == id), None)
        if not task:
            return Response({'error': 'Project task not found'}, status=404)
        task['priority'] = priority
        task['user_reporter'] = user_reporter
        task['last_modified_time'] = timezone.now()
        
        all_tasks = [task for task in all_tasks if str(task['project_default_task']['_id']) != id]
        all_tasks.append(task)
        sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        
        project.project_default_tasks = sorted_tasks
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'change priority default task ({task["project_default_task"]["id"]} - {task["project_default_task"]["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_default_tasks'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has changed priority in task {task["project_default_task"]["name"]} in project {project.name}'
            info_id=project.id
            type='change_priority_project_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Status in default task updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE INSTALLER PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_installer_project(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        project = Project.objects(id=id).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        installer = json.loads(data.get('installer', None))
        
        if installer:
            if installer.get('id') not in [user['id'] for user in project.users_assignees]:
                project.users_assignees.append(installer)
        
        all_tasks = project.project_default_tasks if project.project_default_tasks else []
        
        for task in all_tasks:
            if isinstance(task.get('project_default_task', {}).get('project_stage', {}), dict):
                if task.get('project_default_task', {}).get('project_stage', {}).get('name', '') == settings.INSTALLATION_STAGE:
                    name = task.get('project_default_task', {}).get('name', '').lower()
                    if settings.TASK_START_INSTALLATION.lower() in name or \
                        settings.TASK_FINISH_INSTALLATION.lower() in name or \
                        settings.TASK_COMPLETE_SATISFACTION_FORM.lower() in name:
                        if installer:
                            task['users_assignees'] = [installer]
                            task['user_reporter'] = user_reporter
                            task['last_modified_time'] = timezone.now()
                            
        for task in all_tasks:
            name = task.get('project_default_task', {}).get('name', '').lower()
            if settings.TASK_ASSIGN_INSTALLATION_CREW.lower() in name:
                if installer:
                    task['status'] = 'finished'
                    task['percentage'] = 100
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                    
                    not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['project_default_task']['order'] > task['project_default_task']['order']]
                    
                    if not project.has_permission:
                        not_started_tasks = [t for t in not_started_tasks if t['project_default_task']['project_stage']['name'] != 'Permission']
                        
                    sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['project_default_task']['order'])
                    
                    def get_next_task(task, sorted_tasks):
                        return next(
                            (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
                            None
                        )
                                
                    next_task = get_next_task(task, sorted_tasks)
                    
                    if next_task:
                        next_task['status'] = 'in progress'
                        next_task['percentage'] = 50
                        next_task['user_reporter'] = user_reporter
                        next_task['last_modified_time'] = timezone.now()
                        all_tasks = [t for t in all_tasks if str(t['project_default_task']['_id']) != str(next_task['project_default_task']['_id'])]
                        all_tasks.append(next_task)
                           
        sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        
        project.project_default_tasks = sorted_tasks
        project.user_installer = installer if installer else project.user_installer
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'change installer project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_default_tasks'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has changed installer in project {project.name}'
            info_id=project.id
            type='change_installer_project'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Installer updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# UPLOAD FILES TO PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_files_to_project(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    last_attachments = project.project_attachments if project.project_attachments else []
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    stage = json.loads(data.get('projectStage', None))
    if stage:
        project_stage = ProjectStage.objects(id=stage['id']).first()
        project_stage = transform_data_to_mongo(project_stage) if project_stage else None
    else:
        project_stage = project.current_stage if project.current_stage else None
    
    project_attachments = []
    files = request.FILES.getlist('projectAttachments')
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj)
        if key:
            attachment = ProjectAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload = user_reporter,
                current_stage = project_stage if project_stage else None,
            )
            attachment.save()
            project_attachments.append(transform_data_to_mongo(attachment))
            
    last_attachments.extend(project_attachments)
            
    last_attachments = sorted(last_attachments, key=lambda x: x['name'], reverse=True)
    
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    project.project_attachments = last_attachments if last_attachments else project.project_attachments
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'upload files to project ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_attachments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has uploaded file attachments to project {project.name}'
        info_id=project.id
        type='upload_files_to_project'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Uploaded files to project successfully',
        'data': json.loads(project.to_json())
    }, status=201)



#############################################
# UPLOAD FILES TO DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_files_to_default_task(request, projectId, id): 
    
    project = Project.objects(id=projectId).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    all_tasks = project.project_default_tasks if project.project_default_tasks else []
    task = next((task for task in all_tasks if str(task['project_default_task']['_id']) == id), None)
    if not task:
        return Response({'error': 'Project task not found'}, status=404)
    
    last_attachments = task['project_task_attachments'] if 'project_task_attachments' in task else []
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    project_tasks_attachments = []
    files = request.FILES.getlist('projectTaskAttachments')
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj, folder=settings.AWS_S3_FOLDER_TASKS)
        if key:
            attachment = ProjectTaskAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload = user_reporter,
                due_project_stage = project.current_stage if project.current_stage else None,
                project_task = task if task else None
            )
            attachment.save()
            project_tasks_attachments.append(transform_data_to_mongo(attachment))
            
    last_attachments.extend(project_tasks_attachments)
            
    last_attachments = sorted(last_attachments, key=lambda x: x['name'], reverse=True)
    
    task['last_modified_time'] = timezone.now()
    
    task['project_task_attachments'] = last_attachments if last_attachments else task['project_task_attachments']
    
    all_tasks = [task for task in all_tasks if str(task['project_default_task']['_id']) != id]
    all_tasks.append(task)
    sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
    
    project.project_default_tasks = sorted_tasks
    
    project.last_modified_time = timezone.now()
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'upload files to default task ({task['project_default_task']['_id']} - {task['project_default_task']['name']} in project {project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_default_tasks'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has uploaded file attachments to task {task["project_default_task"]["name"]} in project {project.name}'
        info_id=project.id
        type='upload_files_to_default_task'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Uploaded files to default task successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CREATE PROJECT COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_project_comment(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    last_comments = project.project_comments if project.project_comments else []
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    text_comment = data.get('comment', None)
    
    task_id = data.get('taskId', None)
    
    task = None
    
    if task_id:
        task = next((task for task in project.project_default_tasks if str(task['project_default_task']['_id']) == task_id), None)
        if not task:
            return Response({'error': 'Task not found'}, status=404)
    
    if not text_comment:
        return Response({'error': 'Comment is required'}, status=400)
    
    new_comment = ProjectTaskComment(
        comment=text_comment,
        created_time=timezone.now(),
        last_modified_time=timezone.now(),
        user_reporter=user_reporter,
        project=transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage']),
        project_default_task=task if task else None,
        project_default_task_comment_attachments=[]
    )
    
    new_comment.save()
    
    last_comments.append(transform_data_to_mongo(new_comment))
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    
    project.last_modified_time = timezone.now()
    project.project_comments = sorted_comments
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'create comment in project ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has created comment in project {project.name}'
        info_id=project.id
        type='create_project_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in project created successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# EDIT PROJECT COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_project_comment(request, id, projectId): 
    
    project = Project.objects(id=projectId).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    last_comments = project.project_comments if project.project_comments else []
    last_comments = [comment for comment in last_comments if str(comment['id']) != id]
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    text_comment = data.get('comment', None)
    
    task_id = data.get('taskId', None)
    
    task = None
    
    if task_id:
        task = next((task for task in project.project_default_tasks if str(task['project_default_task']['_id']) == task_id), None)
        if not task:
            return Response({'error': 'Task not found'}, status=404)
    
    if not text_comment:
        return Response({'error': 'Comment is required'}, status=400)
    
    existing_comment = ProjectTaskComment.objects(id=id).first()
    
    if existing_comment:
        existing_comment.comment = text_comment
        existing_comment.last_modified_time = timezone.now()
        existing_comment.user_reporter = user_reporter
        existing_comment.project = transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage'])
        existing_comment.project_default_task = task if task else None
        existing_comment.save()
    else:
        existing_comment = ProjectTaskComment(
            comment=text_comment,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            user_reporter=user_reporter,
            project=transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage']),
            project_default_task=task if task else None,
            project_default_task_comment_attachments=[]
        )
        existing_comment.save()
    
    last_comments.append(transform_data_to_mongo(existing_comment))
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    project.last_modified_time = timezone.now()
    project.project_comments = sorted_comments
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'edit comment ({existing_comment.id}) in project ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has updated comment in project {project.name}'
        info_id=project.id
        type='update_project_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in project edited successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# DELETE PROJECT COMMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_comment(request, id, projectId): 
    
    project = Project.objects(id=projectId).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    last_comments = project.project_comments if project.project_comments else []
    
    last_comments = [comment for comment in last_comments if str(comment['id']) != str(id)]
    last_comments = last_comments if last_comments else []
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    existing_comment = ProjectTaskComment.objects(id=id).first()
    
    if existing_comment:
        existing_comment.delete()
    
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    project.last_modified_time = timezone.now()
    project.project_comments = sorted_comments
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'delete comment in project ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has deleted comment in project {project.name}'
        info_id=project.id
        type='delete_project_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in project deleted successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CREATE DEFAULT GUIDE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_default_guide_product(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        price = data.get('price', 0)
        product = ProjectDefaultGuideProduct.objects(name=name).first()
        if product:
            return Response({'error': 'Default guide product already exists'}, status=404)
        product = ProjectDefaultGuideProduct.objects(order=order).first()
        if product:
            return Response({'error': 'Default guide product with this order already exists'}, status=404)
        product = ProjectDefaultGuideProduct(
            name=name,
            order=order,
            price=price,    
            description=description,
            created_time=timezone.now(),
            last_modified_time=timezone.now()
        )
        product.save()
        tracking_info = transform_data_to_mongo(product)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create default guide product ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='default_guide_products'
            info=f'has created new default guide product {product.name}'
            info_id=product.id
            type='create_default_guide_product'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Default guide product created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT DEFAULT GUIDE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_default_guide_product(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        price = data.get('price', 0)
        product = ProjectDefaultGuideProduct.objects(name=name).first()
        if product and str(product.id) != id:
            return Response({'error': 'Default guide product already exists'}, status=404)
        product = ProjectDefaultGuideProduct.objects(order=order).first()
        if product and str(product.id) != id:
            return Response({'error': 'Default guide product with this order already exists'}, status=404)
        product = ProjectDefaultGuideProduct.objects(id=id).first()
        if not product:
            return Response({'error': 'Stage not found'}, status=404)
        product.name = name
        product.price = price
        product.description = description
        product.order = order
        product.last_modified_time = timezone.now()
        product.save()
        tracking_info = transform_data_to_mongo(product)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update default guide product ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='default_guide_products'
            info=f'has updated default guide product {product.name}'
            info_id=product.id
            type='update_default_guide_product'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Default guide product updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE DEFAULT GUIDE PRODUCT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_guide_product(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        product = ProjectDefaultGuideProduct.objects(id=id).first()
        if not product:
            return Response({'error': 'Default guide product not found'}, status=404)
        tracking_info = transform_data_to_mongo(product)
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete default guide product ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_guide_products'
            info=f'has deleted default guide product {product.name}'
            info_id=product.id
            type='delete_default_guide_product'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        product.delete()
        
        return Response({'message': 'Default guide product deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE DEFAULT GUIDE PRODUCTS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_guide_products(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        products = ProjectDefaultGuideProduct.objects(id__in=ids).all()
        if not products:
            return Response({'error': 'Default guide products not found'}, status=404)
        tracking_info = [transform_data_to_mongo(p) for p in products]
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list default guide products',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_guide_products'
            info=f'has deleted {len(ids)} default guide products'
            info_id='list'
            type='delete_default_guide_products'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        ProjectDefaultGuideProduct.objects(id__in=ids).delete()
        
        return Response({'message': 'Default guide products deleted successfully'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# REMOVE ALL NOTIFICATIONS
#############################################

    
@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_old_notifications(request):
    now = timezone.now()
    days_ago = now - timezone.timedelta(days=7)
    ProjectNotificationUser.objects(updated_at__lt=days_ago).delete()
    ProjectNotification.objects(updated_at__lt=days_ago).delete()
    return Response({'message': '7 days old Notifications removed successfully'}, status=200)



#############################################
# DELETE NOTIFICATIONS
#############################################

    
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_notifications(request):
    data = request.data
    userReporter = data.get('userReporter', None)
    if not userReporter:
        return Response({'error': 'User not found'}, status=404)
    notification_ids = data.get('notificationIds', [])
    notifications = ProjectNotificationUser.objects(id__in=notification_ids).all()
    tracking_info = [transform_data_to_mongo(notification) for notification in notifications]
    notifications.delete()
    
    tracking = ProjectTracking(
        user_reporter=userReporter,
        action=f'delete notifications',
        created_time=timezone.now(),
        managed_data={
            'data': tracking_info
        },
    )
    tracking.save()
    
    return Response({'message': 'Notifications marked as read successfully'}, status=200)


#############################################
# MARK AS READ NOTIFICATIONS
#############################################

    
@api_view(['POST'])
@permission_classes([AllowAny])
def mark_as_read_notifications(request):
    data = request.data
    userReporter = data.get('userReporter', None)
    if not userReporter:
        return Response({'error': 'User not found'}, status=404)
    notification_ids = data.get('notificationIds', [])
    notifications = ProjectNotificationUser.objects(id__in=notification_ids).all()
    for notification in notifications:
        notification.read = True
        notification.save()
        
    tracking_info = [transform_data_to_mongo(notification) for notification in notifications]
    
    tracking = ProjectTracking(
        user_reporter=userReporter,
        action=f'mark as read notifications',
        created_time=timezone.now(),
        managed_data={
            'data': tracking_info
        },
    )
    tracking.save()
    
    return Response({'message': 'Notifications marked as read successfully'}, status=200)


#############################################
# DELETE OLD NOTIFICATIONS
#############################################

def delete_old_notifications():
    cutoff = timezone.now() - timezone.timedelta(days=7)
    notifications = ProjectNotification.objects(created_time__lt=cutoff).all()
    old_notification_ids = [str(notification.id) for notification in notifications]
    ProjectNotificationUser.objects(__raw__={'notification.id': {'$in': old_notification_ids}}).delete()
    notifications.delete()
    return True


#############################################
# DELETE OLD TRACKINGS
#############################################

def delete_old_trackings():
    trackings = ProjectTracking.objects(created_time__lt=timezone.now() - timezone.timedelta(days=30)).all()
    trackings.delete()
    return True


#############################################
# GENERATE DB BACKUP
#############################################

def generate_db_backup():
    try:
        backup_mongo_to_s3(
            logger, 
            settings.MONGO_URI, 
            settings.MONGO_DB, 
            settings.AWS_STORAGE_BUCKET_NAME, 
            settings.AWS_S3_FOLDER_BACKUPS
        )
        return True
    except Exception as e:
        return str(e)
    
    
#############################################
# DOWNLOAD MONGO DB
#############################################

# @api_view(['GET'])
# @permission_classes([AllowAny])
# def download_mongo_db(request):
#     mongo_uri = settings.MONGO_URI
#     db_name = settings.MONGO_DB
#     client = MongoClient(mongo_uri)
#     db = client[db_name]
    
#     zip_buffer = io.BytesIO()
    
#     with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
#         for info in db.list_collections():
#             name = info['name']
#             if name == 'system.views':
#                 continue
#             collection = db[name]
#             documents = list(collection.find())
#             plain_data = json.loads(json_util.dumps(documents))
#             # json_data = json.dumps(plain_data, indent=2)
#             json_data = json.dumps(plain_data)
#             zip_file.writestr(f"{name}.json", json_data)
    
#     zip_buffer.seek(0)
    
#     timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
#     response = HttpResponse(zip_buffer, content_type="application/zip")
#     response['Content-Disposition'] = f'attachment; filename="mongo_db_export_{timestamp}.zip"'
#     response['Access-Control-Expose-Headers'] = 'Content-Disposition'
#     return response


@api_view(['GET'])
@permission_classes([AllowAny])
def download_mongo_db(request):
    client = MongoClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]

    z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    
    for info in db.list_collections():
        name = info['name']
        if name == 'system.views':
            continue

        def gen_collection(coll_name):
            cursor = db[coll_name].find()
            yield b'['
            first = True
            for doc in cursor:
                if not first:
                    yield b','
                first = False
                yield json_util.dumps(doc).encode('utf-8')
            yield b']'
        
        z.write_iter(f'{name}.json', gen_collection(name))
    
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    response = StreamingHttpResponse(
        streaming_content=z, 
        content_type='application/zip'
    )
    response['Content-Disposition'] = f'attachment; filename="mongo_db_export_{timestamp}.zip"'
    response['Access-Control-Expose-Headers'] = 'Content-Disposition'
    return response


#############################################
# CHANGE DESCRIPTION ALL PROJECTS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_description_all_projects(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    list_tracking_info = []
    try:
        projects = Project.objects(id__in=ids).all()
        if not projects:
            return Response({'error': 'Projects not found'}, status=404)
        for project in projects:
            
            sales_order = project.sales_order if project.sales_order else None
            if not sales_order:
                return Response({'error': f'Sales order not found for project {project.name}'}, status=404)
            
            installation_description = sales_order.get('line_items', [])
            installation_description = [
                item.get('description') for item in installation_description if item.get('description') \
                and item.get('name').lower() == settings.PROJECT_ITEM_INSTALLATION_NAME.lower()
            ]
            structural_description = sales_order.get('line_items', [])
            structural_description = [
                item.get('description') for item in structural_description if item.get('description') \
                and item.get('name').lower() == settings.PROJECT_ITEM_STRUCTURAL_NAME.lower()
            ]
            all_description = f'Project for sales order {sales_order.get("salesorder_number")} & ' + '.'.join(installation_description) + ' & ' + '.'.join(structural_description)
            work_scope = '.'.join(installation_description) + ' & ' + '.'.join(structural_description)
            
            project.description = all_description
            project.work_scope = work_scope
            project.last_modified_time = timezone.now()
            project.user_reporter = user_reporter if user_reporter else project.user_reporter
            project.save()
            
            list_tracking_info.append(transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'description']))
            
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update description list projects',
            created_time=timezone.now(),
            managed_data={
                'data': list_tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='projects'
            info=f'has updated description in {len(ids)} projects'
            info_id='list'
            type='update_projects'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Projects updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


#############################################
# CHANGE STAFF ALL PROJECTS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_staff_all_projects(request): 
    data = request.data
    
    ids = data.get('ids', [])
    user_reporter = json.loads(data.get('userReporter', None))
    staffs = data.get('staff', [])
    staff_role = data.get('staffRole', 'installer')
    
    list_tracking_info = []
    
    permission = ProjectPermissions.objects(name='full access').first()
    if not permission:
        permission = ProjectPermissions(
            name='full access',
            description='Full access to project',
        )
        permission.save()
    permission = transform_data_to_mongo(permission)
    
    projects = Project.objects(id__in=ids).all()
    for project in projects:
        assignees = project.users_assignees if project.users_assignees else []
        new_assignees = [
            {**staff, 'project_permissions': [permission]}
            for staff in staffs
            if staff['id'] not in [user.get('id') for user in assignees]
        ]
        assignees.extend(new_assignees)
        project.users_assignees = assignees
        project.save()
        
        tasks = project.project_default_tasks if project.project_default_tasks else []
        not_started_tasks = [t for t in tasks if t['status'] == 'not started']
        
        for task in tasks:
            name = task.get('project_default_task', {}).get('name', '').lower()
            if staff_role == 'installer':
                if (settings.TASK_START_INSTALLATION.lower() in name or 
                    settings.TASK_FINISH_INSTALLATION.lower() in name or 
                    settings.TASK_COMPLETE_SATISFACTION_FORM.lower() in name):
                    task_assignees = task.get('users_assignees', [])
                    task_assignees.extend([staff for staff in staffs if staff['id'] not in [user.get('id') for user in task_assignees]])
                    task['users_assignees'] = task_assignees
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                if (settings.TASK_ASSIGN_INSTALLATION_CREW.lower() in name):
                    task['status'] = 'finished'
                    task['percentage'] = 100
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                    
                    not_started_tasks = [t for t in tasks if t['status'] == 'not started' and t['project_default_task']['order'] > task['project_default_task']['order']]
                    
                    if not project.has_permission:
                        not_started_tasks = [t for t in not_started_tasks if t['project_default_task']['project_stage']['name'] != 'Permission']
                        
                    sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['project_default_task']['order'])
                    
                    def get_next_task(task, sorted_tasks):
                        return next(
                            (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
                            None
                        )
                                
                    next_task = get_next_task(task, sorted_tasks)
                    
                    if next_task:
                        next_task['status'] = 'in progress'
                        next_task['percentage'] = 50
                        next_task['user_reporter'] = user_reporter
                        next_task['last_modified_time'] = timezone.now()
                        tasks = [t for t in tasks if str(t['project_default_task']['_id']) != str(next_task['project_default_task']['_id'])]
                        tasks.append(next_task)
                                
                    
            elif staff_role == 'warehouse staff':
                if (settings.TASK_ORDER_IS_READY_TO_PICK_UP.lower() in name or 
                    settings.TASK_PICK_UP_ORDER.lower() in name or 
                    settings.TASK_COMPLETE_SATISFACTION_FORM.lower() in name or 
                    settings.TASK_GENERATE_INSTALLATION_GUIDE.lower() in name):
                    
                    task_assignees = task.get('users_assignees', [])
                    task_assignees.extend([staff for staff in staffs if staff['id'] not in [user.get('id') for user in task_assignees]])
                    task['users_assignees'] = task_assignees
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                        
        project.project_default_tasks = tasks
        project.save()
        
        tracking_info = transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'users_assignees', 'project_default_tasks'])
        list_tracking_info.append(tracking_info)        
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'update list project with new {staff_role}',
        created_time=timezone.now(),
        managed_data={
            'data': list_tracking_info
        },
    )
    tracking.save()
    
    if user_reporter:
        module = 'projects'
        info = f'has updated {len(ids)} projects with new {staff_role}'
        info_id = 'list'
        type = 'update_list_project'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Projects updated successfully',
        'data': list_tracking_info
    }, status=201)
    
    
#############################################
# REMOVE DATE PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def remove_date_project(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    date_type = data.get('dateType', None)
    info = ''
    try:
        project = Project.objects(id=id).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        if not date_type:
            return Response({'error': 'Date type is required'}, status=400)
        if date_type in ['startDate']:
            info = 'start date'
            project.start_date = None
            project.end_date = None
        elif date_type in ['inspectionDate']:
            info = 'inspection date'
            project.inspection_date = None
        elif date_type in ['finishPermissionDate']:
            info = 'finish permission date'
            project.finish_permission_date = None
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'remove {info} in project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has removed {info} date in project {project.name}'
            info_id=project.id
            type='remove_install_date_project'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Date removed successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE DESCRIPTION PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_description_project(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        project = Project.objects(id=id).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        description = data.get('description', None)
        work_scope = data.get('description', None)
            
        project.description = description
        project.work_scope = work_scope
        project.last_modified_time = timezone.now()
        project.user_reporter = user_reporter if user_reporter else project.user_reporter
        project.save()
            
        tracking_info = transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'description'])
            
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'chnge description project ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='projects'
            info=f'has changed description in project {project.name}'
            info_id=project.id
            type='change_description_project'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Project updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# REMOVE PROJECT GUIDE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def remove_guide_product_project(request, projectId, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    default_product = json.loads(data.get('product', None))
    try:
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        guide_products = project.project_guide_products if project.project_guide_products else []
        
        if guide_products:
            product = next((product for product in guide_products if str(product['id']) == id), None)
            if product:
                product['deleted'] = True
                guide_products = [p for p in guide_products if str(p['id']) != id]
                guide_products.append(product)
            else:
                default_product['deleted'] = True
                guide_products.append(default_product)
            guide_products = sorted(guide_products, key=lambda x: x['id'], reverse=False)            
            
            project.project_guide_products = guide_products
            project.save()
                    
            tracking_info = transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'project_guide_products'])
                    
            tracking = ProjectTracking(
                user_reporter=user_reporter,
                action=f'remove project guide product ({tracking_info["id"]} - {tracking_info["name"]})',
                created_time=timezone.now(),
                managed_data={
                    'data': tracking_info
                },
            )
            tracking.save()
            if user_reporter:
                module='projects'
                info=f'has removed guide product in project {project.name}'
                info_id=project.id
                type='remove_guide_product_project'
                create_notification(module, info_id, info, type, user_reporter['username'])
            return Response({'message': 'Project updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# CREATE PROJECT REMAINDER
#############################################

def delete_old_reminders():
    cutoff = timezone.now() - timezone.timedelta(days=1)
    reminders = ProjectReminder.objects(date__lt=cutoff).all()
    for reminder in reminders:
        reminder.is_active = False
        reminder.save()
    return True


@api_view(['POST'])
@permission_classes([AllowAny])
def manage_project_reminder(request, projectId, taskId): 
    
    project = Project.objects(id=projectId).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    tasks = project.project_default_tasks if project.project_default_tasks else []
    task = next((task for task in tasks if str(task['project_default_task']['_id']) == taskId), None)
    if not task:
        return Response({'error': 'Task not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    notes = data.get('notes', None)
    
    date = data.get('date', None)
    
    reminder_id = data.get('reminderId', None)
    
    if reminder_id:
        reminder = ProjectReminder.objects(id=reminder_id).first()
        if not reminder:
            return Response({'error': 'Reminder not found'}, status=404)
        reminder.notes = notes
        reminder.date = date
        reminder.last_modified_time=timezone.now()
        
    else:
        reminder = ProjectReminder(
            notes=notes,
            date=date,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            user_reporter=user_reporter,
            project=transform_data_to_mongo(project, include_fields=['id', 'name', 'number']),
            project_default_task=task if task else None,
            is_active=True, 
        )
    
    reminder.save()
    
    action = 'update' if reminder_id else 'create'
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'{action} new reminder ({project.id} - {project.name} in task {task["project_default_task"]["name"]})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(reminder, include_fields=['id', 'notes', 'project_default_task', 'project', 'is_active', 'date'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has {action}d reminder in project {project.name} and task {task["project_default_task"]["name"]}'
        info_id=project.id
        type='{action}_project_reminder'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': f'Projet reminder {action}d successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# QUIT PROJECT REMAINDER
#############################################


@api_view(['POST'])
@permission_classes([AllowAny])
def quit_project_reminder(request, id): 
    
    reminder = ProjectReminder.objects(id=id).first()
    if not reminder:
        return Response({'error': 'Reminder not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    reminder.is_active = False
    reminder.last_modified_time = timezone.now()
    
    reminder.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'quit reminder in task {reminder.project_default_task["project_default_task"]["name"]}',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(reminder, include_fields=['id', 'notes', 'project_default_task', 'project', 'is_active', 'date'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has quit reminder in task {reminder.project_default_task["project_default_task"]["name"]}'
        info_id=reminder.id
        type='quit_project_reminder'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Projet reminder quited successfully',
        'data': json.loads(reminder.to_json())
    }, status=201)
    
    
#############################################
# DOWNLOAD ALL FILES IN PROJECT
#############################################


@api_view(['GET'])
@permission_classes([AllowAny])
def download_s3_archive(request):
    keys = request.GET.getlist("keys[]")
    number = request.GET.get("number")
    stage = request.GET.get("stage")
    task = request.GET.get("task")
    if not keys:
        return Response({"error": "No keys provided"}, status=400)
    stream, filename, content_type = make_s3_archive_stream(keys, number, stage, task)
    response = HttpResponse(stream.read(), content_type="application/zip")
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Access-Control-Expose-Headers'] = 'Content-Disposition'
    return response


#############################################
# CREATE DEFAULT MATERIAL
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_default_material(request):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        name = data.get('name')
        description = data.get('description')
        price = data.get('price', 0)
        quantity = data.get('quantity', 0)
        is_packaged = data.get('isPackaged', False)
        package_quantity = data.get('packageQuantity', 0)
        default_guide_products = json.loads(data.get('defaultGuideProducts', '[]'))
        material = ProjectDefaultMaterial.objects(name=name).first()
        if material:
            return Response({'error': 'Default material already exists'}, status=404)
        material = ProjectDefaultMaterial(
            name=name,
            price=price,    
            description=description,
            quantity=quantity,
            is_packaged=is_packaged,
            package_quantity=package_quantity,
            default_guide_products=default_guide_products,
            created_time=timezone.now(),
            last_modified_time=timezone.now()
        )
        material.save()
        tracking_info = transform_data_to_mongo(material)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create default material ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='default_materials'
            info=f'has created new default material {material.name}'
            info_id=material.id
            type='create_default_material'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Default material created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT DEFAULT MATERIAL
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_default_material(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        name = data.get('name')
        description = data.get('description')
        price = data.get('price', 0)
        quantity = data.get('quantity', 0)
        is_packaged = data.get('isPackaged', False)
        package_quantity = data.get('packageQuantity', 0)
        default_guide_products = json.loads(data.get('defaultGuideProducts', '[]'))
        
        material = ProjectDefaultMaterial.objects(name=name).first()
        
        if material and str(material.id) != id:
            return Response({'error': 'Default material already exists'}, status=404)
        
        material = ProjectDefaultMaterial.objects(id=id).first()
        if not material:
            return Response({'error': 'Material not found'}, status=404)
        material.name = name
        material.price = price
        material.description = description
        material.quantity = quantity
        material.is_packaged = is_packaged
        material.package_quantity = package_quantity
        material.default_guide_products = default_guide_products
        material.last_modified_time = timezone.now()
        material.save()
        tracking_info = transform_data_to_mongo(material)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update default material ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='default_materials'
            info=f'has updated default material {material.name}'
            info_id=material.id
            type='update_default_material'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Default material updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE DEFAULT MATERIAL
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_material(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        material = ProjectDefaultMaterial.objects(id=id).first()
        if not material:
            return Response({'error': 'Default material not found'}, status=404)
        tracking_info = transform_data_to_mongo(material)
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete default material ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_materials'
            info=f'has deleted default material {material.name}'
            info_id=material.id
            type='delete_default_material'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        material.delete()
        
        return Response({'message': 'Default material deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE DEFAULT MATERIAL
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_materials(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        materials = ProjectDefaultMaterial.objects(id__in=ids).all()
        if not materials:
            return Response({'error': 'Default materials not found'}, status=404)
        tracking_info = [transform_data_to_mongo(p) for p in materials]
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list default materials',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_materials'
            info=f'has deleted {len(ids)} default materials'
            info_id='list'
            type='delete_default_materials'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        ProjectDefaultMaterial.objects(id__in=ids).delete()
        
        return Response({'message': 'Default materials deleted successfully'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)