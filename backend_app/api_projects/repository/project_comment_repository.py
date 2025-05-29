from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import (
    Project, 
    ProjectTracking,
    ProjectTaskComment,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
    to_aware,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    
    
#############################################
# CREATE PROJECT COMMENT
#############################################

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