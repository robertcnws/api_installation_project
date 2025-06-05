import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from api_services.models import (
    Service,
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
class ServiceType(MongoengineObjectType):
    class Meta:
        model = Service
        
    client = JSONDateTime()
    sales_order = JSONDateTime()
    user_reporter = JSONDateTime()
    issued_products = JSONDateTime()
    stage_history = JSONDateTime()
    users_assignees = JSONDateTime()
    current_stage = JSONDateTime()
    service_attachments = JSONDateTime()
    service_history = JSONDateTime()
    service_comments = JSONDateTime()
    service_default_tasks = JSONDateTime()
    user_manager = JSONDateTime()
    users_service_team = JSONDateTime()
    service_place = JSONDateTime()
    created_by = JSONDateTime()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    start_date = graphene.String()
    end_date = graphene.String()
    duration = graphene.Int()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt) if dt else None
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt) if dt else None
    
    def resolve_start_date(self, info):
        dt = self.start_date
        return datetime_to_timezone(dt) if dt else None
    
    def resolve_end_date(self, info):
        dt = self.end_date
        return datetime_to_timezone(dt) if dt else None
    
    def resolve_client(self, info):
        return self.client or {}
    
    def resolve_sales_order(self, info):
        return self.sales_order or {}
    
    def resolve_user_reporter(self, info):
        return self.user_reporter or {}
    
    def resolve_issued_products(self, info):
        return self.issued_products or []
    
    def resolve_stage_history(self, info):
        return self.stage_history or []
    
    def resolve_users_assignees(self, info):
        return self.users_assignees or []
    
    def resolve_current_stage(self, info):
        return self.current_stage or {}
    
    def resolve_service_attachments(self, info):
        return self.service_attachments or []
    
    def resolve_service_history(self, info):
        return self.service_history or []
    
    def resolve_service_comments(self, info):
        return self.service_comments or []
    
    def resolve_service_default_tasks(self, info):
        return self.service_default_tasks or []
    
    def resolve_user_manager(self, info):
        return self.user_manager or {}
    
    def resolve_users_service_team(self, info):
        return self.users_service_team or []
    
    def resolve_service_place(self, info):
        return self.service_place or {}
    
    def resolve_created_by(self, info):
        return self.created_by or {}
    
    def resolve_duration(self, info):
        return self.duration if self.duration is not None else 0