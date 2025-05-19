import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from api_projects.models import (
    ProjectNotification,
    ProjectNotificationUser,
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
        
class ProjectNotificationType(MongoengineObjectType):
    class Meta:
        model = ProjectNotification
    
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
        
class ProjectNotificationUserType(MongoengineObjectType):
    class Meta:
        model = ProjectNotificationUser
        
    notification = JSONDateTime()
    user = JSONDateTime()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_notification(self, info):
        return self.notification or {}
    
    def resolve_user(self, info):
        return self.user or {}
        

class ProjectNotificationUsersPaginated(graphene.ObjectType):
    count = graphene.Int()
    page = graphene.Int()
    page_size = graphene.Int()
    results = graphene.List(ProjectNotificationUserType)