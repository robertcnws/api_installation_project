from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from api_projects.models import (
    Project, 
    ProjectAttachment, 
    ProjectPermissions, 
    ProjectStage,
    ProjectTracking,
)
from api_projects.s3_utils import (
    upload_attachment_to_s3, 
    make_s3_archive_stream,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
from django.http import HttpResponse
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    

#############################################
# MANAGE PROJECT WORK ORDER
#############################################

def manage_project_work_order(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    name = data.get('name', None)
    description = data.get('description', None)
    start_date = data.get('startDate', None)
    duration = data.get('duration', None)
    project_stage = json.loads(data.get('projectStage', None)) if data.get('projectStage') else None
    user_assignee = json.loads(data.get('userAssignee', None)) if data.get('userAssignee') else None
    work_type = json.loads(data.get('workType', None)) if data.get('workType') else None
    items = json.loads(data.get('items', None)) if data.get('items') else None
    work_order_id = data.get('workOrderId', None)
    action = 'create' if not work_order_id else 'update'
    
    existing_work_orders = project.work_orders if project.work_orders else []
    work_order = next((wo for wo in existing_work_orders if str(wo.get('id', None)) == work_order_id), None)
    if not work_order:
        if not work_order_id:
            work_order_id = str(timezone.now().timestamp()).replace('.', '')
        existing_work_orders.append({
            'id': work_order_id,
            'name': name,
            'description': description,
            'start_date': start_date,
            'duration': int(duration) if duration is not None else None,
            'project_stage': project_stage,
            'user_assignee': user_assignee,
            'work_type': work_type,
            'items': items,
            'created_time': timezone.now(),
            'last_modified_time': timezone.now(),
            'is_finished': False,
            'end_date': None,
        })
    else:
        work_order['name'] = name if name is not None else work_order.get('name')
        work_order['description'] = description if description is not None else work_order.get('description')
        work_order['start_date'] = start_date if start_date is not None else work_order.get('start_date')
        work_order['duration'] = int(duration) if duration is not None else work_order.get('duration')
        work_order['project_stage'] = project_stage if project_stage is not None else work_order.get('project_stage')
        work_order['user_assignee'] = user_assignee if user_assignee is not None else work_order.get('user_assignee')
        work_order['work_type'] = work_type if work_type is not None else work_order.get('work_type')
        work_order['items'] = items if items is not None else work_order.get('items')
        work_order['last_modified_time'] = timezone.now()
        if data.get('isFinished', None) is not None:
                work_order['is_finished'] = data.get('isFinished')
                if data.get('isFinished'):
                    work_order['end_date'] = timezone.now()
                else:
                    work_order['end_date'] = None
                    work_order['is_finished'] = False
                work_order['last_modified_time'] = timezone.now()
            
        existing_work_orders = [wo for wo in existing_work_orders if str(wo.get('id')) != work_order_id]
        existing_work_orders.append(work_order)
    
    project.work_orders = existing_work_orders

    project.save()
    
    include_fields = ['id', 'name', 'work_orders']
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'{action} project work order ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=include_fields)
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has {action}d project work order {project.name}'
        info_id=project.id
        type=f'{action}_project_work_order'
        create_notification(module, info_id, info, type, user_reporter['username'])
            
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
def delete_project_work_order(request, project_id, id):
    project = Project.objects(id=project_id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    existing_work_orders = project.work_orders if project.work_orders else []
    work_order = next((wo for wo in existing_work_orders if str(wo.get('id', None)) == id), None)
    if not work_order:
        return Response({'error': 'Work order not found'}, status=404)
    
    existing_work_orders = [wo for wo in existing_work_orders if str(wo.get('id')) != id]
    project.work_orders = existing_work_orders
    project.save()
    
    include_fields = ['id', 'name', 'work_orders']
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'delete project work order ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=include_fields)
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has deleted work order {work_order.get("name", "")} from project {project.name}'
        info_id=project.id
        type='delete_project_work_order'
        create_notification(module, info_id, info, type, user_reporter['username'])
            
    return Response({
        'message': 'Work order deleted successfully',
        'data': json.loads(project.to_json())
    }, status=200)
    
    
def finish_project_work_order(request, project_id, id):
    project = Project.objects(id=project_id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    existing_work_orders = project.work_orders if project.work_orders else []
    work_order = next((wo for wo in existing_work_orders if str(wo.get('id', None)) == id), None)
    if not work_order:
        return Response({'error': 'Work order not found'}, status=404)
    
    existing_work_orders = [wo for wo in existing_work_orders if str(wo.get('id')) != id]
    work_order['is_finished'] = not work_order.get('is_finished', False)
    work_order['end_date'] = timezone.now()
    existing_work_orders.append(work_order)
    project.work_orders = existing_work_orders
    project.save()
    
    include_fields = ['id', 'name', 'work_orders']
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'set finish project work order ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=include_fields)
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has finished work order {work_order.get("name", "")} from project {project.name}'
        info_id=project.id
        type='finish_project_work_order'
        create_notification(module, info_id, info, type, user_reporter['username'])
            
    return Response({
        'message': 'Work order finished successfully',
        'data': json.loads(project.to_json())
    }, status=200)