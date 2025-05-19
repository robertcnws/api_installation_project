from mongoengine import signals
from api_projects.data_util import serialize_datetime
from .models import (
    Measurement
)
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json


##########################################################################
# Measurement
##########################################################################


def measurement_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'mesurement_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "number": document.number,
                "customer": document.customer,
                "salesOrder": document.sales_order,
                "service": document.service,
                "project": document.project,
                "userReporter": document.user_reporter,
                "userManager": document.user_manager,
                "phone": document.phone,
                "address": document.address,
                "color": document.color,
                "marks": document.marks,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "firstDate": document.first_date,
                "checkDate": document.check_date,
                "firstAssignee": document.first_assignee,
                "checkAssignee": document.check_assignee,
                "measurementAttachments": document.measurement_attachments,
                "measurementComments": document.measurement_comments,
                "generalNotes": document.general_notes,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('service', serialize_datetime(event))
    

def measurement_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'measurement_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "number": document.number,
                "customer": document.customer,
                "salesOrder": document.sales_order,
                "service": document.service,
                "project": document.project,
                "userReporter": document.user_reporter,
                "userManager": document.user_manager,
                "phone": document.phone,
                "address": document.address,
                "color": document.color,
                "marks": document.marks,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "firstDate": document.first_date,
                "checkDate": document.check_date,
                "firstAssignee": document.first_assignee,
                "checkAssignee": document.check_assignee,
                "measurementAttachments": document.measurement_attachments,
                "measurementComments": document.measurement_comments,
                "generalNotes": document.general_notes,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('measurement', serialize_datetime(event))
    

##########################################################################    
# Measurement By ID
##########################################################################

def measurement_by_id_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"measurement_{str(document.id)}"
    event = {
        'type': 'measurement_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "number": document.number,
                "customer": document.customer,
                "salesOrder": document.sales_order,
                "service": document.service,
                "project": document.project,
                "userReporter": document.user_reporter,
                "userManager": document.user_manager,
                "phone": document.phone,
                "address": document.address,
                "color": document.color,
                "marks": document.marks,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "firstDate": document.first_date,
                "checkDate": document.check_date,
                "firstAssignee": document.first_assignee,
                "checkAssignee": document.check_assignee,
                "measurementAttachments": document.measurement_attachments,
                "measurementComments": document.measurement_comments,
                "generalNotes": document.general_notes,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    

def measurement_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"measurement_{str(document.id)}"
    event = {
        'type': 'measurement_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "number": document.number,
                "customer": document.customer,
                "salesOrder": document.sales_order,
                "service": document.service,
                "project": document.project,
                "userReporter": document.user_reporter,
                "userManager": document.user_manager,
                "phone": document.phone,
                "address": document.address,
                "color": document.color,
                "marks": document.marks,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "firstDate": document.first_date,
                "checkDate": document.check_date,
                "firstAssignee": document.first_assignee,
                "checkAssignee": document.check_assignee,
                "measurementAttachments": document.measurement_attachments,
                "measurementComments": document.measurement_comments,
                "generalNotes": document.general_notes,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
##########################################################################

signals.post_save.connect(measurement_saved, sender=Measurement)
signals.post_delete.connect(measurement_deleted, sender=Measurement)
signals.post_save.connect(measurement_by_id_saved, sender=Measurement)
signals.post_delete.connect(measurement_by_id_deleted, sender=Measurement)