from mongoengine import signals
from .data_util import serialize_datetime
from .models import (
    ProjectStage, 
    ProjectTaskStage, 
    Project,
    ProjectDefaultTask,
    ProjectNotificationUser,
    ProjectTracking,
    ProjectDefaultGuideProduct,
    ProjectReminder,
    ProjectDefaultMaterial,
)
from .models_sync import ProjectSync
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json


##########################################################################
# ProjectDefaultMaterial
##########################################################################

def project_default_material_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_default_material_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "price": document.price,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "quantity": document.quantity,
                "isPackaged": document.is_packaged,
                "packageQuantity": document.package_quantity,
                "defaultGuideProducts": document.default_guide_products,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project_default_material', serialize_datetime(event))
    

def project_default_material_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_default_material_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "price": document.price,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "quantity": document.quantity,
                "isPackaged": document.is_packaged,
                "packageQuantity": document.package_quantity,
                "defaultGuideProducts": document.default_guide_products,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project_default_material', serialize_datetime(event))


##########################################################################
# ProjectReminder
##########################################################################

def project_reminder_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_reminder_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "project": document.project,
                "projectDefaultTask": document.project_default_task,
                "userReporter": document.user_reporter,
                "notes": document.notes,
                "date": document.date,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project_reminder', serialize_datetime(event))
    

def project_reminder_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_reminder_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "project": document.project,
                "projectDefaultTask": document.project_default_task,
                "userReporter": document.user_reporter,
                "notes": document.notes,
                "date": document.date,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project_reminder', serialize_datetime(event))


##########################################################################
# ProjectDefaultGuideProduct
##########################################################################

def project_default_guide_product_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_default_guide_product_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "price": document.price,
                "description": document.description,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project_default_guide_product', serialize_datetime(event))
    

def project_default_guide_product_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_default_guide_product_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "price": document.price,
                "description": document.description,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project_default_guide_product', serialize_datetime(event))

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
                "order": document.order,
                "otherName": document.other_name,
                "isActive": document.is_active,
                "lastModifiedTime": document.last_modified_time,
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
                "order": document.order,
                "otherName": document.other_name,
                "isActive": document.is_active,
                "lastModifiedTime": document.last_modified_time,
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
                "referenceNumber": document.reference_number,
                "salesOrder": document.sales_order,
                "phone": document.phone,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "userInstaller": document.user_installer,
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
                "allProductsMarked": document.all_products_marked,
                "allWindowsMarked": document.all_windows_marked,
                "allScrewMarked": document.all_screw_marked,
                "allTrashMarked": document.all_trash_marked,
                "feedback": document.feedback,
                "workScope": document.work_scope,
                "projectMaterials": document.project_materials,
                "projectGuideProducts": document.project_guide_products,
                "projectMaterialsOtherNotes": document.project_materials_other_notes,
                "inspectionDate": document.inspection_date,
                "finishPermissionDate": document.finish_permission_date,
                "isPartDays": document.is_part_days,
                "duration": document.duration,
                "workOrders": document.work_orders,
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
                "referenceNumber": document.reference_number,
                "salesOrder": document.sales_order,
                "phone": document.phone,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "userInstaller": document.user_installer,
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
                "allProductsMarked": document.all_products_marked,
                "allWindowsMarked": document.all_windows_marked,
                "allScrewMarked": document.all_screw_marked,
                "allTrashMarked": document.all_trash_marked,
                "feedback": document.feedback,
                "workScope": document.work_scope,
                "projectMaterials": document.project_materials,
                "projectGuideProducts": document.project_guide_products,
                "projectMaterialsOtherNotes": document.project_materials_other_notes,
                "inspectionDate": document.inspection_date,
                "finishPermissionDate": document.finish_permission_date,
                "isPartDays": document.is_part_days,
                "duration": document.duration,
                "workOrders": document.work_orders,
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
# Project Tracking
##########################################################################

def project_tracking_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_tracking_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "userReporter": document.user_reporter,
                "action": document.action,
                "createdTime": document.created_time,
                "managedData": document.managed_data,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('project_tracking', serialize_datetime(event))


