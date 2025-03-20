import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from .models import (
    Service,
    ServiceIssue,
)
from api_authorization.models import LoginUser
from api_projects.data_util import serialize_datetime, dynamic_field_to_json
from bson import ObjectId

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    

class ServiceIssueType(MongoengineObjectType):
    class Meta:
        model = ServiceIssue


class ServiceType(MongoengineObjectType):
    class Meta:
        model = Service
        
    client = GenericScalar()
    sales_order = GenericScalar()
    user_reporter = GenericScalar()
    troubled_products = GenericScalar()
    stage_history = GenericScalar()
    users_assignees = GenericScalar()
    current_stage = GenericScalar()
    service_attachments = GenericScalar()
    service_history = GenericScalar()
    service_comments = GenericScalar()
    service_default_tasks = GenericScalar()
    
    
    def resolve_client(self, info):
        client = self.client or {}
        client = serialize_datetime(client)
        return dynamic_field_to_json(client)
    
    def resolve_sales_order(self, info):
        sales_order = self.sales_order or {}
        sales_order = serialize_datetime(sales_order)
        return dynamic_field_to_json(sales_order)
    
    def resolve_user_reporter(self, info):
        user_reporter = self.user_reporter or {}
        user_reporter = serialize_datetime(user_reporter)
        return dynamic_field_to_json(user_reporter)
    
    def resolve_troubled_products(self, info):
        troubled_products = self.troubled_products or []
        troubled_products = serialize_datetime(troubled_products)
        return dynamic_field_to_json(troubled_products)
    
    def resolve_stage_history(self, info):
        stage_history = self.stage_history or []
        stage_history = serialize_datetime(stage_history)
        return dynamic_field_to_json(stage_history)
    
    def resolve_users_assignees(self, info):
        users_assignees = self.users_assignees or []
        users_assignees = serialize_datetime(users_assignees)
        return dynamic_field_to_json(users_assignees)
    
    def resolve_current_stage(self, info):
        current_stage = self.current_stage or {}
        current_stage = serialize_datetime(current_stage)
        return dynamic_field_to_json(current_stage)
    
    def resolve_service_attachments(self, info):
        service_attachments = self.service_attachments or []
        service_attachments = serialize_datetime(service_attachments)
        return dynamic_field_to_json(service_attachments)
    
    def resolve_service_history(self, info):
        service_history = self.service_history or []
        service_history = serialize_datetime(service_history)
        return dynamic_field_to_json(service_history)
    
    def resolve_service_comments(self, info):
        service_comments = self.service_comments or []
        service_comments = serialize_datetime(service_comments)
        return dynamic_field_to_json(service_comments)
    
    def resolve_service_default_tasks(self, info):
        service_default_tasks = self.service_default_tasks or []
        service_default_tasks = serialize_datetime(service_default_tasks)
        return dynamic_field_to_json(service_default_tasks)
    
    def resolve_user_manager(self, info):
        user_manager = self.user_manager or {}
        user_manager = serialize_datetime(user_manager)
        return dynamic_field_to_json(user_manager)
    
    

class Query(graphene.ObjectType):
    all_services = graphene.List(ServiceType)
    all_service_issues = graphene.List(ServiceIssueType)
    service_by_id = graphene.Field(
        ServiceType, 
        id=graphene.String(required=True)
    )
    
    def resolve_all_services(self, info):
        return Service.objects.all()
    
    def resolve_all_service_issues(self, info):
        return ServiceIssue.objects.all()

    def resolve_service_by_id(self, info, id):
        try:
            return Service.objects.get(id=ObjectId(id))
        except Exception:
            return None

schema = graphene.Schema(query=Query)
