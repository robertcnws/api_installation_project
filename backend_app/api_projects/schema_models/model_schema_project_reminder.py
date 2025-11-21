import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from api_projects.models import (
    ProjectReminder,
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
        

class ProjectRemainder(MongoengineObjectType):
    class Meta:
        model = ProjectReminder
        
    created_time = graphene.String()
    last_modified_time = graphene.String()
    project = JSONDateTime()
    project_default_task = JSONDateTime()
    user_reporter = JSONDateTime()
    
    def resolve_project(self, info):
        return self.project or {}
    
    def resolve_project_default_task(self, info):
        return self.project_default_task or {}
    
    def resolve_user_reporter(self, info):
        return self.user_reporter or {}
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    

    