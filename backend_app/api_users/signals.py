from mongoengine import signals
from api_projects.data_util import serialize_datetime
from .models import (
    UserRole, 
)
from api_authorization.models import LoginUser
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json

##########################################################################
# UserRole
##########################################################################

def user_role_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'user_role_update',
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
    async_to_sync(channel_layer.group_send)('user_role', serialize_datetime(event))
    
    
def user_role_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'user_role_update',
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
    async_to_sync(channel_layer.group_send)('user_role', serialize_datetime(event))
    
    
##########################################################################
# User
##########################################################################

def user_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'user_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "isActive": document.is_active,
                "address": document.address,
                "city": document.city,
                "country": document.country,
                "createdTime": document.created_time,
                "dateJoined": document.date_joined,
                "dateUpdated": document.date_updated,
                "email": document.email,
                "firstName": document.first_name,
                "gender": document.gender,
                "isStaff": document.is_staff,
                "lastLogin": document.last_login,
                "lastModifiedTime": document.last_modified_time,
                "lastName": document.last_name,
                "phoneNumber": document.phone_number,
                "state": document.state,
                "userRole": document.user_role,
                "username": document.username,
                "zipCode": document.zip_code,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('user', serialize_datetime(event))
    
    
def user_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'user_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "isActive": document.is_active,
                "address": document.address,
                "city": document.city,
                "country": document.country,
                "createdTime": document.created_time,
                "dateJoined": document.date_joined,
                "dateUpdated": document.date_updated,
                "email": document.email,
                "firstName": document.first_name,
                "gender": document.gender,
                "isStaff": document.is_staff,
                "lastLogin": document.last_login,
                "lastModifiedTime": document.last_modified_time,
                "lastName": document.last_name,
                "phoneNumber": document.phone_number,
                "state": document.state,
                "userRole": document.user_role,
                "username": document.username,
                "zipCode": document.zip_code,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('user', serialize_datetime(event))
    


signals.post_save.connect(user_role_saved, sender=UserRole)
signals.post_delete.connect(user_role_deleted, sender=UserRole)
signals.post_save.connect(user_saved, sender=LoginUser)
signals.post_delete.connect(user_deleted, sender=LoginUser)
