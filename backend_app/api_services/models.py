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

class Service(Document):
    number = StringField(max_length=255, required=True)
    name = StringField(max_length=255, required=True)
    version = IntField(default=1, null=True)
    client = DynamicField(null=True)
    sales_order = DynamicField(null=True)
    reference_number = StringField(max_length=255, null=True)
    phone = StringField(max_length=255, null=True)
    issued_products = ListField(DynamicField(), null=True)
    user_reporter = DynamicField(null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    stage_history = ListField(DynamicField(), default=list, null=True)
    users_assignees = ListField(DynamicField(), default=list, null=True)
    start_date = DateTimeField(null=True)
    end_date = DateTimeField(null=True)
    current_stage = DynamicField(null=True)
    service_attachments = ListField(DynamicField(), default=list, null=True)
    service_history = ListField(DynamicField(), default=list, null=True)
    address = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    user_manager = DynamicField(null=True)
    users_service_team = ListField(DynamicField(), default=list, null=True)
    service_comments = ListField(DynamicField(), default=list, null=True)
    service_default_tasks = ListField(DynamicField(), default=list, null=True)
    service_type = StringField(max_length=255, null=True)
    service_place = DynamicField(null=True)
    service_notes = StringField(null=True)
    
    meta = {
        'collection': 'service',
        'indexes': [
            'number',
            'name',
            'client',
            'sales_order',
            'user_reporter',
            'created_time',
            'last_modified_time',
            'issued_products',
            'current_stage',
            'users_assignees',
            'start_date',
            'end_date',
            'service_attachments',
            'service_history',
            'address',
            'is_active',
            'user_manager',
            'service_comments',
            'service_default_tasks',
        ],
        'verbose_name': 'Service',
        'verbose_name_plural': 'Services'
    }
    
    def __str__(self):
        return self.action
    
    
class ServiceIssue(Document):
    user_reporter = DynamicField(required=True)
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'service_issue',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Service Issue',
        'verbose_name_plural': 'Service Issues'
    }

    def __str__(self):
        return self.name
    
    
class ServiceStage(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    order = IntField(default=0)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'service_stage',
        'ordering': ['order'],
        'indexes': [
            'name', 'order', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Service Stage',
        'verbose_name_plural': 'Service Stages'
    }

    def __str__(self):
        return self.name
    
    
class ServiceDefaultTask(Document):
    name = StringField(max_length=255, required=True)
    number = StringField(max_length=255, null=True)
    description = StringField(max_length=255, null=True)
    order = IntField(default=0)
    service_stage = DynamicField(required=True)
    service_stage_status = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    is_active = BooleanField(default=True)
    has_attachments = BooleanField(default=False)
    meta = {
        'collection': 'service_default_task',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active', 'service_stage', 'service_stage_status', 'number'
        ],
        'verbose_name': 'Service Default Task',
        'verbose_name_plural': 'Service Default Tasks'
    }

    def __str__(self):
        return self.name
    
    
class ServiceAttachment(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    file = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    user_upload = DynamicField(null=True)
    service = DynamicField(null=True)
    current_stage = DynamicField(null=True)
    service_default_task = DynamicField(null=True)
    attachment_type = StringField(max_length=255, null=True)
    is_active = BooleanField(default=True)
    
    meta = {
        'collection': 'project_attachment',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active', 'user_upload', 'service', 'current_stage'
        ],
        'verbose_name': 'Project Attachment',
        'verbose_name_plural': 'Project Attachments'
    }

    def __str__(self):
        return self.name