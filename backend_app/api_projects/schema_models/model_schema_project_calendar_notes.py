import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from api_projects.models import (
    ProjectCalendarNotes,
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone
@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    

class ProjectCalendarNotesType(MongoengineObjectType):
    class Meta:
        model = ProjectCalendarNotes
        
    created_time = graphene.String()
    last_modified_time = graphene.String()
    user_assignees = JSONDateTime()
    user_installer = JSONDateTime()
    user_manager = JSONDateTime()
    user_reporter = JSONDateTime()
    associated_events = JSONDateTime()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_user_assignees(self, info):
        return self.user_assignees or []
    
    def resolve_user_installer(self, info):
        return self.user_installer or {}
    
    def resolve_user_manager(self, info):
        return self.user_manager or {}
    
    def resolve_user_reporter(self, info):
        return self.user_reporter or {}
    
    def resolve_associated_events(self, info):
        return self.associated_events or []