import mongoengine
from mongoengine import (
    Document, 
    StringField, 
    BooleanField, 
    DateTimeField, 
)
    
class UserRole(Document):
    name = StringField(max_length=150, unique=True, required=True)
    created_time = DateTimeField(default=mongoengine.fields.DateTimeField().default)
    last_modified_time = DateTimeField(default=mongoengine.fields.DateTimeField().default)
    description = StringField(required=False)
    is_active = BooleanField(default=True)

    meta = {
        'collection': 'user_role',
        'indexes': ['name'],
        'ordering': ['name'],
        'verbose_name': 'User Role',
        'verbose_name_plural': 'User Roles',
    }
    
    def __str__(self):
        return self.name