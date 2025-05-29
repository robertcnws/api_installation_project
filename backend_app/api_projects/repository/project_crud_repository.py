from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from api_authorization.models import LoginUser
from api_users.models import UserRole
from api_projects.models import (
    Project, 
    ProjectAttachment, 
    ProjectPermissions, 
    ProjectStage,
    ProjectTask,
    ProjectTaskAttachment,
    ProjectTracking,
    ProjectDefaultTask,
)
from api_projects.s3_utils import (
    upload_attachment_to_s3, 
    generate_default_file_url,
    delete_attachment_from_s3,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    parse_custom_date,
    create_notification,
    create_entity_number,
    to_aware,
    transform_dict_to_camelcase,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    
    
#############################################
# DELETE PROJECT FILE
#############################################

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
# CREATE PROJECT
#############################################

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
# ADD USERS ASSIGNEES TO PROJECT
#############################################

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

def get_default_file_url(request):
    object_key = request.query_params.get('key')
    if not object_key:
        return Response({'error': 'A key was not sended'}, status=400)
    try:
        url = generate_default_file_url(object_key)
        return Response({'url': url})
    except Exception as e:
        return Response({'error': str(e)}, status=500)