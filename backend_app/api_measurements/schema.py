import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from .models import (
    Measurement,
)
from bson import ObjectId
from django.utils import timezone
from datetime import timezone as dt_timezone
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone, serialize_datetime


@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )


class MeasurementType(MongoengineObjectType):
    class Meta:
        model = Measurement
    
    sales_order = JSONDateTime()
    customer = JSONDateTime()
    service = JSONDateTime()
    project = JSONDateTime()
    user_reporter = JSONDateTime()
    user_manager = JSONDateTime()
    marks = JSONDateTime()
    first_date = graphene.String()
    check_date = graphene.String()
    first_assignee = JSONDateTime()
    check_assignee = JSONDateTime()
    measurement_attachments = JSONDateTime()
    measurement_comments = JSONDateTime()
    color = JSONDateTime()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    status = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_first_date(self, info):
        dt = self.first_date
        return serialize_datetime(dt)
    
    def resolve_check_date(self, info):
        dt = self.check_date
        return serialize_datetime(dt)
    
    def resolve_sales_order(self, info):
        return self.sales_order
    
    def resolve_customer(self, info):
        return self.customer
    
    def resolve_service(self, info):
        return self.service
    
    def resolve_project(self, info):
        return self.project
    
    def resolve_user_reporter(self, info):
        return self.user_reporter
    
    def resolve_user_manager(self, info):
        return self.user_manager
    
    def resolve_marks(self, info):
        return self.marks
    
    def resolve_first_assignee(self, info):
        return self.first_assignee
    
    def resolve_check_assignee(self, info):
        return self.check_assignee
    
    def resolve_measurement_attachments(self, info):
        return self.measurement_attachments
    
    def resolve_color(self, info):
        return self.color
    
    def resolve_measurement_comments(self, info):
        return self.measurement_comments
    
    def resolve_status(self, info):
        number_of_checked = sum(1 for mark in self.marks if mark.get('second_check') is True)
        if number_of_checked == 0:
            return 'not started'
        elif number_of_checked < len(self.marks):
            return 'in progress'
        else:
            return 'finished'
    

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
