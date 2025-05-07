import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from .models import (
    Service,
    ServiceIssue,
    ServiceStage,
    ServiceDefaultTask,
)
from api_authorization.models import LoginUser
from api_projects.data_util import serialize_datetime, dynamic_field_to_json
from bson import ObjectId
from django.utils import timezone
from datetime import timezone as dt_timezone

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    

class ServiceIssueType(MongoengineObjectType):
    class Meta:
        model = ServiceIssue
    
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
        

class ServiceStageType(MongoengineObjectType):
    class Meta:
        model = ServiceStage
        
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
        

class ServiceDefaultTaskType(MongoengineObjectType):
    class Meta:
        model = ServiceDefaultTask
    service_stage = GenericScalar()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    
    def resolve_service_stage(self, info):
        service_stage = self.service_stage or {}
        service_stage = serialize_datetime(service_stage)
        return dynamic_field_to_json(service_stage)


class ServiceType(MongoengineObjectType):
    class Meta:
        model = Service
        
    client = GenericScalar()
    sales_order = GenericScalar()
    user_reporter = GenericScalar()
    issued_products = GenericScalar()
    stage_history = GenericScalar()
    users_assignees = GenericScalar()
    current_stage = GenericScalar()
    service_attachments = GenericScalar()
    service_history = GenericScalar()
    service_comments = GenericScalar()
    service_default_tasks = GenericScalar()
    user_manager = GenericScalar()
    users_service_team = GenericScalar()
    service_place = GenericScalar()
    created_by = GenericScalar()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    
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
    
    def resolve_issued_products(self, info):
        issued_products = self.issued_products or []
        issued_products = serialize_datetime(issued_products)
        return dynamic_field_to_json(issued_products)
    
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
    
    def resolve_users_service_team(self, info):
        users_service_team = self.users_service_team or []
        users_service_team = serialize_datetime(users_service_team)
        return dynamic_field_to_json(users_service_team)
    
    def resolve_service_place(self, info):
        service_place = self.service_place or {}
        service_place = serialize_datetime(service_place)
        return dynamic_field_to_json(service_place)
    
    def resolve_created_by(self, info):
        created_by = self.created_by or {}
        created_by = serialize_datetime(created_by)
        return dynamic_field_to_json(created_by)
    

class Query(graphene.ObjectType):
    all_services = graphene.List(ServiceType)
    all_service_issues = graphene.List(ServiceIssueType)
    all_service_stages = graphene.List(ServiceStageType)
    all_service_default_tasks = graphene.List(ServiceDefaultTaskType)
    service_by_id = graphene.Field(
        ServiceType, 
        id=graphene.String(required=True)
    )
    
    def resolve_all_services(self, info):
        return Service.objects.all()
    
    def resolve_all_service_issues(self, info):
        return ServiceIssue.objects.all()
    
    def resolve_all_service_stages(self, info):
        return ServiceStage.objects.all()
    
    def resolve_all_service_default_tasks(self, info):
        return ServiceDefaultTask.objects.all()

    def resolve_service_by_id(self, info, id):
        try:
            return Service.objects.get(id=ObjectId(id))
        except Exception:
            return None

schema = graphene.Schema(query=Query)
