# myapp/schema.py
import graphene
from api_projects.schema_models.model_schema_project import ProjectType, ProjectViewType, ProjectSyncType
from api_projects.schema_models.model_schema_project_stage import ProjectStageType
from api_projects.schema_models.model_schema_project_role import ProjectRoleType
from api_projects.schema_models.model_schema_project_user import ProjectUserType
from api_projects.schema_models.model_schema_project_notification import ProjectNotificationType, ProjectNotificationUsersPaginated
from api_projects.schema_models.model_schema_project_permissions import ProjectPermissionsType
from api_projects.schema_models.model_schema_project_task_stage import ProjectTaskStageType
from api_projects.schema_models.model_schema_project_default_task import ProjectDefaultTaskType
from api_projects.schema_models.model_schema_project_default_guide_product import ProjectDefaultGuideProductType
from api_projects.schema_models.model_schema_project_default_material import ProjectDefaultMaterialType
from api_projects.schema_models.model_schema_project_reminder import ProjectRemainder
from api_projects.schema_models.model_schema_project_tracking import ProjectTrackingType, ProjectTrackingViewType
from api_projects.schema_models.model_schema_project_calendar_notes import ProjectCalendarNotesType
from api_projects.schema_models.model_schema_project_profit_report import ProjectProfitReportType
from api_projects.schema_models.model_schema_project_installation_crew import ProjectInstallationCrewType
from api_projects.schema_models.model_schema_timer import TaskTimerType

from .models import (
    ProjectInstallationCrew,
    ProjectStage, 
    ProjectRole, 
    Project, 
    ProjectUser,
    ProjectNotification,
    ProjectNotificationUser,
    ProjectPermissions,
    ProjectTaskStage,
    ProjectTracking,
    ProjectTrackingView,
    ProjectDefaultTask,
    ProjectDefaultGuideProduct,
    ProjectReminder,
    ProjectDefaultMaterial,
    ProjectView,
    ProjectCalendarNotes,
    ProjectProfitReport,
)
from .models_sync import (
    ProjectSync,
)
from .models_extra import (
    TaskTimer,
)
from api_authorization.models import LoginUser
from bson import ObjectId
from datetime import datetime, time
from django.utils import timezone

