from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import (
    Project, 
    ProjectTracking,
    ProjectReminder,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# CREATE OR UPDATE PROJECT REMINDER
#############################################

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
# DELETE OLD REMINDER
#############################################

def delete_old_reminders():
    cutoff = timezone.now() - timezone.timedelta(days=1)
    reminders = ProjectReminder.objects(date__lt=cutoff).all()
    for reminder in reminders:
        reminder.is_active = False
        reminder.save()
    return True