import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from api_projects.models import (
    ProjectProfitReport
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
        
class ProjectProfitReportType(MongoengineObjectType):
    class Meta:
        model = ProjectProfitReport
    
    created_time = graphene.String()
    last_modified_time = graphene.String()
    project_info = JSONDateTime()
    installation_cost = graphene.Float()
    installation_profit = graphene.Float()
    
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_project_info(self, info):
        return self.project_info or {}
    
    def resolve_installation_cost(self, info):
        if self.working_type == "onhouse":
            return self.installation_cost_onhouse
        else:
            return self.installation_cost_subcontractor
        
    def resolve_installation_profit(self, info):
        if self.working_type == "onhouse":
            return self.installation_profit_onhouse
        else:
            return self.installation_profit_subcontractor