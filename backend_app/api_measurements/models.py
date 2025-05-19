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
    measurement_comments = ListField(DynamicField(), default=list, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    general_notes = StringField(null=True)
    
    meta = {
        'collection': 'measurement',
        'indexes': [
            'number',
            'user_reporter',
            'is_active',
            'created_time',
            'last_modified_time',
            'first_date',
            'check_date',
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
    

class MeasurementComment(Document):
    comment = StringField(required=True)
    user_reporter = DynamicField(required=True, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    measurement = DynamicField(required=True)
    measurement_default_task = DynamicField(null=True)
    measurement_default_task_comment_attachments = ListField(DynamicField(), default=list, null=True)
    is_active = BooleanField(default=True)
    meta = {
        'collection': 'measurement_comment',
        'indexes': [
            'comment', 'user_reporter', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Measurement Comment',
        'verbose_name_plural': 'Measurement Comments'
    }
    def __str__(self):
        return self.comment