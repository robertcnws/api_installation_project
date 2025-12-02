import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from api_projects.models import (
    ProjectInstallationCrew,
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone
@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    

class ProjectInstallationCrewType(MongoengineObjectType):
    class Meta:
        model = ProjectInstallationCrew
        
    created_time = graphene.String()
    last_modified_time = graphene.String()
    users_installers = JSONDateTime()
    users_helpers = JSONDateTime()
    user_reporter = JSONDateTime()
    unit = JSONDateTime()
    type_crew = JSONDateTime()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_users_installers(self, info):
        return self.users_installers or []
    
    def resolve_users_helpers(self, info):
        return self.users_helpers or []
    
    def resolve_user_reporter(self, info):
        return self.user_reporter or {}
    
    def resolve_unit(self, info):
        return self.unit or {}
    
    def resolve_type_crew(self, info):
        return self.type_crew or {}