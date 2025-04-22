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
    user_reporter = DynamicField(required=True)
    user_manager = DynamicField(null=True)
    phone = StringField(max_length=255, null=True)
    address = StringField(null=True)
    color = StringField(max_length=255, null=True)
    marks = ListField(DynamicField(), default=list, null=True)
    is_active = BooleanField(default=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'measurement',
        'indexes': [
            'number',
            'sales_order',
            'customer',
            'user_reporter',
            'user_manager',
            'phone',
            'address',
            'color',
            'marks',
            'is_active',
            'created_time',
            'last_modified_time',
        ],
        'verbose_name': 'Measurement',
        'verbose_name_plural': 'Measurements'
    }
    
    def __str__(self):
        return self.customer