def project_tracking_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'project_tracking_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "userReporter": document.user_reporter,
                "action": document.action,
                "createdTime": document.created_time,
                "managedData": document.managed_data,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('project_tracking', serialize_datetime(event))
    

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
                "referenceNumber": document.reference_number,
                "salesOrder": document.sales_order,
                "phone": document.phone,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "userInstaller": document.user_installer,
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
                "allProductsMarked": document.all_products_marked,
                "allWindowsMarked": document.all_windows_marked,
                "allScrewMarked": document.all_screw_marked,
                "allTrashMarked": document.all_trash_marked,
                "feedback": document.feedback,
                "workScope": document.work_scope,
                "projectMaterials": document.project_materials,
                "projectGuideProducts": document.project_guide_products,
                "projectMaterialsOtherNotes": document.project_materials_other_notes,
                "inspectionDate": document.inspection_date,
                "finishPermissionDate": document.finish_permission_date,
                "isPartDays": document.is_part_days,
                "duration": document.duration,
                "workOrders": document.work_orders,
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
                "referenceNumber": document.reference_number,
                "salesOrder": document.sales_order,
                "phone": document.phone,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "userInstaller": document.user_installer,
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
                "allProductsMarked": document.all_products_marked,
                "allWindowsMarked": document.all_windows_marked,
                "allScrewMarked": document.all_screw_marked,
                "allTrashMarked": document.all_trash_marked,
                "feedback": document.feedback,
                "workScope": document.work_scope,
                "projectMaterials": document.project_materials,
                "projectGuideProducts": document.project_guide_products,
                "projectMaterialsOtherNotes": document.project_materials_other_notes,
                "inspectionDate": document.inspection_date,
                "finishPermissionDate": document.finish_permission_date,
                "isPartDays": document.is_part_days,
                "duration": document.duration,
                "workOrders": document.work_orders,
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
    
    
##########################################################################
# SYNC MODELS
##########################################################################

def sync_project(sender, document, **kwargs):
    # Copiamos solo los campos que Definimos en ProjectDashboard
    data = {
        '_id': document.id,
        'address': document.address,
        'name': document.name,
        'number': document.number,
        'description': document.description,
        'reference_number': document.reference_number,
        'start_date': document.start_date,
        'end_date': document.end_date,
        'created_time': document.created_time,
        'last_modified_time': document.last_modified_time,
        'is_active': document.is_active,
        'has_permission': document.has_permission,
        'all_products_marked': document.all_products_marked,
        'all_windows_marked': document.all_windows_marked,
        'all_screw_marked': document.all_screw_marked,
        'all_trash_marked': document.all_trash_marked,
        'project_materials_other_notes': document.project_materials_other_notes,
        # … el resto de escalares …
        'sales_order': document.sales_order,
        'project_tasks': document.project_tasks,
        'project_default_tasks': document.project_default_tasks,
        'project_history': document.project_history,
        'project_attachments': document.project_attachments,
        'project_comments': document.project_comments,
        'stage_history': document.stage_history,
        'users_assignees': document.users_assignees,
        'project_materials': document.project_materials,
        'project_guide_products': document.project_guide_products,
        'user_manager': document.user_manager,
        'user_reporter': document.user_reporter,
        'user_installer': document.user_installer,
        'feedback': document.feedback,
        'work_scope': document.work_scope,
        'inspection_date': document.inspection_date,
        'finish_permission_date': document.finish_permission_date,
        'is_part_days': document.is_part_days,
        'current_stage': document.current_stage,
    }
    
    ProjectSync._get_collection().replace_one(
        {'_id': document.id},
        data,
        upsert=True
    )

def delete_from_sync(sender, document, **kwargs):
    ProjectSync._get_collection().delete_one({'_id': document.id})


####
    
    
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
signals.post_save.connect(project_tracking_saved, sender=ProjectTracking)
signals.post_delete.connect(project_tracking_deleted, sender=ProjectTracking)
signals.post_save.connect(project_default_guide_product_saved, sender=ProjectDefaultGuideProduct)
signals.post_delete.connect(project_default_guide_product_deleted, sender=ProjectDefaultGuideProduct)
signals.post_save.connect(project_reminder_saved, sender=ProjectReminder)
signals.post_delete.connect(project_reminder_deleted, sender=ProjectReminder)
signals.post_save.connect(project_default_material_saved, sender=ProjectDefaultMaterial)
signals.post_delete.connect(project_default_material_deleted, sender=ProjectDefaultMaterial)

signals.post_save.connect(sync_project, sender=Project)
signals.post_delete.connect(delete_from_sync, sender=Project)
