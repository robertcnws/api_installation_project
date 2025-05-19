import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from api_projects.models import (
    ProjectDefaultMaterial,
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone
@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    

class ProjectDefaultMaterialType(MongoengineObjectType):
    class Meta:
        model = ProjectDefaultMaterial
        
    created_time = graphene.String()
    last_modified_time = graphene.String()
    default_guide_products = JSONDateTime()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_default_guide_products(self, info):
        return self.default_guide_products