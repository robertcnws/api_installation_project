import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from api_projects.models_extra import (
    TaskTimer,
)
from api_projects.schema_models.json_datetime import datetime_to_timezone, JSONDateTime

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )

class TaskTimerType(MongoengineObjectType):
    class Meta:
        model = TaskTimer
    
    start_time = graphene.String()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    entity_info = JSONDateTime()
    
    def resolve_start_time(self, info):
        dt = self.start_time
        return datetime_to_timezone(dt)
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_entity_info(self, info):
        return self.entity_info or {}