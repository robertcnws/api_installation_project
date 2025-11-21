from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from api_projects.models import (
    Project, 
    ProjectStage,
    ProjectTaskAttachment,
    ProjectTracking,
    ProjectDefaultTask,
)
from api_projects.s3_utils import (
    upload_attachment_to_s3, 
    delete_attachment_from_s3,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
    fix_order,
    fix_order_after_edit,
    get_current_stage_from_tasks,
    to_aware,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# DELETE PROJECT DEFAULT TASK FILE
#############################################

def delete_default_task_file(request, projectId, id, folder, file):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try: 
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        tasks = project.project_default_tasks if project.project_default_tasks else []
        task = next((task for task in tasks if str(task['project_default_task']['_id']) == id), None)
        tasks = [task for task in tasks if str(task['project_default_task']['_id']) != id]
        attachments = task['project_task_attachments'] if task['project_task_attachments'] else []
        attachments = [attachment for attachment in attachments if attachment['file'] != folder + '/' + file]
        attachments = sorted(attachments, key=lambda x: to_aware(x['created_time']), reverse=True)
        task['project_task_attachments'] = attachments
        tasks.append(task)
        project.project_default_tasks = tasks
        project.save()
        attachment = ProjectTaskAttachment.objects(file=folder + '/' + file).first()
        attachment.project = transform_data_to_mongo(project, include_fields=['id', 'name', 'number'])
        if not attachment:
            return Response({'error': 'Attachment not found'}, status=404)
        delete_attachment_from_s3(attachment.file)
        tracking_info = transform_data_to_mongo(attachment)
        attachment.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete default task ({task['project_default_task']['id']} - {task['project_default_task']['name']}) file attachment in project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has deleted file attachment from task {task['project_default_task']['name']} in project {project.name}'
            info_id=project.id
            type='delete_task_file'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Project file deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CREATE DEFAULT TASK
#############################################

def create_default_task(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = data.get('projectStage', {})
        has_attachments = None
        has_attachments_str = data.get('hasAttachments', 'false') if data.get('hasAttachments') else None
        if has_attachments_str:
            if not isinstance(has_attachments_str, bool):
                has_attachments = True if has_attachments_str.lower() == 'true' else False
            else:
                has_attachments = has_attachments_str
        project_stage_status = data.get('projectStageStatus', 'not started')
        project_stage = ProjectStage.objects(id=stage['id']).first()
        
        task = ProjectDefaultTask(
            name=name,
            order=order,
            description=description,
            project_stage=transform_data_to_mongo(project_stage),
            project_stage_status=project_stage_status,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            has_attachments=has_attachments if has_attachments is not None else False,
        )
        task.save()
        tasks_after_order = ProjectDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        task = ProjectDefaultTask.objects(id=task.id).first()
        
        projects = Project.objects.all()
        for project in projects:
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            project_default_tasks.append({
                'project_default_task': transform_data_to_mongo(task),
                'status': 'not started',
                'percentage': 0,
                'created_time': timezone.now(),
                'last_modified_time': timezone.now(),
                'users_assignees': [],
                'priority': 'medium',
                'project_task_attachments': [],
            })
            project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
            project.project_default_tasks = project_default_tasks
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            
            for default_task in project_default_tasks:
                new_task = ProjectDefaultTask.objects(id=default_task['project_default_task']['_id']).first()
                default_task['project_default_task'] = transform_data_to_mongo(new_task)
            project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
            project.project_default_tasks = project_default_tasks
                 
            project.save()
        
        tracking_info = transform_data_to_mongo(task)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create default task ({task.id} - {task.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_tasks'
            info=f'has created new default task {task.name}'
            info_id=task.id
            type='create_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default task created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT DEFAULT TASK
#############################################

def edit_default_task(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = data.get('projectStage', {})
        has_attachments = None
        has_attachments_str = data.get('hasAttachments', 'false') if data.get('hasAttachments') else None
        if has_attachments_str:
            if not isinstance(has_attachments_str, bool):
                has_attachments = True if has_attachments_str.lower() == 'true' else False
            else:
                has_attachments = has_attachments_str
        project_stage_status = data.get('projectStageStatus', 'not started')
        project_stage = ProjectStage.objects(id=stage['id']).first()
        
        default_task = ProjectDefaultTask.objects(name=name).first()
        if default_task and str(default_task.id) != id:
            return Response({'error': 'Default task already exists'}, status=404)
        default_task = ProjectDefaultTask.objects(id=id).first()
        if not stage:
            return Response({'error': 'Default task not found'}, status=404)
        default_task.name = name
        default_task.description = description
        default_task.project_stage = transform_data_to_mongo(project_stage)
        default_task.project_stage_status = project_stage_status
        default_task.has_attachments = has_attachments if has_attachments is not None else default_task.has_attachments
        default_task.last_modified_time = timezone.now()
        default_task.save()
        
        tasks = ProjectDefaultTask.objects.all()
        fix_order_after_edit(tasks, default_task, order)
        
        default_task = ProjectDefaultTask.objects(id=default_task.id).first()
        
        projects = Project.objects.all()
        for project in projects:
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            task = next((task for task in project_default_tasks if str(task['project_default_task']['_id']) == id), None)
            project_default_tasks = [task for task in project_default_tasks if str(task['project_default_task']['_id']) != id]
            project_default_tasks.append({
                'project_default_task': transform_data_to_mongo(default_task),
                'status': task['status'] if task else 'not started',
                'percentage': task['percentage'] if task else 0,
                'created_time': task['created_time'] if task else timezone.now(),
                'last_modified_time': timezone.now(),
                'users_assignees': task['users_assignees'] if task else [],
                'priority': task['priority'] if task else 'medium',
                'project_task_attachments': task['project_task_attachments'] if task else [],
            })
            project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
            project.project_default_tasks = project_default_tasks
            
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            for task in project_default_tasks:
                new_task = ProjectDefaultTask.objects(id=task['project_default_task']['_id']).first()
                task['project_default_task'] = transform_data_to_mongo(new_task)
            project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
            project.project_default_tasks = project_default_tasks
            project.save()
        
        tracking_info = transform_data_to_mongo(default_task)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update default task ({default_task.id} - {default_task.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_tasks'
            info=f'has updated default task {default_task.name}'
            info_id=default_task.id
            type='update_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Stage updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE DEFAULT TASK
#############################################

def delete_default_task(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        default_task = ProjectDefaultTask.objects(id=id).first()
        if not default_task:
            return Response({'error': 'Default task not found'}, status=404)
        tracking_info = transform_data_to_mongo(default_task)
        default_task.delete()
        
        tasks_after_order = ProjectDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        projects = Project.objects.all()
        for project in projects:
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            project_default_tasks = [task for task in project_default_tasks if str(task['project_default_task']['_id']) != id]
            project.project_default_tasks = project_default_tasks
            project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete default task ({tracking_info['id']} - {tracking_info['name']})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_tasks'
            info=f'has deleted default task {default_task.name}'
            info_id=default_task.id
            type='delete_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default task deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE DEFAULT TASKS
#############################################

def delete_default_tasks(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        default_tasks = ProjectDefaultTask.objects(id__in=ids).all()
        if not default_tasks:
            return Response({'error': 'Default tasks not found'}, status=404)
        tracking_info = [transform_data_to_mongo(default_task) for default_task in default_tasks]
        ProjectDefaultTask.objects(id__in=ids).delete()
        
        tasks_after_order = ProjectDefaultTask.objects.all()
        fix_order(tasks_after_order)
        
        projects = Project.objects.all()
        for project in projects:
            project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
            project_default_tasks = [task for task in project_default_tasks if str(task['project_default_task']['_id']) not in ids]
            project.project_default_tasks = project_default_tasks
            project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list default tasks',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_tasks'
            info=f'has deleted {len(ids)} default tasks'
            info_id='list'
            type='delete_default_tasks'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Default tasks deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE STATUS PROJECT DEFAULT TASK
#############################################

def change_status_project_default_task(request, projectId, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        status = data.get('status', 'not started')
        percentage = data.get('percentage', 0)
        
        all_tasks = project.project_default_tasks if project.project_default_tasks else []
        task = next((task for task in all_tasks if str(task['project_default_task']['_id']) == id), None)
        if not task:
            return Response({'error': 'Project task not found'}, status=404)
        task['status'] = status
        task['percentage'] = percentage
        task['user_reporter'] = user_reporter
        task['last_modified_time'] = timezone.now()
        
        tracking_task = task
        
        not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['project_default_task']['order'] > task['project_default_task']['order']]
        # not_started_tasks.append(task)
        if not project.has_permission:
            not_started_tasks = [t for t in not_started_tasks if t['project_default_task']['project_stage']['name'] != 'Permission']
            
        sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['project_default_task']['order'])
        
        def get_next_task(task, sorted_tasks):
            return next(
                (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
                None
            )
            # if has_permission:
            #     return next(
            #         (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
            #         None
            #     )
            # else:
            #     last_task = find_task_in_stage(sorted_tasks, 'Installation', position='last')
            #     print('last task name', last_task['project_default_task']['name'])
            #     print('task name', task['project_default_task']['name'])
            #     if str(last_task['project_default_task']['_id']) == str(task['project_default_task']['_id']):
            #         return find_task_in_stage(sorted_tasks, 'Closing')
            #     else:
            #         return next(
            #             (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
            #             None
            #         )
        
        if status == 'finished':
            next_task = get_next_task(task, sorted_tasks)
            print('next name', next_task)
            if next_task and next_task['status'] == 'not started':
                less_ordered_tasks = [t for t in all_tasks if t['project_default_task']['order'] < next_task['project_default_task']['order']]
                if not project.has_permission:
                    less_ordered_tasks = [t for t in less_ordered_tasks if t['project_default_task']['project_stage']['name'] != 'Permission']
                print('less ordered tasks', less_ordered_tasks)
                unfinished_tasks = [t for t in less_ordered_tasks if t['status'] != 'finished']
                print('unfinished tasks', unfinished_tasks)
                if not unfinished_tasks:
                    next_task['status'] = 'in progress'
                    next_task['percentage'] = 50
                    next_task['user_reporter'] = user_reporter
                    next_task['last_modified_time'] = timezone.now()
                    all_tasks = [t for t in all_tasks if str(t['project_default_task']['_id']) != str(next_task['project_default_task']['_id'])]
                    all_tasks.append(next_task)
        
        all_tasks = [task for task in all_tasks if str(task['project_default_task']['_id']) != id]
        all_tasks.append(task)
        sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        
        current_stage = get_current_stage_from_tasks(sorted_tasks)
        
        if not current_stage:
            current_stage = ProjectStage.objects(name='Finished').first()
        
        current_stage = ProjectStage.objects(name=current_stage['name']).first() 
        
        if current_stage:
            if current_stage.name == 'Permission' and not project.has_permission:
                order = current_stage.order + 1
                current_stage = ProjectStage.objects(order=order).first()
            
            if project.current_stage['name'] != current_stage.name:
                history = project.project_history if project.project_history else []
                current_stage = transform_data_to_mongo(current_stage)
                history.append({
                    'initial_stage': project.current_stage,
                    'final_stage': current_stage,
                    'created_time': timezone.now()
                })
                project.current_stage = current_stage 
                project.project_history = history
                
                tracking = ProjectTracking(
                    user_reporter=user_reporter,
                    action=f'change stage project ({project.id} - {project.name})',
                    created_time=timezone.now(),
                    managed_data={
                        'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_history'])
                    },
                )
                tracking.save()
        
        project.project_default_tasks = sorted_tasks
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'change status default task ({task["project_default_task"]["id"]} - {task["project_default_task"]["name"]}) in project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_task
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has changed status in task {task["project_default_task"]["name"]} in project {project.name}'
            info_id=project.id
            type='change_status_project_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Status in default task updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE PRIORITY PROJECT DEFAULT TASK
#############################################

def change_priority_project_default_task(request, projectId, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        priority = data.get('priority', 'medium')
        
        all_tasks = project.project_default_tasks if project.project_default_tasks else []
        task = next((task for task in all_tasks if str(task['project_default_task']['_id']) == id), None)
        if not task:
            return Response({'error': 'Project task not found'}, status=404)
        task['priority'] = priority
        task['user_reporter'] = user_reporter
        task['last_modified_time'] = timezone.now()
        
        all_tasks = [task for task in all_tasks if str(task['project_default_task']['_id']) != id]
        all_tasks.append(task)
        sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        
        project.project_default_tasks = sorted_tasks
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'change priority default task ({task["project_default_task"]["id"]} - {task["project_default_task"]["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_default_tasks'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has changed priority in task {task["project_default_task"]["name"]} in project {project.name}'
            info_id=project.id
            type='change_priority_project_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Status in default task updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# UPLOAD FILES TO DEFAULT TASK
#############################################

def upload_files_to_default_task(request, projectId, id): 
    
    project = Project.objects(id=projectId).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    all_tasks = project.project_default_tasks if project.project_default_tasks else []
    task = next((task for task in all_tasks if str(task['project_default_task']['_id']) == id), None)
    if not task:
        return Response({'error': 'Project task not found'}, status=404)
    
    last_attachments = task['project_task_attachments'] if 'project_task_attachments' in task else []
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    project_tasks_attachments = []
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
                due_project_stage = project.current_stage if project.current_stage else None,
                project_task = {
                    'project_default_task': {
                        '_id': task['project_default_task']['_id'],
                        'id': task['project_default_task']['_id'],
                        'name': task['project_default_task']['name'],
                        'order': task['project_default_task']['order'],
                        'redefined': True,
                        'project_stage': {
                            '_id': task['project_default_task']['project_stage']['_id'],
                            'id': task['project_default_task']['project_stage']['_id'],
                            'name': task['project_default_task']['project_stage']['name'],
                            'order': task['project_default_task']['project_stage']['order'],
                        }
                     },
                }
            )
            attachment.save()
            project_tasks_attachments.append(transform_data_to_mongo(attachment))
            
    last_attachments.extend(project_tasks_attachments)
            
    last_attachments = sorted(last_attachments, key=lambda x: x['name'], reverse=True)
    
    task['last_modified_time'] = timezone.now()
    
    task['project_task_attachments'] = last_attachments if last_attachments else task['project_task_attachments']
    
    all_tasks = [task for task in all_tasks if str(task['project_default_task']['_id']) != id]
    all_tasks.append(task)
    sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
    
    project.project_default_tasks = sorted_tasks
    
    project.last_modified_time = timezone.now()
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'upload files to default task ({task['project_default_task']['_id']} - {task['project_default_task']['name']} in project {project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_default_tasks'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has uploaded file attachments to task {task["project_default_task"]["name"]} in project {project.name}'
        info_id=project.id
        type='upload_files_to_default_task'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Uploaded files to default task successfully',
        'data': json.loads(project.to_json())
    }, status=201)