class Query(graphene.ObjectType):
    all_project_permissions = graphene.List(ProjectPermissionsType)
    all_project_stages = graphene.List(ProjectStageType)
    all_project_default_guide_products = graphene.List(ProjectDefaultGuideProductType)
    all_project_task_stages = graphene.List(ProjectTaskStageType)
    all_project_roles = graphene.List(ProjectRoleType)
    all_projects = graphene.List(ProjectViewType)
    # all_projects = graphene.List(ProjectSyncType)
    all_project_users = graphene.List(ProjectUserType)
    all_project_notifications = graphene.List(ProjectNotificationType)
    # all_project_tracking = graphene.List(ProjectTrackingType)
    all_project_tracking = graphene.List(ProjectTrackingViewType)
    all_project_default_tasks = graphene.List(ProjectDefaultTaskType)
    all_project_reminders = graphene.List(
        ProjectRemainder, 
        username=graphene.String(required=False)
    )
    all_project_notification_users = graphene.Field(
        ProjectNotificationUsersPaginated,
        username=graphene.String(required=False),
        user=graphene.String(required=False),
        page=graphene.Int(required=False, default_value=1), 
        pageSize=graphene.Int(required=False, default_value=100)
    )
    project_by_id = graphene.Field(
        ProjectType, 
        id=graphene.String(required=True)
    )
    project_user_by_username = graphene.Field(
        ProjectUserType, 
        username=graphene.String(required=True), 
    )
    
    all_project_default_materials = graphene.List(ProjectDefaultMaterialType)
    all_project_calendar_notes = graphene.List(ProjectCalendarNotesType)
    all_project_profit_reports = graphene.List(ProjectProfitReportType)
    profit_reports_by_date_range = graphene.List(
        ProjectProfitReportType,
        start_date=graphene.String(required=True),
        end_date=graphene.String(required=True)
    )
    all_project_installation_crews = graphene.List(ProjectInstallationCrewType)
    
    all_task_timers = graphene.List(TaskTimerType)
    
    timer_by_id = graphene.Field(
        TaskTimerType,
        id=graphene.String(required=True)
    )
    
    timer_get_by_username_entity = graphene.Field(
        TaskTimerType,
        username=graphene.String(required=False),
        entity_type=graphene.String(required=False),
        entity_id=graphene.String(required=False),
    )
    
    def resolve_all_project_reminders(self, info, username=None):
        if username:
            try:
                user = LoginUser.objects.get(username=username)
                if not user:
                    return []
                return list(ProjectReminder.objects(is_active=True, user_reporter__username=username))
            except Exception:
                return []
        else:
            return list(ProjectReminder.objects(is_active=True))
    
    def resolve_all_project_permissions(self, info):
        return list(ProjectPermissions.objects(is_active=True))

    def resolve_all_project_stages(self, info):
        return list(ProjectStage.objects(is_active=True).order_by('order'))
    
    def resolve_all_project_task_stages(self, info):
        return list(ProjectTaskStage.objects(is_active=True).order_by('order'))

    def resolve_all_project_roles(self, info):
        return list(ProjectRole.objects(is_active=True))
    
    # def resolve_all_projects(self, info):
    #     return ProjectSync.objects.order_by('start_date')
    
    def resolve_all_projects(self, info):
        return ProjectView.objects.order_by('start_date')

    def resolve_all_project_users(self, info):
        return list(ProjectUser.objects.all())
    
    def resolve_all_project_notifications(self, info):
        return list(ProjectNotification.objects.all())
    
    # def resolve_all_project_tracking(self, info):
    #     return list(ProjectTracking.objects.all())
    
    # def resolve_all_project_tracking(self, info):
    #     return ProjectTrackingView.objects.all().order_by('-created_time')
    
    def resolve_all_project_tracking(self, info):
        return (
            ProjectTrackingView 
            .objects(action__nin=['login','logout'])
            .order_by('-created_time')
        )
    
    def resolve_all_project_default_tasks(self, info):
        return list(ProjectDefaultTask.objects.all())
    
    def resolve_all_project_default_guide_products(self, info):
        return list(ProjectDefaultGuideProduct.objects.all())
    
    def resolve_all_project_notification_users(self, info, username=None, user=None, page=1, pageSize=100):
        qs = ProjectNotificationUser.objects.all()
        if username:
            qs = qs(username=username)
        if user:
            qs = qs(user__username=user)
        qs = qs.order_by('-created_time')
        total = qs.count()
        skip = (page - 1) * pageSize
        paginated_qs = qs.skip(skip).limit(pageSize)
        return ProjectNotificationUsersPaginated(
            count=total,
            page=page,
            page_size=pageSize,
            results=list(paginated_qs)
        )

    def resolve_project_by_id(self, info, id):
        try:
            return Project.objects.get(id=ObjectId(id))
        except Exception:
            return None

    def resolve_project_user_by_username(self, info, username):
        try:
            return ProjectUser.objects.get(username=username)
        except Exception:
            return None
        
    def resolve_all_project_default_materials(self, info):
        return list(ProjectDefaultMaterial.objects(is_active=True))
    
    def resolve_all_project_calendar_notes(self, info):
        return list(ProjectCalendarNotes.objects(is_active=True))
    
    def resolve_all_project_profit_reports(self, info):
        return list(ProjectProfitReport.objects().order_by('-created_time'))
    
    def resolve_profit_reports_by_date_range(self, info, start_date, end_date):
        try:
            date_from = datetime.strptime(start_date, "%Y-%m-%d").date()
            date_to = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return ProjectProfitReport.objects.none()
        
        start_dt = datetime.combine(date_from, time.min)  # 00:00:00
        end_dt = datetime.combine(date_to, time.max)      # 23:59:59.999999
        
        qs = ProjectProfitReport.objects(
            __raw__={
                "project_info.start_date": {
                    "$gte": start_dt,
                    "$lte": end_dt,
                }
            }
        )

        return qs.order_by('-created_time')
    
    def resolve_all_project_installation_crews(self, info):
        return list(ProjectInstallationCrew.objects.all())
    
    def resolve_all_task_timers(self, info):
        return list(TaskTimer.objects.all())
    
    def resolve_timer_by_id(self, info, id):
        try:
            return TaskTimer.objects.get(id=ObjectId(id))
        except Exception:
            return None
        
    def resolve_timer_get_by_username_entity(self, info, username=None, entity_type=None, entity_id=None):
        try:
            qs = TaskTimer.objects
            if username:
                qs = qs(username=username)
            if entity_type:
                qs = qs(entity_type=entity_type)
            if entity_id:
                qs = qs(entity_id=entity_id)
            return qs.first()
        except Exception:
            return None
            

schema = graphene.Schema(query=Query)