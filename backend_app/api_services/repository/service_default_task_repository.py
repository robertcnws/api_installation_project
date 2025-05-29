from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
    fix_order,
    fix_order_after_edit,
)
from api_projects.models import (
    ProjectTracking,
)

from api_services.models import (
    Service,
    ServiceStage,
    ServiceDefaultTask,
)



#############################################
# CREATE SERVICE DEFAULT TASK
#############################################

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