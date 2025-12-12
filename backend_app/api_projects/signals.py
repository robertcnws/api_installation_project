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
    ProjectCalendarNotes,
    ProjectProfitReport,
    ProjectInstallationCrew,
)
from .models_sync import ProjectSync
from .models_extra import TaskTimer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from api_projects.event_messages import (
    message_project_default_material,
    message_project_reminder,
    message_project_default_guide_product,
    message_project_stage,
    message_project_task_stage,
    message_project,
    message_project_default_task,
    message_project_tracking,
    message_project_notification_user,
    message_project_calendar_notes,
    message_project_profit_report,
    message_project_installation_crew,
    message_timer,
)
import json

##########################################################################
# TaskTimer
##########################################################################

def timer_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_timer('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('timer', serialize_datetime(event))
    
def timer_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_timer('deleted', document)
    async_to_sync(channel_layer.group_send)('timer', serialize_datetime(event))

##########################################################################    
# ProjectInstallationCrew
##########################################################################

def project_installation_crew_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_installation_crew('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_installation_crew', serialize_datetime(event))
    
def project_installation_crew_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_installation_crew('deleted', document)
    async_to_sync(channel_layer.group_send)('project_installation_crew', serialize_datetime(event))

##########################################################################    
# ProjectProfitReport
##########################################################################

def project_profit_report_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_profit_report('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_profit_report', serialize_datetime(event))
    
def project_profit_report_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_profit_report('deleted', document)
    async_to_sync(channel_layer.group_send)('project_profit_report', serialize_datetime(event))

##########################################################################
# ProjectCalendarNotes
##########################################################################

def project_calendar_notes_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_calendar_notes('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_calendar_notes', serialize_datetime(event))
    
    
def project_calendar_notes_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_calendar_notes('deleted', document)
    async_to_sync(channel_layer.group_send)('project_calendar_notes', serialize_datetime(event))


##########################################################################
# ProjectDefaultMaterial
##########################################################################

def project_default_material_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_default_material('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_default_material', serialize_datetime(event))
    

def project_default_material_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_default_material('deleted', document)
    async_to_sync(channel_layer.group_send)('project_default_material', serialize_datetime(event))


##########################################################################
# ProjectReminder
##########################################################################

def project_reminder_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_reminder('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_reminder', serialize_datetime(event))
    

def project_reminder_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_reminder('deleted', document)
    async_to_sync(channel_layer.group_send)('project_reminder', serialize_datetime(event))


##########################################################################
# ProjectDefaultGuideProduct
##########################################################################

def project_default_guide_product_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_default_guide_product('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_default_guide_product', serialize_datetime(event))
    

def project_default_guide_product_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_default_guide_product('deleted', document)
    async_to_sync(channel_layer.group_send)('project_default_guide_product', serialize_datetime(event))

##########################################################################
# ProjectStage
##########################################################################

def project_stage_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_stage('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_stage', serialize_datetime(event))
    

def project_stage_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_stage('deleted', document)
    async_to_sync(channel_layer.group_send)('project_stage', serialize_datetime(event))
    
    
##########################################################################    
# ProjectTaskStage
##########################################################################

def project_task_stage_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_task_stage('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_task_stage', serialize_datetime(event))


def project_task_stage_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_task_stage('deleted', document)
    async_to_sync(channel_layer.group_send)('project_task_stage', serialize_datetime(event))
    
    
##########################################################################    
# Project
##########################################################################

def project_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project', serialize_datetime(event))


def project_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project('deleted', document)
    async_to_sync(channel_layer.group_send)('project', serialize_datetime(event))
    
    

##########################################################################    
# Project Default Task
##########################################################################

def project_default_task_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_default_task('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_default_task', serialize_datetime(event))


def project_default_task_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_default_task('deleted', document)
    async_to_sync(channel_layer.group_send)('project_default_task', serialize_datetime(event))
    
    

##########################################################################    
# Project Tracking
##########################################################################

def project_tracking_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_tracking('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_tracking', serialize_datetime(event))


def project_tracking_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_tracking('deleted', document)
    async_to_sync(channel_layer.group_send)('project_tracking', serialize_datetime(event))
    

##########################################################################    
# Project By ID
##########################################################################

def project_by_id_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"project_{str(document.id)}"
    event = message_project('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    

def project_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"project_{str(document.id)}"
    event = message_project('deleted', document)
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
##########################################################################    
# Project Notification User
##########################################################################

def project_notification_user_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = message_project_notification_user('created' if created else 'updated', document)
    async_to_sync(channel_layer.group_send)('project_notification_user', serialize_datetime(event))


def project_notification_user_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = message_project_notification_user('deleted', document)
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
        'inspection_end_date': document.inspection_end_date,
        'inspection_duration': document.inspection_duration,
        'inspection_is_part_days': document.inspection_is_part_days,
        'finish_permission_date': document.finish_permission_date,
        'finish_permission_end_date': document.finish_permission_end_date,
        'finish_permission_duration': document.finish_permission_duration,
        'finish_permission_is_part_days': document.finish_permission_is_part_days,
        'is_part_days': document.is_part_days,
        'current_stage': document.current_stage,
        'work_orders': document.work_orders,
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

signals.post_save.connect(project_calendar_notes_saved, sender=ProjectCalendarNotes)
signals.post_delete.connect(project_calendar_notes_deleted, sender=ProjectCalendarNotes)

signals.post_save.connect(project_profit_report_saved, sender=ProjectProfitReport)
signals.post_delete.connect(project_profit_report_deleted, sender=ProjectProfitReport)

signals.post_save.connect(project_installation_crew_saved, sender=ProjectInstallationCrew)
signals.post_delete.connect(project_installation_crew_deleted, sender=ProjectInstallationCrew)

signals.post_save.connect(timer_saved, sender=TaskTimer)
signals.post_delete.connect(timer_deleted, sender=TaskTimer)