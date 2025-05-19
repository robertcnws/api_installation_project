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

from .models import (
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
)
from .models_sync import (
    ProjectSync,
)
from api_authorization.models import LoginUser
from bson import ObjectId

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
    
    def resolve_all_project_tracking(self, info):
        return ProjectTrackingView.objects.all()
    
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

schema = graphene.Schema(query=Query)