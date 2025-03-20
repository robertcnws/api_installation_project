from mongoengine import signals
from api_projects.data_util import serialize_datetime
from .models import (
    Service,
    ServiceIssue,
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
                "client": document.client,
                "sales_order": document.sales_order,
                "troubled_products": document.troubled_products,
                "troubled_info": document.troubled_info,
                "user_reporter": document.user_reporter,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stage_history": document.stage_history,
                "users_assignees": document.users_assignees,
                "start_date": document.start_date,
                "end_date": document.end_date,
                "current_stage": document.current_stage,
                "service_attachments": document.service_attachments,
                "service_history": document.service_history,
                "address": document.address,
                "is_active": document.is_active,
                "user_manager": document.user_manager,
                "service_comments": document.service_comments,
                "service_default_tasks": document.service_default_tasks,
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
                "sales_order": document.sales_order,
                "troubled_products": document.troubled_products,
                "troubled_info": document.troubled_info,
                "user_reporter": document.user_reporter,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stage_history": document.stage_history,
                "users_assignees": document.users_assignees,
                "start_date": document.start_date,
                "end_date": document.end_date,
                "current_stage": document.current_stage,
                "service_attachments": document.service_attachments,
                "service_history": document.service_history,
                "address": document.address,
                "is_active": document.is_active,
                "user_manager": document.user_manager,
                "service_comments": document.service_comments,
                "service_default_tasks": document.service_default_tasks,
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
                "client": document.client,
                "sales_order": document.sales_order,
                "troubled_products": document.troubled_products,
                "troubled_info": document.troubled_info,
                "user_reporter": document.user_reporter,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stage_history": document.stage_history,
                "users_assignees": document.users_assignees,
                "start_date": document.start_date,
                "end_date": document.end_date,
                "current_stage": document.current_stage,
                "service_attachments": document.service_attachments,
                "service_history": document.service_history,
                "address": document.address,
                "is_active": document.is_active,
                "user_manager": document.user_manager,
                "service_comments": document.service_comments,
                "service_default_tasks": document.service_default_tasks,
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
                "client": document.client,
                "sales_order": document.sales_order,
                "troubled_products": document.troubled_products,
                "troubled_info": document.troubled_info,
                "user_reporter": document.user_reporter,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stage_history": document.stage_history,
                "users_assignees": document.users_assignees,
                "start_date": document.start_date,
                "end_date": document.end_date,
                "current_stage": document.current_stage,
                "service_attachments": document.service_attachments,
                "service_history": document.service_history,
                "address": document.address,
                "is_active": document.is_active,
                "user_manager": document.user_manager,
                "service_comments": document.service_comments,
                "service_default_tasks": document.service_default_tasks,
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
                "is_active": document.is_active,
                "created_time": document.created_time,
                "last_modified_time": document.last_modified_time,
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
                "is_active": document.is_active,
                "created_time": document.created_time,
                "last_modified_time": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('service_issue', serialize_datetime(event))
    
##########################################################################

signals.post_save.connect(service_saved, sender=Service)
signals.post_delete.connect(service_deleted, sender=Service)
signals.post_save.connect(service_by_id_saved, sender=Service)
signals.post_delete.connect(service_by_id_deleted, sender=Service)
signals.post_save.connect(service_issue_saved, sender=ServiceIssue)
signals.post_delete.connect(service_issue_deleted, sender=ServiceIssue)

