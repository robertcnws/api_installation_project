from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from api_projects.models import (
    Project, 
    ProjectTask,
    ProjectTaskAttachment,
    ProjectTracking,
)
from api_projects.s3_utils import (
    upload_attachment_to_s3, 
    delete_attachment_from_s3,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    parse_custom_date,
    create_notification,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


def create_task_number():
    last_task = ProjectTask.objects().order_by('-created_time').first()
    if not last_task:
        return 'T-00001'
    last_number = int(last_task.number.split('-')[1])
    return f'T-{str(last_number + 1).zfill(5)}'


#############################################
# CREATE PROJECT TASK
#############################################

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