from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
    to_aware,
)
from api_projects.models import (
    ProjectTracking,
)

from api_services.models import (
    Service,
    ServiceTaskComment,
)

import json


#############################################
# CREATE SERVICE COMMENT
#############################################

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