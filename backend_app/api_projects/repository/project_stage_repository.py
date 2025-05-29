from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import (
    Project, 
    ProjectStage,
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
# CREATE STAGE
#############################################

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