from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import (
    ProjectTaskStage,
    ProjectTracking,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

#############################################
# CREATE STAGE TASK
#############################################

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