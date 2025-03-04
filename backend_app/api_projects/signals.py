from mongoengine import signals
from .data_util import serialize_datetime
from .models import (
    ProjectStage, 
    ProjectTaskStage, 
    Project,
    ProjectDefaultTask,
    ProjectNotificationUser,
)
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json

##########################################################################
# ProjectStage
##########################################################################

def project_stage_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_stage_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project_stage', serialize_datetime(event))
    

def project_stage_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_stage_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project_stage', serialize_datetime(event))
    
    
##########################################################################    
# ProjectTaskStage
##########################################################################

def project_task_stage_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_task_stage_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project_task_stage', serialize_datetime(event))


def project_task_stage_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_task_stage_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project_task_stage', serialize_datetime(event))
    
    
##########################################################################    
# Project
##########################################################################

def project_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "salesOrder": document.sales_order,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "projectAttachments": document.project_attachments,
                "projectTasks": document.project_tasks,
                "projectDefaultTasks": document.project_default_tasks,
                "projectComments": document.project_comments,
                "projectHistory": document.project_history,
                "address": document.address,
                "isActive": document.is_active,
                "hasPermission": document.has_permission,
                "userManager": document.user_manager,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project', serialize_datetime(event))


def project_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "salesOrder": document.sales_order,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "projectAttachments": document.project_attachments,
                "projectTasks": document.project_tasks,
                "projectDefaultTasks": document.project_default_tasks,
                "projectComments": document.project_comments,
                "projectHistory": document.project_history,
                "address": document.address,
                "isActive": document.is_active,
                "hasPermission": document.has_permission,
                "userManager": document.user_manager,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project', serialize_datetime(event))
    
    

##########################################################################    
# Project Default Task
##########################################################################

def project_default_task_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_default_task_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "order": document.order,
                "projectStage": document.project_stage,
                "projectStageStatus": document.project_stage_status,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
                "hasAttachments": document.has_attachments,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project_default_task', serialize_datetime(event))


def project_default_task_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_default_task_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "order": document.order,
                "projectStage": document.project_stage,
                "projectStageStatus": document.project_stage_status,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
                "hasAttachments": document.has_attachments,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project_default_task', serialize_datetime(event))
    

##########################################################################    
# Project By ID
##########################################################################

def project_by_id_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"project_{str(document.id)}"
    event = {
        'type': 'project_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "salesOrder": document.sales_order,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "projectAttachments": document.project_attachments,
                "projectTasks": document.project_tasks,
                "projectDefaultTasks": document.project_default_tasks,
                "projectComments": document.project_comments,
                "projectHistory": document.project_history,
                "address": document.address,
                "isActive": document.is_active,
                "hasPermission": document.has_permission,
                "userManager": document.user_manager,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    

def project_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"project_{str(document.id)}"
    event = {
        'type': 'project_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "salesOrder": document.sales_order,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "projectAttachments": document.project_attachments,
                "projectTasks": document.project_tasks,
                "projectDefaultTasks": document.project_default_tasks,
                "projectComments": document.project_comments,
                "projectHistory": document.project_history,
                "address": document.address,
                "isActive": document.is_active,
                "hasPermission": document.has_permission,
                "userManager": document.user_manager,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
##########################################################################    
# Project Notification User
##########################################################################

def project_notification_user_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_notification_user_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "notification": document.notification,
                "username": document.username,
                "user": document.user,
                "read": document.read,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project_notification_user', serialize_datetime(event))


def project_notification_user_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_notification_user_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "notification": document.notification,
                "username": document.username,
                "user": document.user,
                "read": document.read,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project_notification_user', serialize_datetime(event))
    
    
signals.post_save.connect(project_by_id_saved, sender=Project)
signals.post_delete.connect(project_by_id_deleted, sender=Project)
signals.post_save.connect(project_stage_saved, sender=ProjectStage)
signals.post_delete.connect(project_stage_deleted, sender=ProjectStage)
signals.post_save.connect(project_task_stage_saved, sender=ProjectTaskStage)
signals.post_delete.connect(project_task_stage_deleted, sender=ProjectTaskStage)
signals.post_save.connect(project_saved, sender=Project)
signals.post_delete.connect(project_deleted, sender=Project)
signals.post_save.connect(project_default_task_saved, sender=ProjectDefaultTask)
signals.post_delete.connect(project_default_task_deleted, sender=ProjectDefaultTask)
signals.post_save.connect(project_notification_user_saved, sender=ProjectNotificationUser)
signals.post_delete.connect(project_notification_user_deleted, sender=ProjectNotificationUser)
