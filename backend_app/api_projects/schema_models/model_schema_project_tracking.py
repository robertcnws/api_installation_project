import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from api_projects.models import (
    ProjectTracking,
    ProjectTrackingView,
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    
class ProjectTrackingType(MongoengineObjectType):
    class Meta:
        model = ProjectTracking
    created_time = graphene.String()
    managed_data = JSONDateTime()
    user_reporter = JSONDateTime()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_managed_data(self, info):
        return self.managed_data or {}
    
    def resolve_user_reporter(self, info):
        return self.user_reporter or {}
    
class ProjectTrackingViewType(MongoengineObjectType):
    class Meta:
        model = ProjectTrackingView
        strict = False
        
    action = graphene.String()
    created_time = graphene.String()
    managed_data = JSONDateTime()
    user_reporter = JSONDateTime()
    
    def resolve_action(self, info):
        return self._data.get('action', None)
    
    def resolve_created_time(self, info):
        dt = self._data.get('created_time', None)
        return datetime_to_timezone(dt)
    
    def resolve_managed_data(self, info):
        return self._data.get('managed_data', None) or {}
    
    def resolve_user_reporter(self, info):
        return self._data.get('user_reporter', None) or {}
    

    
    
