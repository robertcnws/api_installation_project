from mongoengine import signals
from api_projects.data_util import serialize_datetime
from .models import (
    Service,
    ServiceIssue,
    ServiceStage,    
    ServiceDefaultTask,
)
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json


##########################################################################
# Service
##########################################################################


def service_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'service_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "number": document.number,
                "version": document.version,
                "name": document.name,
                "client": document.client,
                "salesOrder": document.sales_order,
                "referenceNumber": document.reference_number,
                "phone": document.phone,
                "issuedProducts": document.issued_products,
                "userReporter": document.user_reporter,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "usersAssignees": document.users_assignees,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "serviceAttachments": document.service_attachments,
                "serviceHistory": document.service_history,
                "address": document.address,
                "isActive": document.is_active,
                "userManager": document.user_manager,
                "serviceComments": document.service_comments,
                "serviceDefaultTasks": document.service_default_tasks,
                "usersServiceTeam": document.users_service_team,
                "serviceType": document.service_type,
                "servicePlace": document.service_place,
                "serviceNotes": document.service_notes,
                "hasToPay": document.has_to_pay,
                "paid": document.paid,
                "byFactory": document.by_factory,
                "repaired": document.repaired,
                "createdBy": document.created_by,
                "isPartDays": document.is_part_days,
                "isClosed": document.is_closed,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('service', serialize_datetime(event))
    

def service_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'service_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "client": document.client,
                "number": document.number,
                "name": document.name,
                "version": document.version,
                "salesOrder": document.sales_order,
                "referenceNumber": document.reference_number,
                "phone": document.phone,
                "issuedProducts": document.issued_products,
                "userReporter": document.user_reporter,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "usersAssignees": document.users_assignees,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "serviceAttachments": document.service_attachments,
                "serviceHistory": document.service_history,
                "address": document.address,
                "isActive": document.is_active,
                "userManager": document.user_manager,
                "serviceComments": document.service_comments,
                "serviceDefaultTasks": document.service_default_tasks,
                "usersServiceTeam": document.users_service_team,
                "serviceType": document.service_type,
                "servicePlace": document.service_place,
                "serviceNotes": document.service_notes,
                "hasToPay": document.has_to_pay,
                "paid": document.paid,
                "byFactory": document.by_factory,
                "repaired": document.repaired,
                "createdBy": document.created_by,
                "isPartDays": document.is_part_days,
                "isClosed": document.is_closed,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('service', serialize_datetime(event))
    

##########################################################################    
# Service By ID
##########################################################################

def service_by_id_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"service_{str(document.id)}"
    event = {
        'type': 'service_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "number": document.number,
                "version": document.version,
                "name": document.name,
                "client": document.client,
                "salesOrder": document.sales_order,
                "referenceNumber": document.reference_number,
                "phone": document.phone,
                "issuedProducts": document.issued_products,
                "userReporter": document.user_reporter,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "usersAssignees": document.users_assignees,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "serviceAttachments": document.service_attachments,
                "serviceHistory": document.service_history,
                "address": document.address,
                "isActive": document.is_active,
                "userManager": document.user_manager,
                "serviceComments": document.service_comments,
                "serviceDefaultTasks": document.service_default_tasks,
                "usersServiceTeam": document.users_service_team,
                "serviceType": document.service_type,
                "servicePlace": document.service_place,
                "serviceNotes": document.service_notes,
                "hasToPay": document.has_to_pay,
                "paid": document.paid,
                "byFactory": document.by_factory,
                "repaired": document.repaired,
                "createdBy": document.created_by,
                "isPartDays": document.is_part_days,
                "isClosed": document.is_closed,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    

def service_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"service_{str(document.id)}"
    event = {
        'type': 'service_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "number": document.number,
                "version": document.version,
                "name": document.name,
                "client": document.client,
                "salesOrder": document.sales_order,
                "referenceNumber": document.reference_number,
                "phone": document.phone,
                "issuedProducts": document.issued_products,
                "userReporter": document.user_reporter,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "usersAssignees": document.users_assignees,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "serviceAttachments": document.service_attachments,
                "serviceHistory": document.service_history,
                "address": document.address,
                "isActive": document.is_active,
                "userManager": document.user_manager,
                "serviceComments": document.service_comments,
                "serviceDefaultTasks": document.service_default_tasks,
                "usersServiceTeam": document.users_service_team,
                "serviceType": document.service_type,
                "servicePlace": document.service_place,
                "serviceNotes": document.service_notes,
                "hasToPay": document.has_to_pay,
                "paid": document.paid,
                "byFactory": document.by_factory,
                "repaired": document.repaired,
                "createdBy": document.created_by,
                "isPartDays": document.is_part_days,
                "isClosed": document.is_closed,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
    
##########################################################################
# Service Issue
##########################################################################


def service_issue_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'service_issue_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('service_issue', serialize_datetime(event))
    

def service_issue_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'service_issue_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('service_issue', serialize_datetime(event))
    
    
##########################################################################
# Service Stage
##########################################################################

def service_stage_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'service_stage_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "order": document.order,
                "description": document.description,
                "isActive": document.is_active,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('service_stage', serialize_datetime(event))
    

def service_stage_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'service_stage_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "order": document.order,
                "description": document.description,
                "isActive": document.is_active,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('service_stage', serialize_datetime(event))
    
    
##########################################################################    
# Service Default Task
##########################################################################

def service_default_task_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'service_default_task_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "order": document.order,
                "serviceStage": document.service_stage,
                "serviceStageStatus": document.service_stage_status,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
                "hasAttachments": document.has_attachments,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('service_default_task', serialize_datetime(event))


def service_default_task_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'service_default_task_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "order": document.order,
                "serviceStage": document.service_stage,
                "serviceStageStatus": document.service_stage_status,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
                "hasAttachments": document.has_attachments,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('service_default_task', serialize_datetime(event))
    
##########################################################################

signals.post_save.connect(service_saved, sender=Service)
signals.post_delete.connect(service_deleted, sender=Service)
signals.post_save.connect(service_by_id_saved, sender=Service)
signals.post_delete.connect(service_by_id_deleted, sender=Service)
signals.post_save.connect(service_issue_saved, sender=ServiceIssue)
signals.post_delete.connect(service_issue_deleted, sender=ServiceIssue)
signals.post_save.connect(service_stage_saved, sender=ServiceStage)
signals.post_delete.connect(service_stage_deleted, sender=ServiceStage)
signals.post_save.connect(service_default_task_saved, sender=ServiceDefaultTask)
signals.post_delete.connect(service_default_task_deleted, sender=ServiceDefaultTask)

