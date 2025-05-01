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
                        )

from django.utils import timezone

class Measurement(Document):
    number = StringField(max_length=255, required=True)
    sales_order = DynamicField(null=True)
    customer = DynamicField(null=True)
    service = DynamicField(null=True)
    project = DynamicField(null=True)
    user_reporter = DynamicField(required=True)
    user_manager = DynamicField(null=True)
    phone = StringField(max_length=255, null=True)
    address = StringField(null=True)
    color = DynamicField(null=True)
    marks = ListField(DynamicField(), default=list, null=True)
    is_active = BooleanField(default=True)
    first_date = DateTimeField(null=True)
    check_date = DateTimeField(null=True)
    first_assignee = DynamicField(null=True)
    check_assignee = DynamicField(null=True)
    measurement_attachments = ListField(DynamicField(), default=list, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    general_notes = StringField(null=True)
    
    meta = {
        'collection': 'measurement',
        'indexes': [
            'number',
            'sales_order',
            'customer',
            'service',
            'project',
            'user_reporter',
            'user_manager',
            'phone',
            'address',
            'color',
            'marks',
            'is_active',
            'created_time',
            'last_modified_time',
            'general_notes',
            'first_date',
            'check_date',
            'first_assignee',
            'check_assignee',
        ],
        'verbose_name': 'Measurement',
        'verbose_name_plural': 'Measurements'
    }
    
    def __str__(self):
        return self.number
    
    
class MesurementAttachment(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    file = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    user_upload = DynamicField(null=True)
    measurement = DynamicField(null=True)
    is_active = BooleanField(default=True)
    
    meta = {
        'collection': 'measurement_attachment',
        'indexes': [
            'name', 'created_time', 'last_modified_time', 'is_active', 'user_upload', 'measurement'
        ],
        'verbose_name': 'Measurement Attachment',
        'verbose_name_plural': 'Mesurement Attachments'
    }

    def __str__(self):
        return self.name