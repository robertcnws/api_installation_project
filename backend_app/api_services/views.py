from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.http import HttpResponse
from api_projects.data_util import (
    transform_data_to_mongo,
    transform_dict_to_camelcase,
    create_notification,
    create_entity_number,
    fix_order,
    fix_order_after_edit,
    get_current_stage_from_tasks,
    to_aware,
)
from api_projects.s3_utils import (
    upload_attachment_to_s3, 
    generate_default_file_url,
    delete_attachment_from_s3,
    backup_mongo_to_s3,
    make_s3_archive_stream,
)
from api_projects.models import (
    ProjectTracking,
)
from api_authorization.models import (
    LoginUser,
)

from .models import (
    ServiceIssue,
    Service,
    ServiceStage,
    ServiceDefaultTask,
    ServiceAttachment,
    ServiceTaskComment,
)

from .utils import (
    updated_tasks,
)
import json

#############################################
# CREATE SERVICE ISSUE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_issue(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        service_issue = ServiceIssue.objects(name=name).first()
        if service_issue:
            return Response({'error': 'Service issue already exists'}, status=404)
        service_issue = ServiceIssue(
            name=name,
            description=description,
            user_reporter=user_reporter,
        )
        service_issue.save()
        tracking_info = transform_data_to_mongo(service_issue)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create service issue ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_issues'
            info=f'has created new service issue {service_issue.name}'
            info_id=service_issue.id
            type='create_service_issue'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT SERVICE ISSUE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_issue(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        service_issue = ServiceIssue.objects(name=name).first()
        if service_issue and str(service_issue.id) != id:
            return Response({'error': 'Service issue already exists'}, status=404)
        service_issue = ServiceIssue.objects(id=id).first()
        if not service_issue:
            return Response({'error': 'Service issue not found'}, status=404)
        service_issue.user_reporter = user_reporter
        service_issue.name = name
        service_issue.description = description
        service_issue.save()
        tracking_info = transform_data_to_mongo(service_issue)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update service_issue ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_issues'
            info=f'has updated service issue {service_issue.name}'
            info_id=service_issue.id
            type='update_service_issue'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE SERVICE ISSUE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_issue(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        service_issue = ServiceIssue.objects(id=id).first()
        if not service_issue:
            return Response({'error': 'Service issue not found'}, status=404)
        tracking_info = transform_data_to_mongo(service_issue)
        service_issue.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service issue ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_issues'
            info=f'has deleted service issue {service_issue.name}'
            info_id=service_issue.id
            type='delete_service_issue'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE SERVICE ISSUES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_issues(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        service_issues = ServiceIssue.objects(id__in=ids).all()
        if not service_issues:
            return Response({'error': 'Service issues not found'}, status=404)
        tracking_info = [transform_data_to_mongo(service_issue) for service_issue in service_issues]
        ServiceIssue.objects(id__in=ids).delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list service issues',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_issues'
            info=f'has deleted {len(ids)} service issues'
            info_id='list'
            type='delete_service_issues'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issues deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CREATE SERVICE STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_stage(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = ServiceStage.objects(name=name).first()
        if stage:
            return Response({'error': 'Stage already exists'}, status=404)
        stage = ServiceStage.objects(order=order).first()
        if stage:
            return Response({'error': 'Stage with this order already exists'}, status=404)
        stage = ServiceStage(
            name=name,
            order=order,
            description=description
        )
        stage.save()
        tracking_info = transform_data_to_mongo(stage)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create service stage ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_stages'
            info=f'has created new service stage {stage.name}'
            info_id=stage.id
            type='create_service_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT SERVICE STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_stage(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = ServiceStage.objects(name=name).first()
        if stage and str(stage.id) != id:
            return Response({'error': 'Stage already exists'}, status=404)
        stage = ServiceStage.objects(order=order).first()
        if stage and str(stage.id) != id:
            return Response({'error': 'Stage with this order already exists'}, status=404)
        stage = ServiceStage.objects(id=id).first()
        if not stage:
            return Response({'error': 'Stage not found'}, status=404)
        stage.name = name
        stage.description = description
        stage.order = order
        stage.save()
        tracking_info = transform_data_to_mongo(stage)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update service stage ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_stages'
            info=f'has updated service stage {stage.name}'
            info_id=stage.id
            type='update_service_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE SERVICE STAGE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_stage(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        stage = ServiceStage.objects(id=id).first()
        if not stage:
            return Response({'error': 'Stage not found'}, status=404)
        tracking_info = transform_data_to_mongo(stage)
        stage.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service stage ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_stages'
            info=f'has deleted service stage {stage.name}'
            info_id=stage.id
            type='delete_service_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE SERVICE STAGES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_stages(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        stages = ServiceStage.objects(id__in=ids).all()
        if not stages:
            return Response({'error': 'Stages not found'}, status=404)
        tracking_info = [transform_data_to_mongo(stage) for stage in stages]
        ServiceStage.objects(id__in=ids).delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list service stages',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_stages'
            info=f'has deleted {len(ids)} service stages'
            info_id='list'
            type='delete_service_stages'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stages deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CREATE SERVICE DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_default_task(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = data.get('serviceStage', {})
        has_attachments = None
        has_attachments_str = data.get('hasAttachments', 'false') if data.get('hasAttachments') else None
        if has_attachments_str:
            if not isinstance(has_attachments_str, bool):
                has_attachments = True if has_attachments_str.lower() == 'true' else False
            else:
                has_attachments = has_attachments_str
        service_stage_status = data.get('serviceStageStatus', 'not started')
        service_stage = ServiceStage.objects(id=stage['id']).first()
        
        task = ServiceDefaultTask(
            name=name,
            order=order,
            description=description,
            service_stage=transform_data_to_mongo(service_stage),
            service_stage_status=service_stage_status,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            has_attachments=has_attachments if has_attachments is not None else False,
        )
        task.save()
        tasks_after_order = ServiceDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        task = ServiceDefaultTask.objects(id=task.id).first()
        
        services = Service.objects.all()
        for service in services:
            service_default_tasks = service.service_default_tasks if service.service_default_tasks else []
            service_default_tasks.append({
                'service_default_task': transform_data_to_mongo(task),
                'status': 'not started',
                'percentage': 0,
                'created_time': timezone.now(),
                'last_modified_time': timezone.now(),
                'users_assignees': [],
                'priority': 'medium',
                'service_task_attachments': [],
            })
            service_default_tasks = sorted(service_default_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
            service.service_default_tasks = service_default_tasks
            service_default_tasks = service.service_default_tasks if service.service_default_tasks else []
            
            for default_task in service_default_tasks:
                new_task = ServiceDefaultTask.objects(id=default_task['service_default_task']['_id']).first()
                default_task['service_default_task'] = transform_data_to_mongo(new_task)
            service_default_tasks = sorted(service_default_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
            service.service_default_tasks = service_default_tasks
                 
            service.save()
        
        tracking_info = transform_data_to_mongo(task)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create service default task ({task.id} - {task.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='service_default_tasks'
            info=f'has created new service default task {task.name}'
            info_id=task.id
            type='create_service_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default task created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT SERVICE DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_default_task(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = data.get('serviceStage', {})
        has_attachments = None
        has_attachments_str = data.get('hasAttachments', 'false') if data.get('hasAttachments') else None
        if has_attachments_str:
            if not isinstance(has_attachments_str, bool):
                has_attachments = True if has_attachments_str.lower() == 'true' else False
            else:
                has_attachments = has_attachments_str
        service_stage_status = data.get('serviceStageStatus', 'not started')
        service_stage = ServiceStage.objects(id=stage['id']).first()
        
        default_task = ServiceDefaultTask.objects(name=name).first()
        if default_task and str(default_task.id) != id:
            return Response({'error': 'Default task already exists'}, status=404)
        default_task = ServiceDefaultTask.objects(id=id).first()
        if not stage:
            return Response({'error': 'Default task not found'}, status=404)
        default_task.name = name
        default_task.description = description
        default_task.service_stage = transform_data_to_mongo(service_stage)
        default_task.service_stage_status = service_stage_status
        default_task.has_attachments = has_attachments if has_attachments is not None else default_task.has_attachments
        default_task.last_modified_time = timezone.now()
        default_task.save()
        
        tasks = ServiceDefaultTask.objects.all()
        fix_order_after_edit(tasks, default_task, order)
        
        default_task = ServiceDefaultTask.objects(id=default_task.id).first()
        
        services = Service.objects.all()
        for service in services:
            service_default_tasks = service.service_default_tasks if service.service_default_tasks else []
            task = next((task for task in service_default_tasks if str(task['service_default_task']['_id']) == id), None)
            service_default_tasks = [task for task in service_default_tasks if str(task['service_default_task']['_id']) != id]
            service_default_tasks.append({
                'service_default_task': transform_data_to_mongo(default_task),
                'status': task['status'] if task else 'not started',
                'percentage': task['percentage'] if task else 0,
                'created_time': task['created_time'] if task else timezone.now(),
                'last_modified_time': timezone.now(),
                'users_assignees': task['users_assignees'] if task else [],
                'priority': task['priority'] if task else 'medium',
                'service_task_attachments': task['service_task_attachments'] if task else [],
            })
            service_default_tasks = sorted(service_default_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
            service.service_default_tasks = service_default_tasks
            
            service_default_tasks = service.service_default_tasks if service.service_default_tasks else []
            for task in service_default_tasks:
                new_task = ServiceDefaultTask.objects(id=task['service_default_task']['_id']).first()
                task['service_default_task'] = transform_data_to_mongo(new_task)
            service_default_tasks = sorted(service_default_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
            service.service_default_tasks = service_default_tasks
            service.save()
        
        tracking_info = transform_data_to_mongo(default_task)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update service default task ({default_task.id} - {default_task.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='service_default_tasks'
            info=f'has updated service default task {default_task.name}'
            info_id=default_task.id
            type='update_service_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Stage updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE SERVICE DEFAULT TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_default_task(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        default_task = ServiceDefaultTask.objects(id=id).first()
        if not default_task:
            return Response({'error': 'Service default task not found'}, status=404)
        tracking_info = transform_data_to_mongo(default_task)
        default_task.delete()
        
        tasks_after_order = ServiceDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        services = Service.objects.all()
        for service in services:
            service_default_tasks = service.service_default_tasks if service.service_default_tasks else []
            service_default_tasks = [task for task in service_default_tasks if str(task['service_default_task']['_id']) != id]
            service.service_default_tasks = service_default_tasks
            service.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service default task ({tracking_info['id']} - {tracking_info['name']})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='service_default_tasks'
            info=f'has deleted service default task {default_task.name}'
            info_id=default_task.id
            type='delete_service_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default task deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE SERVICE DEFAULT TASKS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_default_tasks(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        default_tasks = ServiceDefaultTask.objects(id__in=ids).all()
        if not default_tasks:
            return Response({'error': 'Default tasks not found'}, status=404)
        tracking_info = [transform_data_to_mongo(default_task) for default_task in default_tasks]
        ServiceDefaultTask.objects(id__in=ids).delete()
        
        tasks_after_order = ServiceDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        services = Service.objects.all()
        for service in services:
            service_default_tasks = service.service_default_tasks if service.service_default_tasks else []
            service_default_tasks = [task for task in service_default_tasks if str(task['service_default_task']['_id']) not in ids]
            service.service_default_tasks = service_default_tasks
            service.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list service default tasks',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='service_default_tasks'
            info=f'has deleted {len(ids)} service default tasks'
            info_id='list'
            type='delete_service_default_tasks'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default tasks deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CREATE SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def create_service(request):
    files = request.FILES.getlist('serviceAttachments')
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    role = user_reporter.get('user_role', None) if user_reporter else None
    responsible = None
    
    if role and role.get('name') == 'superadmin':
        responsible = LoginUser.objects(user_role__name='administrator').first()
        responsible = transform_data_to_mongo(responsible)
    elif role and role.get('name') == 'administrator':
        responsible = transform_dict_to_camelcase(user_reporter)
    
    if responsible:
        responsible['name'] = f'{responsible["firstName"]} {responsible["lastName"]}'
    
    try:
        issued_products = json.loads(data.get('issuedProducts', []))
        sales_order = json.loads(data.get('salesOrder', None))
        service_type = data.get('serviceType', None)
        service_notes = data.get('notes', None)
        service_place = json.loads(data.get('servicePlace', None))
        has_to_pay_str = data.get('hasToPay', 'false')
        has_to_pay = True if has_to_pay_str.lower() == 'true' else False
        by_factory_str = data.get('byFactory', 'false')
        by_factory = True if by_factory_str.lower() == 'true' else False
        address = data.get('address', None)
        stage_history = None
        users_assignees = []
        start_date = None
        end_date = None
        # current_stage = None
        service_history = []
        user_manager = responsible
        service_comments = []
        service_default_tasks = []
        users_service_team = []
        client = None
        
        last_version = Service.objects(sales_order__salesorder_id=sales_order['salesorder_id']).order_by('-version').first()
        version = last_version.version + 1 if last_version else 1
        
        number = create_entity_number(sales_order.get('salesorder_number'), prefix='SR')
        
        name = f'{number} ({sales_order.get("customer_name")})'
        
        current_stage = ServiceStage.objects(name='Preparation').first()
    
        current_stage = transform_data_to_mongo(current_stage)
        
        default_tasks = ServiceDefaultTask.objects.all().order_by('order')
        
        def active_conditions (default_task):
            return default_task.order >= 3 and default_task.service_stage.get('name', '').lower() != 'closing'
        
        for default_task in default_tasks:
            service_default_task = transform_data_to_mongo(default_task)
            service_default_task['is_active'] = not active_conditions(default_task)
            info = {
                'service_default_task': service_default_task,
                'status': 'not started',
                'percentage': 0,
                'created_time': timezone.now(),
                'last_modified_time': timezone.now(),
                'users_assignees': [user_manager] if user_manager else [],
                'user_reporter': user_reporter,
                'priority': 'medium',
                'service_task_attachments': [],
                'is_active': not active_conditions(default_task),
            }
            service_default_tasks.append(info)
            
        for default_task in service_default_tasks:
            if default_task['service_default_task']['order'] == 3:
                default_task['service_default_task']['is_active'] = has_to_pay
            if default_task['service_default_task']['order'] == 5:
                default_task['service_default_task']['is_active'] = by_factory
            if default_task['service_default_task']['order'] == 6:
                default_task['service_default_task']['is_active'] = not by_factory
            if default_task['service_default_task']['order'] == 7:
                default_task['service_default_task']['is_active'] = not by_factory
            
        service_attachments = []
        
        for file_obj in files:
            key = upload_attachment_to_s3(file_obj, settings.AWS_S3_FOLDER_SERVICES)
            if key:
                # Ejemplo: url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{key}"
                attachment = ServiceAttachment(
                    name=file_obj.name,
                    file=key,
                    created_time=timezone.now(),
                    last_modified_time=timezone.now(),
                    user_upload = user_reporter,
                    attachment_type = file_obj.attachment_type if hasattr(file_obj, 'attachment_type') else 'issued',
                )
                attachment.save()
                service_attachments.append(transform_data_to_mongo(attachment))
                
        service_attachments = sorted(service_attachments, key=lambda x: x['name'], reverse=True)
        
        
        service = Service(
            number=create_entity_number(sales_order.get('salesorder_number'), prefix='SR'),
            name=name,
            version=version,
            client=client,
            sales_order=sales_order,
            issued_products=issued_products,
            user_reporter=user_reporter,
            stage_history=stage_history,
            users_assignees=users_assignees,
            start_date=start_date,
            end_date=end_date,
            current_stage=current_stage,
            service_attachments=service_attachments,
            service_history=service_history,
            address=address,
            user_manager=user_manager,
            service_comments=service_comments,
            service_default_tasks=service_default_tasks,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            users_service_team=users_service_team,
            service_type=service_type,
            created_by=user_reporter,
            service_notes=service_notes,
            service_place=service_place,
            has_to_pay=has_to_pay,
            by_factory=by_factory,
        )
        
        service.save()
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.save()
        
        all_tasks = service.service_default_tasks if service.service_default_tasks else []
        
        if len(service.service_attachments) > 0:
            
            target_task = settings.TASK_SERVICE_UPLOAD_ISSUES.lower()
            
            files_task = None
                                    
            for task in all_tasks:
                name = task.get('service_default_task', {}).get('name', '').lower()
                if target_task in name:
                    files_task = task
                    break
            
            if files_task:
                files_task['status'] = 'finished'
                files_task['percentage'] = 100
                files_task['user_reporter'] = user_reporter
                files_task['last_modified_time'] = timezone.now()
                all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(files_task['service_default_task']['_id'])]
                all_tasks.append(files_task)
                    
                         
                    # next_task = get_next_task(task, sorted_tasks)
                            
                    # if next_task:
                    #     next_task['status'] = 'in progress'
                    #     next_task['percentage'] = 50
                    #     next_task['user_reporter'] = user_reporter
                    #     next_task['last_modified_time'] = timezone.now()
                    #     all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                    #     all_tasks.append(next_task)
                                
            sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                
            service.service_default_tasks = sorted_tasks
        
            service.save()
        
        tracking_info = transform_data_to_mongo(service)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has created new service {service.name}'
            info_id=service.id
            type='create_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# UPDATE SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_service(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
    
    start_date = data.get('startDate', None)
    end_date = data.get('endDate', None)
    notes = data.get('notes', None)
    name = data.get('name', data.get('title', None))
    
    try:
        start_date = start_date if start_date else None
        end_date = end_date if end_date else None
        name = name if name else None
        notes = notes if notes else None
        
        service.start_date = start_date
        service.end_date = end_date
        service.service_notes = notes
        service.name = name
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'start_date', 'end_date', 'notes'])
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has updated service {service.name}'
            info_id=service.id
            type='update_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE SERVICE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        attachments = service.service_attachments if service.service_attachments else []
        ServiceAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
        for attachment in attachments:
            delete_attachment_from_s3(attachment['file'])
        tracking_info = transform_data_to_mongo(service)
        service.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has deleted service {service.name}'
            info_id=service.id
            type='delete_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE SERVICES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_services(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        services = Service.objects(id__in=ids).all()
        if not services:
            return Response({'error': 'Services not found'}, status=404)
        for service in services:
            attachments = service.service_attachments if service.service_attachments else []
            ServiceAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
            for attachment in attachments:
                delete_attachment_from_s3(attachment['file'])
        tracking_info = [transform_data_to_mongo(service) for service in services]
        Service.objects(id__in=ids).delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list service',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has deleted {len(ids)} services'
            info_id='list'
            type='delete_services'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Services deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# ADD NEW ISSUE SERVICE
#############################################

    
@api_view(['POST'])
@permission_classes([AllowAny])
def add_new_issue_service(request, id, issued_product_id):
    data = request.data   
    user_reporter = json.loads(data.get('userReporter', None))
    quantity = data.get('quantity', 0)
    notes = data.get('notes', None)
    issue_service = json.loads(data.get('issueService', None))
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        issued_products = service.issued_products if service.issued_products else []
        
        issued_product = next((product for product in issued_products if str(product.get('line_item_id')) == issued_product_id), None)
        if not issued_product:
            return Response({'error': 'Issued product not found'}, status=404)
        
        if issue_service.get('id') in [issue.get('issue').get('id') for issue in issued_product.get('issues', [])]:
            return Response({'error': 'Issue already exists'}, status=404)
        
        issues = issued_product.get('issues', [])
        
        max_id = max([int(issue.get('id')) for issue in issues]) if issues else 0
        
        issues.append({
            'issue': issue_service,
            'quantity': quantity,
            'created_time': timezone.now(),
            'last_modified_time': timezone.now(),
            'notes': notes,
            'color': 'default',
            'id': int(max_id) + 1,
        })
        
        issued_product['issues'] = issues
        issued_products = [product for product in issued_products if str(product.get('line_item_id')) != issued_product_id]
        issued_products.append(issued_product)
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.issued_products = issued_products
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'issued_products'])
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'add new issue to service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has added new issue to service {service.name}'
            info_id=service.id
            type='add_new_issue_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue added successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE ISSUE SERVICE
#############################################

    
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_issue_service(request, id, issued_product_id, issue_id):
    data = request.data   
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        issued_products = service.issued_products if service.issued_products else []
        
        issued_product = next((product for product in issued_products if str(product.get('line_item_id')) == issued_product_id), None)
        if not issued_product:
            return Response({'error': 'Issued product not found'}, status=404)
        
        issues = issued_product.get('issues', [])
        
        issues = [issue for issue in issues if str(issue.get('id')) != issue_id]
        
        issued_product['issues'] = issues
        issued_products = [product for product in issued_products if str(product.get('line_item_id')) != issued_product_id]
        
        if len(issues) > 0:
            issued_products.append(issued_product)
            
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.issued_products = issued_products
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'issued_products'])
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete issue to service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has deleted issue to service {service.name}'
            info_id=service.id
            type='delete_issue_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# EDIT ISSUE SERVICE
#############################################

    
@api_view(['POST'])
@permission_classes([AllowAny])
def edit_issue_service(request, id, issued_product_id, issue_id):
    data = request.data   
    user_reporter = json.loads(data.get('userReporter', None))
    quantity = data.get('quantity', 0)
    notes = data.get('notes', None)
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        issued_products = service.issued_products if service.issued_products else []
        
        issued_product = next((product for product in issued_products if str(product.get('line_item_id')) == issued_product_id), None)
        if not issued_product:
            return Response({'error': 'Issued product not found'}, status=404)
        
        issues = issued_product.get('issues', [])
        
        issue = next((issue for issue in issues if str(issue.get('id')) == issue_id), None)
        if not issue:
            return Response({'error': 'Issue not found'}, status=404)
        
        issue['quantity'] = quantity
        issue['notes'] = notes
        issue['last_modified_time'] = timezone.now()
        
        issues = [issue for issue in issues if str(issue.get('id')) != issue_id]
        issues.append(issue)
        issues = sorted(issues, key=lambda x: x['id'], reverse=False)
        
        issued_product['issues'] = issues
        issued_products = [product for product in issued_products if str(product.get('line_item_id')) != issued_product_id]
        issued_products.append(issued_product)
        
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.issued_products = issued_products
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'issued_products'])
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update issue to service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has updated issue to service {service.name}'
            info_id=service.id
            type='update_issue_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)   
    
    
#############################################
# CHANGE PHONE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_phone_number(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    
    if service.sales_order.get('customer', None):
        current_phone_number = service.sales_order.get('customer', None).get('phone', '') or service.sales_order.get('customer', None).get('mobile', '')
    else:
        current_phone_number = ''

    phone_number = data.get('phoneNumber', current_phone_number) if data.get('phoneNumber') else current_phone_number
    
    sales_order = service.sales_order
    
    if service.sales_order.get('customer', None):
        sales_order['customer']['phone'] = phone_number
        sales_order['customer']['mobile'] = phone_number
    else:
        sales_order['customer'] = {
            'phone': phone_number,
            'mobile': phone_number,
        }
        
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.phone = phone_number if phone_number else ''
    service.sales_order = sales_order
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service phone number ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed phone number in service {service.name}'
        info_id=service.id
        type='change_service_phone_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201) 
    
    
#############################################
# CHANGE REFERENCE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_reference_number(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    ref_number = data.get('refNumber', '')
        
    sales_order = service.sales_order if service.sales_order else {}
    sales_order['reference_number'] = ref_number
    
    service.sales_order = sales_order
    service.reference_number = ref_number if ref_number else '000000'
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service reference number ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed reference number in service {service.name}'
        info_id=service.id
        type='change_service_reference_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE ADDRESS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_address(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    
    service.address = data.get('address', service.address) if data.get('address') else service.address
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service address ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'address'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed address in service {service.name}'
        info_id=service.id
        type='change_service_address'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE MANAGER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_manager(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    user_manager = json.loads(data.get('userManager', None))
    
    if not user_manager:
        return Response({'error': 'User manager not found'}, status=404)
    
    service.user_manager = user_manager if user_manager else service.user_manager
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service user manager ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'user_manager'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed user manager in service {service.name}'
        info_id=service.id
        type='change_service_user_manager'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE SERVICE TEAM
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_team(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    user_service_team = json.loads(data.get('userServiceTeam', None))
    
    if not user_service_team:
        return Response({'error': 'Service Team not found'}, status=404)
    
    users_service_team = [user_service_team]
    
    service.users_service_team = users_service_team if users_service_team else service.users_service_team
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    all_tasks = service.service_default_tasks if service.service_default_tasks else []
        
    for task in all_tasks:
            if isinstance(task.get('service_default_task', {}).get('service_stage', {}), dict):
                if task.get('service_default_task', {}).get('service_stage', {}).get('name', '') == settings.SERVICE_REPAIR_STAGE:
                    name = task.get('service_default_task', {}).get('name', '').lower()
                    if settings.TASK_SERVICE_UPLOAD_REPAIR.lower() in name:
                        if users_service_team:
                            task['users_assignees'] = users_service_team
                            task['user_reporter'] = user_reporter
                            task['last_modified_time'] = timezone.now()
                            
    for task in all_tasks:
            name = task.get('service_default_task', {}).get('name', '').lower()
            if settings.TASK_SERVICE_ASSIGN_CREW.lower() in name:
                if users_service_team:
                    task['status'] = 'finished'
                    task['percentage'] = 100
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                    
                    # not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['service_default_task']['order'] > task['service_default_task']['order']]
                    
                    # sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
                    
                    # def get_next_task(task, sorted_tasks):
                    #     return next(
                    #         (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                    #         None
                    #     )
                                
                    # next_task = get_next_task(task, sorted_tasks)
                    
                    # if next_task:
                    #     next_task['status'] = 'in progress'
                    #     next_task['percentage'] = 50
                    #     next_task['user_reporter'] = user_reporter
                    #     next_task['last_modified_time'] = timezone.now()
                    #     all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                    #     all_tasks.append(next_task)
                           
    sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
        
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service users team ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'users_service_team'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed users team in service {service.name}'
        info_id=service.id
        type='change_service_users_team'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE DATES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_dates(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    
    include_fields = ['id', 'name', 'version']
    
    if data.get('startDate', None):
        start_date = data.get('startDate', None)
        include_fields.append('start_date')
    
    if data.get('endDate', None):
        end_date = data.get('endDate', None)
        include_fields.append('end_date')
    
    is_part_days_str = data.get('isPartDays', '')
    if is_part_days_str:
        is_part_days = True if is_part_days_str.lower() == 'true' else False
        if data.get('isPartDays') and is_part_days != service.is_part_days:
            include_fields.append('is_part_days')
    
    service.start_date = start_date if start_date else service.start_date
    service.end_date = end_date if end_date else service.end_date
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    service.is_part_days = is_part_days if is_part_days_str else service.is_part_days
    
    if start_date:
        all_tasks = service.service_default_tasks if service.service_default_tasks else []
                                
        for task in all_tasks:
                name = task.get('service_default_task', {}).get('name', '').lower()
                if settings.TASK_SERVICE_SCHEDULE_DATE.lower() in name:
                        task['status'] = 'finished'
                        task['percentage'] = 100
                        task['user_reporter'] = user_reporter
                        task['last_modified_time'] = timezone.now()
                        
                        # not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['service_default_task']['order'] > task['service_default_task']['order']]
                        
                        # sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
                        
                        # def get_next_task(task, sorted_tasks):
                        #     return next(
                        #         (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                        #         None
                        #     )
                                    
                        # next_task = get_next_task(task, sorted_tasks)
                        
                        # if next_task:
                        #     next_task['status'] = 'in progress'
                        #     next_task['percentage'] = 50
                        #     next_task['user_reporter'] = user_reporter
                        #     next_task['last_modified_time'] = timezone.now()
                        #     all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                        #     all_tasks.append(next_task)
                            
        sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
            
        service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service dates ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=include_fields)
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed dates in service {service.name}'
        info_id=service.id
        type='change_service_dates'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# ADD ISSUED PRODUCT TO SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def add_issued_products(request, id):
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        data = request.data
        user_reporter = data.get('userReporter', None)
        has_to_pay = data.get('hasToPay')
        by_factory = data.get('byFactory')
        address = data.get('address')
        service_place = data.get('servicePlace')
        notes = data.get('serviceNotes')
        
        new_issued_products = data.get('issuedProducts', [])
        
        issued_products = service.issued_products if service.issued_products else []
        issued_product_ids = [product.get('line_item_id') for product in issued_products]
        
        for new_issued_product in new_issued_products:
            if new_issued_product.get('line_item_id') not in issued_product_ids:
                issued_products.append(new_issued_product)
        
        service.issued_products = issued_products if issued_products else service.issued_products
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.has_to_pay = has_to_pay if has_to_pay is not None else service.has_to_pay
        service.by_factory = by_factory if by_factory is not None else service.by_factory
        service.address = address if address and len(address) > 0 else service.address
        service.service_place = service_place if service_place is not None else service.service_place
        service.service_notes = notes if notes and len(notes) > 0 else service.service_notes
        
        
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'issued_products', 'has_to_pay', 'by_factory', 'address', 'service_place'])
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'add issued products to service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has added issued products to service {service.name}'
            info_id=service.id
            type='add_service_issued_products'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# SET SERVICE PLACE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def set_service_place(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    service_place = json.loads(data.get('servicePlace', None))
    
    if not service_place:
        return Response({'error': 'Service Place not found'}, status=404)
    
    service.service_place = service_place if service_place else service.service_place
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'set service place ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'service_place'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has set service place in service {service.name}'
        info_id=service.id
        type='set_service_place'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE SERVICE TYPE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_type(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    service_type = data.get('serviceType', None)
    
    if not service_type:
        return Response({'error': 'Service type not found'}, status=404)
    
    service.service_type = service_type if service_type else service.service_type
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service type ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'service_type'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed type in service {service.name}'
        info_id=service.id
        type='change_service_type'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)


#############################################
# CHANGE STATUS SERVICE DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_status_service_default_task(request, serviceId, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        service = Service.objects(id=serviceId).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        status = data.get('status', 'not started')
        percentage = data.get('percentage', 0)
        
        all_tasks = service.service_default_tasks if service.service_default_tasks else []
        task = next((task for task in all_tasks if str(task['service_default_task']['_id']) == id), None)
        if not task:
            return Response({'error': 'Service task not found'}, status=404)
        task['status'] = status
        task['percentage'] = percentage
        task['user_reporter'] = user_reporter
        task['last_modified_time'] = timezone.now()
        
        tracking_task = task
        
        not_started_tasks = [
            t for t in all_tasks if \
            t['status'] == 'not started' and \
            t['service_default_task']['is_active'] == True and \
            t['service_default_task']['order'] > task['service_default_task']['order']
        ]
        
        sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
        
        def get_next_task(task, sorted_tasks):
            return next(
                (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                None
            )
        
        if status == 'finished':
            next_task = get_next_task(task, sorted_tasks)
            
            if next_task and next_task['status'] == 'not started':
                less_ordered_tasks = [t for t in all_tasks if t['service_default_task']['order'] < next_task['service_default_task']['order']]
                unfinished_tasks = [t for t in less_ordered_tasks if t['status'] != 'finished']
                if not unfinished_tasks:
                    next_task['status'] = 'in progress'
                    next_task['percentage'] = 50
                    next_task['user_reporter'] = user_reporter
                    next_task['last_modified_time'] = timezone.now()
                    all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                    all_tasks.append(next_task)
        
        all_tasks = [task for task in all_tasks if str(task['service_default_task']['_id']) != id]
        all_tasks.append(task)
        sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
        
        current_stage = get_current_stage_from_tasks(sorted_tasks, module='service')
        
        if not current_stage:
            current_stage = ServiceStage.objects(name='Finished').first()
        
        current_stage = ServiceStage.objects(name=current_stage['name']).first() 
        
        if current_stage:
            
            if service.current_stage['name'] != current_stage.name:
                history = service.service_history if service.service_history else []
                current_stage = transform_data_to_mongo(current_stage)
                history.append({
                    'initial_stage': service.current_stage,
                    'final_stage': current_stage,
                    'created_time': timezone.now()
                })
                service.current_stage = current_stage 
                service.service_history = history
                
                tracking = ProjectTracking(
                    user_reporter=user_reporter,
                    action=f'change stage service ({service.id} - {service.name})',
                    created_time=timezone.now(),
                    managed_data={
                        'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'current_stage', 'service_history'])
                    },
                )
                tracking.save()
        
        service.service_default_tasks = sorted_tasks
        service.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'change status default task ({task["service_default_task"]["id"]} - {task["service_default_task"]["name"]}) in service ({service.id} - {service.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_task
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has changed status in task {task["service_default_task"]["name"]} in service {service.name}'
            info_id=service.id
            type='change_status_service_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Status in default task updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE SERVICE NOTES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_notes(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    service_notes = data.get('serviceNotes', None)
    
    if not service_notes:
        return Response({'error': 'Service notes not found'}, status=404)
    
    service.service_notes = service_notes if service_notes else service.service_notes
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service notes ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'service_notes'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed notes in service {service.name}'
        info_id=service.id
        type='change_service_notes'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# DELETE SERVICE FILE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_file(request, id, folder, file):
    data = request.data
    user_reporter = data.get('userReporter', None)
    attachment_type = data.get('attachmentType', None)
    try: 
        obj = Service.objects(id=id).first()
        attachments = obj.service_attachments if obj.service_attachments else []
        attachments = [attachment for attachment in attachments if attachment['file'] !=  folder + '/' + file]
        attachments = sorted(attachments, key=lambda x: to_aware(x['created_time']), reverse=True)
        obj.service_attachments = attachments
        
        if len(obj.service_attachments) == 0:
        
            all_tasks = obj.service_default_tasks if obj.service_default_tasks else []
            
            target_task = settings.TASK_SERVICE_UPLOAD_ISSUES.lower() if attachment_type == 'issued' else settings.TASK_SERVICE_UPLOAD_REPAIR.lower()
                                    
            for task in all_tasks:
                name = task.get('service_default_task', {}).get('name', '').lower()
                if target_task in name:
                    task['status'] = 'not started'
                    task['percentage'] = 0
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                                
            sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                
            obj.service_default_tasks = sorted_tasks
        
        obj.save()
        
        attachment = ServiceAttachment.objects(file=folder + '/' + file).first()
        attachment.service = transform_data_to_mongo(obj, include_fields=['id', 'name', 'number'])
        if not attachment:
            return Response({'error': 'Attachment not found'}, status=404)
        delete_attachment_from_s3(attachment.file)
        tracking_info = transform_data_to_mongo(attachment)
        attachment.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service ({obj.id} - {obj.name}) file attachment',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has deleted file attachment in service {obj.name}'
            info_id=obj.id
            type='delete_service_file'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Service file deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# UPLOAD FILES TO SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_files_to_service(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
    
    last_attachments = service.service_attachments if service.service_attachments else []
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    attachment_type = data.get('attachmentType', None)
    
    service_attachments = []
    files = request.FILES.getlist('serviceAttachments')
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj, settings.AWS_S3_FOLDER_SERVICES)
        if key:
            attachment = ServiceAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload=user_reporter,
                attachment_type=attachment_type if attachment_type else 'file',
            )
            attachment.save()
            service_attachments.append(transform_data_to_mongo(attachment))
            
    last_attachments.extend(service_attachments)
            
    last_attachments = sorted(last_attachments, key=lambda x: x['name'], reverse=True)
    
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    service.service_attachments = last_attachments if last_attachments else service.service_attachments
    
    if len(service.service_attachments) > 0:
        
        all_tasks = service.service_default_tasks if service.service_default_tasks else []
            
        target_task = settings.TASK_SERVICE_UPLOAD_ISSUES.lower() if attachment_type == 'issued' else settings.TASK_SERVICE_UPLOAD_REPAIR.lower()
            
        files_task = None
                                    
        for task in all_tasks:
            name = task.get('service_default_task', {}).get('name', '').lower()
            if target_task in name:
                files_task = task
                break
            
        if files_task:
            files_task['status'] = 'finished'
            files_task['percentage'] = 100
            files_task['user_reporter'] = user_reporter
            files_task['last_modified_time'] = timezone.now()
            all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(files_task['service_default_task']['_id'])]
            all_tasks.append(files_task)
                            
            not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['service_default_task']['order'] > files_task['service_default_task']['order']]
                            
            sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
                            
            def get_next_task(task, sorted_tasks):
                return next(
                    (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                    None
                )
                                        
            next_task = get_next_task(task, sorted_tasks)
                            
            if next_task:
                next_task['status'] = 'in progress'
                next_task['percentage'] = 50
                next_task['user_reporter'] = user_reporter
                next_task['last_modified_time'] = timezone.now()
                all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                all_tasks.append(next_task)
                                
        sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                
        service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'upload files to service ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'service_attachments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has uploaded file attachments to service {service.name}'
        info_id=service.id
        type='upload_files_to_service'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Uploaded files to service successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
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
# CREATE SERVICE COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_comment(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Project not found'}, status=404)
    
    last_comments = service.service_comments if service.service_comments else []
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    text_comment = data.get('comment', None)
    
    task_id = data.get('taskId', None)
    
    task = None
    
    if task_id:
        task = next((task for task in service.service_default_tasks if str(task['service_default_task']['_id']) == task_id), None)
        if not task:
            return Response({'error': 'Task not found'}, status=404)
    
    if not text_comment:
        return Response({'error': 'Comment is required'}, status=400)
    
    new_comment = ServiceTaskComment(
        comment=text_comment,
        created_time=timezone.now(),
        last_modified_time=timezone.now(),
        user_reporter=user_reporter,
        service=transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'current_stage']),
        service_default_task=task if task else None,
        service_default_task_comment_attachments=[]
    )
    
    new_comment.save()
    
    last_comments.append(transform_data_to_mongo(new_comment))
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    
    service.last_modified_time = timezone.now()
    service.service_comments = sorted_comments
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'create comment in service ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'current_stage', 'service_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has created comment in service {service.name}'
        info_id=service.id
        type='create_service_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in service created successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# EDIT SERVICE COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_comment(request, id, serviceId): 
    
    service = Service.objects(id=serviceId).first()
    if not service:
        return Response({'error': 'Project not found'}, status=404)
    
    last_comments = service.service_comments if service.service_comments else []
    last_comments = [comment for comment in last_comments if str(comment['id']) != id]
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    text_comment = data.get('comment', None)
    
    task_id = data.get('taskId', None)
    
    task = None
    
    if task_id:
        task = next((task for task in service.service_default_tasks if str(task['service_default_task']['_id']) == task_id), None)
        if not task:
            return Response({'error': 'Task not found'}, status=404)
    
    if not text_comment:
        return Response({'error': 'Comment is required'}, status=400)
    
    existing_comment = ServiceTaskComment.objects(id=id).first()
    
    if existing_comment:
        existing_comment.comment = text_comment
        existing_comment.last_modified_time = timezone.now()
        existing_comment.user_reporter = user_reporter
        existing_comment.service = transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'current_stage'])
        existing_comment.service_default_task = task if task else None
        existing_comment.save()
    else:
        existing_comment = ServiceTaskComment(
            comment=text_comment,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            user_reporter=user_reporter,
            service=transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'current_stage']),
            service_default_task=task if task else None,
            service_default_task_comment_attachments=[]
        )
        existing_comment.save()
    
    last_comments.append(transform_data_to_mongo(existing_comment))
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    service.last_modified_time = timezone.now()
    service.service_comments = sorted_comments
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'edit comment ({existing_comment.id}) in service ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'current_stage', 'service_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has updated comment in service {service.name}'
        info_id=service.id
        type='update_service_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in service edited successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# DELETE SERVICE COMMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_comment(request, id, serviceId): 
    
    service = Service.objects(id=serviceId).first()
    if not service:
        return Response({'error': 'Project not found'}, status=404)
    
    last_comments = service.service_comments if service.service_comments else []
    
    last_comments = [comment for comment in last_comments if str(comment['id']) != str(id)]
    last_comments = last_comments if last_comments else []
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    existing_comment = ServiceTaskComment.objects(id=id).first()
    
    if existing_comment:
        existing_comment.delete()
    
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    service.last_modified_time = timezone.now()
    service.service_comments = sorted_comments
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'delete comment in service ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'current_stage', 'service_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has deleted comment in service {service.name}'
        info_id=service.id
        type='delete_service_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in service deleted successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    

