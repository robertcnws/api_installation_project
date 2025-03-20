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
    client = DynamicField(required=True)
    sales_order = DynamicField(null=True)
    troubled_products = ListField(DynamicField(), null=True)
    troubled_info = StringField(null=True)
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
    service_comments = ListField(DynamicField(), default=list, null=True)
    service_default_tasks = ListField(DynamicField(), default=list, null=True)
    
    meta = {
        'collection': 'service',
        'indexes': [
            'client',
            'sales_order',
            'user_reporter',
            'created_time',
            'last_modified_time',
            'troubled_products',
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