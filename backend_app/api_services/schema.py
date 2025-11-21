import graphene
from api_services.schema_models.model_schema_service import ServiceType
from api_services.schema_models.model_schema_service_issue import ServiceIssueType
from api_services.schema_models.model_schema_service_stage import ServiceStageType
from api_services.schema_models.model_schema_service_default_task import ServiceDefaultTaskType
from .models import (
    Service,
    ServiceIssue,
    ServiceStage,
    ServiceDefaultTask,
)
from bson import ObjectId

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
