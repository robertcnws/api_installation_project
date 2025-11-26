from mongoengine import (
                            Document, 
                            StringField, 
                            BooleanField, 
                            DateTimeField, 
                            DateTimeField, 
                            BooleanField, 
                            StringField, 
                            DateTimeField, 
                            BooleanField, 
                            StringField, 
                            DateTimeField,
                            ListField,
                            DynamicField,
                            IntField,
                            FloatField,
                        )

from django.utils import timezone
from api_integration.models import ZohoSalesOrder


class ProjectStage(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    order = IntField(default=0)
    other_name = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'project_stage',
        'ordering': ['order'],
        'indexes': [
            'name', 'order', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Stage',
        'verbose_name_plural': 'Project Stages'
    }

    def __str__(self):
        return self.name
    

class ProjectTaskStage(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    order = IntField(default=0)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'project_task_stage',
        'ordering': ['order'],
        'indexes': [
            'name', 'order', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Task Stage',
        'verbose_name_plural': 'Project Task Stages'
    }

    def __str__(self):
        return self.name
    
    
class ProjectRole(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'project_role',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Role',
        'verbose_name_plural': 'Project Roles'
    }

    def __str__(self):
        return self.name
    
class ProjectAttachment(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    file = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    user_upload = DynamicField(null=True)
    project = DynamicField(null=True)
    current_stage = DynamicField(null=True)
    is_active = BooleanField(default=True)
    
    meta = {
        'collection': 'project_attachment',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Attachment',
        'verbose_name_plural': 'Project Attachments'
    }

    def __str__(self):
        return self.name
    
class ProjectMaterial(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(null=True)
    quantity = IntField(default=0)
    cost = FloatField(default=0.0)
    store = StringField(null=True)
    notes = StringField(null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    user_reporter = DynamicField(null=True)
    project = DynamicField(null=True)
    is_active = BooleanField(default=True)
    
    meta = {
        'collection': 'project_material',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Material',
        'verbose_name_plural': 'Project Materials'
    }

    def __str__(self):
        return self.name
    

class ProjectView(Document):
    meta = {
        'collection': 'project_view',
        'strict': False,   
    }
    
    
class Project(Document):
    name = StringField(max_length=255, required=True)
    number = StringField(max_length=255, required=True)
    description = StringField(null=True)
    sales_order = DynamicField(null=True)
    reference_number = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    stage_history = ListField(DynamicField(), default=list, null=True)
    user_reporter = DynamicField(null=True)
    users_assignees = ListField(DynamicField(), default=list, null=True)
    user_installer = DynamicField(null=True)
    start_date = DateTimeField(null=True)
    end_date = DateTimeField(null=True)
    duration = IntField(default=0, null=True)  # Duration in days
    current_stage = DynamicField(null=True)
    project_attachments = ListField(DynamicField(), default=list, null=True)
    project_tasks = ListField(DynamicField(), default=list, null=True)
    project_history = ListField(DynamicField(), default=list, null=True)
    address = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    has_permission = BooleanField(default=False, null=True)
    user_manager = DynamicField(null=True)
    project_comments = ListField(DynamicField(), default=list, null=True)
    project_default_tasks = ListField(DynamicField(), default=list, null=True)
    all_products_marked = BooleanField(default=False)
    all_windows_marked = BooleanField(default=False)
    all_screw_marked = BooleanField(default=False)
    all_trash_marked = BooleanField(default=False)
    feedback = StringField(null=True)
    work_scope = StringField(null=True)
    project_materials = ListField(DynamicField(), default=list, null=True)
    project_guide_products = ListField(DynamicField(), default=list, null=True)
    project_materials_other_notes = StringField(null=True)
    inspection_date = DateTimeField(null=True)
    inspection_end_date = DateTimeField(null=True)
    inspection_duration = IntField(default=0, null=True)  # Duration in days
    inspection_is_part_days = BooleanField(default=False, null=True)
    finish_permission_date = DateTimeField(null=True)
    finish_permission_end_date = DateTimeField(null=True)
    finish_permission_duration = IntField(default=0, null=True)  # Duration in days
    finish_permission_is_part_days = BooleanField(default=False, null=True)
    is_part_days = BooleanField(default=False, null=True)
    phone = StringField(max_length=255, null=True)
    duration = IntField(default=0, null=True)  # Duration in days
    work_orders = ListField(DynamicField(), default=list, null=True)
    
    meta = {
        'collection': 'project',
        'indexes': [
            'created_time', 
            'is_active', 
            'user_reporter', 
            'start_date',
        ],
        'verbose_name': 'Project',
        'verbose_name_plural': 'Projects'
    }

    def __str__(self):
        return self.name
    
    
class ProjectUser(Document):
    user = DynamicField(required=True)
    project_permissions = ListField(DynamicField(), default=list, null=True)
    project = DynamicField(required=True)
    role = DynamicField(required=True)
    is_active = BooleanField(default=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    meta = {
        'collection': 'project_user',
        'indexes': [
            'user', 'role', 'is_active', 'created_time', 'last_modified_time'
        ],
        'verbose_name': 'Project User',
        'verbose_name_plural': 'Project Users'
    }

    def __str__(self):
        return f"{self.project.name} - {self.username}"
    

class ProjectNotification(Document):
    module = StringField(max_length=255, null=True)
    info = StringField(null=True)
    info_id = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    type = StringField(max_length=255, null=True, default='load')
    meta = {
        'collection': 'project_notification',
        'indexes': [
            'module', 'info', 'created_time', 'last_modified_time', 'type', 'info_id'
        ],
        'verbose_name': 'Project Notification',
        'verbose_name_plural': 'Project Notifications'
    }
    def __str__(self):
        return self.info
    
class ProjectNotificationUser(Document):
    notification = DynamicField(required=True)
    username = StringField(max_length=255, required=True)
    user = DynamicField(required=True)
    read = BooleanField(default=False)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    meta = {
        'collection': 'project_notification_user',
        'indexes': [
            'username', 'read', 'created_time', 'last_modified_time'
        ],
        'verbose_name': 'Project Notification User',
        'verbose_name_plural': 'Project Notification Users'
    }
    def __str__(self):
        return f'{self.username} - {self.notification.info}'
    
    
class ProjectDefaultTask(Document):
    name = StringField(max_length=255, required=True)
    number = StringField(max_length=255, null=True)
    description = StringField(max_length=255, null=True)
    order = IntField(default=0)
    project_stage = DynamicField(required=True)
    project_stage_status = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    is_active = BooleanField(default=True)
    has_attachments = BooleanField(default=False)
    meta = {
        'collection': 'project_default_task',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active', 'number'
        ],
        'verbose_name': 'Project Default Task',
        'verbose_name_plural': 'Project Default Tasks'
    }

    def __str__(self):
        return self.name
    

class ProjetDefaultTaskInfo(Document):
    project_default_task = DynamicField(required=True)
    project = DynamicField(required=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    status = StringField(max_length=255, null=True)
    users_assignees = ListField(DynamicField(), default=list, null=True)
    percentage = FloatField(default=0.0)
    is_active = BooleanField(default=True)
    meta = {
        'collection': 'project_default_task_info',
        'indexes': [
            'project_default_task', 'created_time', 'last_modified_time', 'is_active', 'status', 'percentage'
        ],
        'verbose_name': 'Project Default Task Info',
        'verbose_name_plural': 'Project Default Task Infos'
    }

    def __str__(self):
        return self.project_default_task.name
    
    
class ProjectTask(Document):
    name = StringField(max_length=255, required=True)
    number = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    project = DynamicField(required=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    start_date = DateTimeField(null=True)
    end_date = DateTimeField(null=True)
    users_assignees = ListField(DynamicField(), default=list, null=True)
    user_reporter = DynamicField(null=True)
    current_stage = DynamicField(null=True)
    is_active = BooleanField(default=True)
    priority = StringField(max_length=255, null=True)
    project_task_attachments = ListField(DynamicField(), default=list, null=True)
    project_task_history = ListField(DynamicField(), default=list, null=True)
    project_task_comments = ListField(DynamicField(), default=list, null=True)
    meta = {
        'collection': 'project_task',
        'indexes': [
            'name', 'number', 'created_time', 'last_modified_time', 'is_active', 'priority'
        ],
        'verbose_name': 'Project Task',
        'verbose_name_plural': 'Project Tasks'
    }

    def __str__(self):
        return self.name
    
class ProjectTaskAttachment(Document):
    name = StringField(max_length=255, required=True)
    file = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    description = StringField(max_length=255, null=True)
    due_project_stage = DynamicField(null=True)
    user_upload = DynamicField(null=True)
    project_task = DynamicField(null=True)
    is_active = BooleanField(default=True)
    meta = {
        'collection': 'project_task_attachment',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Task Attachment',
        'verbose_name_plural': 'Project Task Attachments'
    }
    def __str__(self):
        return self.name
    
    
class ProjectTaskComment(Document):
    comment = StringField(required=True)
    user_reporter = DynamicField(required=True, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    project = DynamicField(required=True)
    project_default_task = DynamicField(null=True)
    project_default_task_comment_attachments = ListField(DynamicField(), default=list, null=True)
    is_active = BooleanField(default=True)
    meta = {
        'collection': 'project_task_comment',
        'indexes': [
            'comment', 'user_reporter', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Task Comment',
        'verbose_name_plural': 'Project Task Comments'
    }
    def __str__(self):
        return self.comment
    
class ProjectTaskCommentAttachment(Document):
    name = StringField(max_length=255, required=True)
    file = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    user_upload = DynamicField(null=True)
    project_task_comment = DynamicField(null=True)
    is_active = BooleanField(default=True)
    meta = {
        'collection': 'project_task_comment_attachment',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'user_upload', 'project_task_comment', 'is_active'
        ],
        'verbose_name': 'Project Task Comment Attachment',
        'verbose_name_plural': 'Project Task Comment Attachments'
    }
    def __str__(self):
        return self.name
    
class ProjectTaskHistory(Document):
    project_task = DynamicField(required=True)
    user_involved = DynamicField(required=True)
    project_stage_initial = DynamicField(null=True)
    project_stage_final = DynamicField(null=True)
    initial_date = DateTimeField(null=True)
    final_date = DateTimeField(null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    meta = {
        'collection': 'project_task_history',
        'indexes': [
            'created_time', 'last_modified_time'
        ],
        'verbose_name': 'Project Task History',
        'verbose_name_plural': 'Project Task Histories'
    }
    def __str__(self):
        return self.project_task.name
    

class ProjectPermissions(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'project_permissions',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Permission',
        'verbose_name_plural': 'Project Permissions'
    }

    def __str__(self):
        return self.name

class ProjectTrackingView(Document):
    action         = StringField()     
    created_time   = DateTimeField()
    managed_data   = DynamicField()
    user_reporter  = DynamicField()
    
    meta = {
        'collection': 'project_tracking_view',
        'strict': False,   
    }   
    
class ProjectTracking(Document):
    user_reporter = DynamicField(required=True)
    action = StringField(required=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    managed_data = DynamicField(null=True)
    
    meta = {
        'collection': 'project_tracking',
        'indexes': [
            'user_reporter', 'action', 'created_time'
        ],
        'verbose_name': 'Project Tracking',
        'verbose_name_plural': 'Project Trackings'
    }
    
    def __str__(self):
        return self.action
    
class ProjectDefaultGuideProduct(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    price = FloatField(default=0.0)
    is_active = BooleanField(default=True)
    order = IntField(default=0)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'project_default_guide_product',
        'ordering': ['order'],
        'indexes': [
            'name', 'order', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Default Guide Product',
        'verbose_name_plural': 'Project Default Guide Products'
    }

    def __str__(self):
        return self.name
    
    
class ProjectReminder(Document):
    user_reporter = DynamicField(required=True)
    project = DynamicField(required=True)
    project_default_task = DynamicField(null=True)
    notes = StringField(null=True)
    date = DateTimeField(null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    is_active = BooleanField(default=True)
    
    meta = {
        'collection': 'project_remainder',
        'indexes': [
            'user_reporter', 'project', 'created_time', 'last_modified_time', 'is_active', 'project_default_task'
        ],
        'verbose_name': 'Project Remainder',
        'verbose_name_plural': 'Project Reminders'
    }

    def __str__(self):
        return self.project.name
    
    
class ProjectDefaultMaterial(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    price = FloatField(default=0.0)
    quantity = IntField(default=0)
    is_packaged = BooleanField(default=False, null=True)
    package_quantity = IntField(default=0, null=True)
    default_guide_products = ListField(DynamicField(), default=list, null=True)
    is_active = BooleanField(default=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'project_default_material',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active', 'is_packaged', 'package_quantity'
        ],
        'verbose_name': 'Project Default Material',
        'verbose_name_plural': 'Project Default Materials'
    }

    def __str__(self):
        return self.name
    
class ProjectCalendarNotes(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(null=True)
    start_date = DateTimeField(null=True)
    end_date = DateTimeField(null=True)
    duration = IntField(default=0, null=True)
    user_manager = DynamicField(null=True)
    user_installer = DynamicField(null=True)
    user_assignees = ListField(DynamicField(), default=list, null=True)
    user_reporter = DynamicField(null=True)
    associated_events = ListField(DynamicField(), default=list, null=True)
    is_active = BooleanField(default=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'project_calendar_notes',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Project Calendar Note',
        'verbose_name_plural': 'Project Calendar Notes'
    }

    def __str__(self):
        return self.name
    
    
class ProjectProfitReport(Document):
    project_id = StringField(required=True)
    project_info = DynamicField(required=True)
    project_amount = FloatField(default=0.0)
    installation_amount = FloatField(default=0.0)
    installation_cost = FloatField(default=0.0)
    installation_profit = FloatField(default=0.0)
    notes = StringField(null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'project_profit_report',
        'indexes': [
            'project_id', 'created_time', 'last_modified_time'
        ],
        'verbose_name': 'Project Profit Report',
        'verbose_name_plural': 'Project Profit Reports'
    }

    def __str__(self):
        return f'Profit Report for {self.project.name}'