#############################################
# CHANGE SERVICE PROPERTIES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_properties(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    has_to_pay_str = data.get('hasToPay', 'false')
    if 'hasToPay' in data:
        if isinstance(has_to_pay_str, bool):
            has_to_pay = has_to_pay_str
        else:
            has_to_pay = True if has_to_pay_str.lower() == 'true' else False
    
    paid_str = data.get('paid', 'false')
    if 'paid' in data:
        if isinstance(paid_str, bool):
            paid = paid_str
        else:
            paid = True if paid_str.lower() == 'true' else False
        
    by_factory_str = data.get('byFactory', 'false')
    if 'byFactory' in data:
        if isinstance(by_factory_str, bool):
            by_factory = by_factory_str
        else:
            by_factory = True if by_factory_str.lower() == 'true' else False
        
    repired_str = data.get('repaired', 'false')
    if 'repaired' in data:
        if isinstance(repired_str, bool):
            repaired = repired_str
        else:
            repaired = True if repired_str.lower() == 'true' else False
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    include_fields = ['id', 'name']
    properties = []
    tasks = service.service_default_tasks if service.service_default_tasks else []
    task_3 = next((task for task in tasks if task['service_default_task']['order'] == 3), None)
    task_4 = next((task for task in tasks if task['service_default_task']['order'] == 4), None)
    task_5 = next((task for task in tasks if task['service_default_task']['order'] == 5), None)
    task_6 = next((task for task in tasks if task['service_default_task']['order'] == 6), None)
    task_7 = next((task for task in tasks if task['service_default_task']['order'] == 7), None)
    
    after_tasks = [
        t for t in tasks if t['service_default_task']['order'] > task_5['service_default_task']['order'] and\
        (t['service_default_task']['service_stage']['name'].lower() == 'repair' or\
        t['service_default_task']['service_stage']['name'].lower() == 'preparation')
    ]
    final_after_tasks = after_tasks if after_tasks else []
    if len(service.users_service_team) > 0:
        final_after_tasks = [task for task in final_after_tasks if str(task['service_default_task']['_id']) != str(task_7['service_default_task']['_id'])]
    if service.start_date:
        final_after_tasks = [task for task in final_after_tasks if str(task['service_default_task']['_id']) != str(task_6['service_default_task']['_id'])]
        
    closing_tasks = [task for task in tasks if task['service_default_task']['service_stage']['name'].lower() == 'closing']
    first_closing_task = min(closing_tasks, key=lambda x: x['service_default_task']['order']) if closing_tasks else None    
    
    if 'hasToPay' in data:
        task_3['user_reporter'] = user_reporter
        task_3['last_modified_time'] = timezone.now()
        service.has_to_pay = has_to_pay
        include_fields.append('has_to_pay')
        properties.append('has to pay')
        if not has_to_pay:
            service.paid = False
            include_fields.append('paid')
            properties.append('paid')
            if task_3:
                task_3['service_default_task']['is_active'] = False
                task_3['status'] = 'not started'
                task_3['percentage'] = 0
        elif task_3:
            task_3['service_default_task']['is_active'] = True
            task_3['status'] = 'in progress'
            task_3['percentage'] = 50
        tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_3['service_default_task']['_id'])]
        tasks.append(task_3) 
        
    if 'paid' in data:
        task_3['user_reporter'] = user_reporter
        task_3['last_modified_time'] = timezone.now()
        service.paid = paid
        include_fields.append('paid')
        properties.append('paid')
        if not paid:
            if task_3:
                task_3['status'] = 'in progress'
                task_3['percentage'] = 50
        elif task_3:
            task_3['status'] = 'finished'
            task_3['percentage'] = 100
        tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_3['service_default_task']['_id'])]
        tasks.append(task_3) 
        
    if 'byFactory' in data:
        task_5['user_reporter'] = user_reporter
        task_5['last_modified_time'] = timezone.now()
        service.by_factory = by_factory
        include_fields.append('by_factory')
        properties.append('by factory')
        
        if not by_factory:
            service.repaired = False
            include_fields.append('repaired')
            properties.append('repaired')
            
            if task_4:
                task_4['service_default_task']['is_active'] = True
                for task in final_after_tasks:
                    task['status'] = 'not started'
                    task['percentage'] = 0
                    task['service_default_task']['is_active'] = True
                if task_3['status'] == 'finished':
                    task_4['status'] = 'in progress'
                    task_4['percentage'] = 50
                tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_4['service_default_task']['_id'])]
                tasks.append(task_4) 
                tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in final_after_tasks]]
                tasks.extend(final_after_tasks)
            
            if task_5:
                task_5['status'] = 'not started'
                task_5['percentage'] = 0
                task_5['service_default_task']['is_active'] = False
                if closing_tasks:
                    for task in closing_tasks:
                        task['status'] = 'not started'
                        task['percentage'] = 0
                    tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in closing_tasks]]
                    tasks.extend(closing_tasks)
                
        elif task_5:
            task_5['status'] = 'in progress'
            task_5['percentage'] = 50
            task_5['service_default_task']['is_active'] = True
            task_4['service_default_task']['is_active'] = False
            task_4['status'] = 'not started'
            task_4['percentage'] = 0
            for task in final_after_tasks:
                task['status'] = 'not started'
                task['percentage'] = 0
                task['service_default_task']['is_active'] = False
            tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_4['service_default_task']['_id'])]
            tasks.append(task_4) 
            tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in final_after_tasks]]
            tasks.extend(final_after_tasks)
            tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_5['service_default_task']['_id'])]
            tasks.append(task_5) 
        
    if 'repaired' in data:
        task_5['user_reporter'] = user_reporter
        task_5['last_modified_time'] = timezone.now()
        service.repaired = repaired
        include_fields.append('repaired')
        properties.append('repaired')
        
        if not repaired:
            if task_5:
                task_5['status'] = 'in progress'
                task_5['percentage'] = 50
                if final_after_tasks:
                    for task in final_after_tasks:
                        task['status'] = 'not started'
                        task['percentage'] = 0
                        task['service_default_task']['is_active'] = False
                    tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in final_after_tasks]]
                    tasks.extend(final_after_tasks)
                if closing_tasks:
                    for task in closing_tasks:
                        task['status'] = 'not started'
                        task['percentage'] = 0
                    tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in closing_tasks]]
                    tasks.extend(closing_tasks)
                    
        elif task_5:
            task_4['status'] = 'finished'
            task_4['percentage'] = 100
            for task in final_after_tasks:
                task['status'] = 'not started'
                task['percentage'] = 0
                task['service_default_task']['is_active'] = False
            tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in final_after_tasks]]
            tasks.extend(final_after_tasks)
            if first_closing_task:
                first_closing_task['status'] = 'in progress'
                first_closing_task['percentage'] = 50
                tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(first_closing_task['service_default_task']['_id'])]
                tasks.append(first_closing_task)
                
    sorted_tasks = sorted(tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service properties ({service.id} - {service.name}) - {", ".join(properties)}',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=include_fields)
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed service properties {service.name} ({", ".join(properties)})'
        info_id=service.id
        type='change_service_properties'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# REMOVE DATE SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def remove_date_service(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    date_type = data.get('dateType', None)
    info = ''
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        if not date_type:
            return Response({'error': 'Date type is required'}, status=400)
        if date_type in ['startDate']:
            info = 'start date'
            service.start_date = None
            service.end_date = None
            
            all_tasks = service.service_default_tasks if service.service_default_tasks else []
            
            date_task = next((task for task in all_tasks if 'date' in task['service_default_task']['name'].lower()), None)
            
            if date_task:
                date_task['status'] = 'not started'
                date_task['percentage'] = 0
                date_task['user_reporter'] = user_reporter
                date_task['last_modified_time'] = timezone.now()
                all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(date_task['service_default_task']['_id'])]
                all_tasks.append(date_task)
                sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                service.service_default_tasks = sorted_tasks
                
        service.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'remove {info} in service ({service.id} - {service.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has removed {info} date in service {service.name}'
            info_id=service.id
            type='remove_install_date_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Date removed successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CLOSE SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def close_service(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    isClosed = data.get('isClosed', None)
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        service.is_closed = isClosed
                
        service.save()
        
        action = 'close' if isClosed else 'reopen'
        verbose_name = 'closed' if isClosed else 'reopened'
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'{action} service ({service.id} - {service.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'is_closed'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has {verbose_name} service {service.name}'
            info_id=service.id
            type='{action}_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': f'Service {verbose_name} successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DOWNLOAD ALL FILES IN SERVICE
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
    response = HttpResponse(stream.read(), content_type=content_type)
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
