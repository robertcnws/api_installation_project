import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from .models import (
    Measurement,
)
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


class MeasurementType(MongoengineObjectType):
    class Meta:
        model = Measurement
    
    sales_order = GenericScalar()
    customer = GenericScalar()
    service = GenericScalar()
    project = GenericScalar()
    user_reporter = GenericScalar()
    user_manager = GenericScalar()
    marks = GenericScalar()
    first_date = graphene.String()
    check_date = graphene.String()
    first_assignee = GenericScalar()
    check_assignee = GenericScalar()
    measurement_attachments = GenericScalar()
    measurement_comments = GenericScalar()
    color = GenericScalar()
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
    
    def resolve_first_date(self, info):
        dt = self.first_date
        if dt is not None:
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, dt_timezone.utc) 
            local_dt = timezone.localtime(dt)  
            return local_dt.strftime('%Y-%m-%d %H:%M:%S')
        return None
    
    def resolve_check_date(self, info):
        dt = self.check_date
        if dt is not None:
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, dt_timezone.utc) 
            local_dt = timezone.localtime(dt)  
            return local_dt.strftime('%Y-%m-%d %H:%M:%S')
        return None
    
    def resolve_sales_order(self, info):
        sales_order = self.sales_order or {}
        sales_order = serialize_datetime(sales_order)
        return dynamic_field_to_json(sales_order)
    
    def resolve_customer(self, info):
        customer = self.customer or {}
        customer = serialize_datetime(customer)
        return dynamic_field_to_json(customer)
    
    def resolve_service(self, info):
        service = self.service or {}
        service = serialize_datetime(service)
        return dynamic_field_to_json(service)
    
    def resolve_project(self, info):
        project = self.project or {}
        project = serialize_datetime(project)
        return dynamic_field_to_json(project)
    
    def resolve_user_reporter(self, info):
        user_reporter = self.user_reporter or {}
        user_reporter = serialize_datetime(user_reporter)
        return dynamic_field_to_json(user_reporter)
    
    def resolve_user_manager(self, info):
        user_manager = self.user_manager or {}
        user_manager = serialize_datetime(user_manager)
        return dynamic_field_to_json(user_manager)
    
    def resolve_marks(self, info):
        marks = self.marks or []
        marks = serialize_datetime(marks)
        return dynamic_field_to_json(marks)
    
    def resolve_first_assignee(self, info):
        first_assignee = self.first_assignee or {}
        first_assignee = serialize_datetime(first_assignee)
        return dynamic_field_to_json(first_assignee)
    
    def resolve_check_assignee(self, info):
        check_assignee = self.check_assignee or {}
        check_assignee = serialize_datetime(check_assignee)
        return dynamic_field_to_json(check_assignee)
    
    def resolve_measurement_attachments(self, info):
        measurement_attachments = self.measurement_attachments or []
        measurement_attachments = serialize_datetime(measurement_attachments)
        return dynamic_field_to_json(measurement_attachments)
    
    def resolve_color(self, info):
        color = self.color or {}
        color = serialize_datetime(color)
        return dynamic_field_to_json(color)
    
    def resolve_measurement_comments(self, info):
        measurement_comments = self.measurement_comments or []
        measurement_comments = serialize_datetime(measurement_comments)
        return dynamic_field_to_json(measurement_comments)
    

class Query(graphene.ObjectType):
    all_measurements = graphene.List(MeasurementType)
    measurement_by_id = graphene.Field(
        MeasurementType, 
        id=graphene.String(required=True)
    )
    
    def resolve_all_measurements(self, info):
        return Measurement.objects.all()

    def resolve_measurement_by_id(self, info, id):
        try:
            return Measurement.objects.get(id=ObjectId(id))
        except Exception:
            return None
        

schema = graphene.Schema(query=Query)
