# myapp/schema.py
import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
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
    ProjectDefaultTask,
    ProjectDefaultGuideProduct,
    ProjectReminder,
    ProjectDefaultMaterial,
)
from api_authorization.models import LoginUser
from .data_util import serialize_datetime, dynamic_field_to_json
from bson import ObjectId
from django.utils import timezone
from datetime import timezone as dt_timezone

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
    default_guide_products = GenericScalar()
    
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
    
    def resolve_default_guide_products(self, info):
        default_guide_products = self.default_guide_products or []
        default_guide_products = serialize_datetime(default_guide_products)
        return dynamic_field_to_json(default_guide_products)
    
        
class ProjectPermissionsType(MongoengineObjectType):
    class Meta:
        model = ProjectPermissions
        
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

class ProjectStageType(MongoengineObjectType):
    class Meta:
        model = ProjectStage
        
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
        
class ProjectDefaultGuideProductType(MongoengineObjectType):
    class Meta:
        model = ProjectDefaultGuideProduct
    
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
        
class ProjectTaskStageType(MongoengineObjectType):
    class Meta:
        model = ProjectTaskStage
    
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

class ProjectRoleType(MongoengineObjectType):
    class Meta:
        model = ProjectRole
        
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
        

class ProjectRemainder(MongoengineObjectType):
    class Meta:
        model = ProjectReminder
        
    created_time = graphene.String()
    last_modified_time = graphene.String()
    project = GenericScalar()
    project_default_task = GenericScalar()
    user_reporter = GenericScalar()
    
    def resolve_project(self, info):
        project = self.project or {}
        project = serialize_datetime(project)
        return dynamic_field_to_json(project)
    
    def resolve_project_default_task(self, info):
        project_default_task = self.project_default_task or {}
        project_default_task = serialize_datetime(project_default_task)
        return dynamic_field_to_json(project_default_task)
    
    def resolve_user_reporter(self, info):
        user_reporter = self.user_reporter or {}
        user_reporter = serialize_datetime(user_reporter)
        return dynamic_field_to_json(user_reporter)
    
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
    

class ProjectType(MongoengineObjectType):
    class Meta:
        model = Project
        
    sales_order = GenericScalar()
    stage_history = GenericScalar()
    user_reporter = GenericScalar()
    users_assignees = GenericScalar()
    user_installer = GenericScalar()
    current_stage = GenericScalar()
    project_attachments = GenericScalar()
    project_tasks = GenericScalar()
    project_history = GenericScalar()
    user_manager = GenericScalar()
    project_default_tasks = GenericScalar()
    project_comments = GenericScalar()
    project_materials = GenericScalar()
    project_guide_products = GenericScalar()
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
    
    def resolve_sales_order(self, info):
        sales_order = self.sales_order or {}
        sales_order = serialize_datetime(sales_order)
        return dynamic_field_to_json(sales_order)
    
    def resolve_stage_history(self, info):
        stage_history = self.stage_history or []
        stage_history = serialize_datetime(stage_history)
        return dynamic_field_to_json(stage_history)
    
    def resolve_user_reporter(self, info):
        user_reporter = self.user_reporter or {}
        user_reporter = serialize_datetime(user_reporter)
        return dynamic_field_to_json(user_reporter)
    
    def resolve_users_assignees(self, info):
        users_assignees = self.users_assignees or []
        users_assignees = serialize_datetime(users_assignees)
        return dynamic_field_to_json(users_assignees)
    
    def resolve_current_stage(self, info):
        current_stage = self.current_stage or {}
        current_stage = serialize_datetime(current_stage)
        return dynamic_field_to_json(current_stage)

    def resolve_project_attachments(self, info):
        attachments = self.project_attachments or []
        attachments = serialize_datetime(attachments)
        return dynamic_field_to_json(attachments)

    def resolve_project_tasks(self, info):
        tasks = self.project_tasks or []
        tasks = serialize_datetime(tasks)
        return dynamic_field_to_json(tasks)
    
    def resolve_project_history(self, info):
        project_history = self.project_history or []
        project_history = serialize_datetime(project_history)
        return dynamic_field_to_json(project_history)
    
    def resolve_user_manager(self, info):
        user_manager = self.user_manager or {}
        user_manager = serialize_datetime(user_manager)
        return dynamic_field_to_json(user_manager)
    
    def resolve_project_default_tasks(self, info):
        project_default_tasks = self.project_default_tasks or []
        project_default_tasks = serialize_datetime(project_default_tasks)
        return dynamic_field_to_json(project_default_tasks)
    
    def resolve_project_comments(self, info):
        project_comments = self.project_comments or []
        project_comments = serialize_datetime(project_comments)
        return dynamic_field_to_json(project_comments)
    
    def resolve_project_materials(self, info):
        project_materials = self.project_materials or []
        project_materials = serialize_datetime(project_materials)
        return dynamic_field_to_json(project_materials)
    
    def resolve_project_guide_products(self, info):
        project_guide_products = self.project_guide_products or []
        project_guide_products = serialize_datetime(project_guide_products)
        return dynamic_field_to_json(project_guide_products)
    
    def resolve_user_installer(self, info):
        user_installer = self.user_installer or {}
        user_installer = serialize_datetime(user_installer)
        return dynamic_field_to_json(user_installer)
    

class ProjectUserType(MongoengineObjectType):
    class Meta:
        model = ProjectUser
    
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
        
class ProjectNotificationType(MongoengineObjectType):
    class Meta:
        model = ProjectNotification
    
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
        
class ProjectNotificationUserType(MongoengineObjectType):
    class Meta:
        model = ProjectNotificationUser
        
    notification = GenericScalar()
    user = GenericScalar()
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
    
    def resolve_notification(self, info):
        notification = self.notification or {}
        notification = serialize_datetime(notification)
        return dynamic_field_to_json(notification)
    
    def resolve_user(self, info):
        user = self.user or {}
        user = serialize_datetime(user)
        return dynamic_field_to_json(user)
        

class ProjectNotificationUsersPaginated(graphene.ObjectType):
    count = graphene.Int()
    page = graphene.Int()
    page_size = graphene.Int()
    results = graphene.List(ProjectNotificationUserType)
    
class ProjectTrackingType(MongoengineObjectType):
    class Meta:
        model = ProjectTracking
    created_time = graphene.String()
    managed_data = GenericScalar()
    user_reporter = GenericScalar()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, dt_timezone.utc) 
        local_dt = timezone.localtime(dt)  
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    
    def resolve_managed_data(self, info):
        managed_data = self.managed_data or {}
        managed_data = serialize_datetime(managed_data)
        return dynamic_field_to_json(managed_data)
    
    def resolve_user_reporter(self, info):
        user_reporter = self.user_reporter or {}
        user_reporter = serialize_datetime(user_reporter)
        return dynamic_field_to_json(user_reporter)
    
class ProjectDefaultTaskType(MongoengineObjectType):
    class Meta:
        model = ProjectDefaultTask
    created_time = graphene.String()
    last_modified_time = graphene.String()
    project_stage = GenericScalar()
    
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
    
    def resolve_project_stage(self, info):
        project_stage = self.project_stage or {}
        project_stage = serialize_datetime(project_stage)
        return dynamic_field_to_json(project_stage)
    

class Query(graphene.ObjectType):
    all_project_permissions = graphene.List(ProjectPermissionsType)
    all_project_stages = graphene.List(ProjectStageType)
    all_project_default_guide_products = graphene.List(ProjectDefaultGuideProductType)
    all_project_task_stages = graphene.List(ProjectTaskStageType)
    all_project_roles = graphene.List(ProjectRoleType)
    all_projects = graphene.List(ProjectType)
    # all_projects = graphene.Field(
    #     graphene.List(ProjectType),
    #     page=graphene.Int(default_value=1),
    #     page_size=graphene.Int(default_value=50),
    # )
    all_project_users = graphene.List(ProjectUserType)
    all_project_notifications = graphene.List(ProjectNotificationType)
    all_project_tracking = graphene.List(ProjectTrackingType)
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

    def resolve_all_projects(self, info):
        return list(Project.objects.all().order_by('start_date'))
    
    # def resolve_all_projects(self, info, page, page_size):
    #     skip = (page - 1) * page_size
    #     return Project.objects.order_by('start_date').skip(skip).limit(page_size)

    def resolve_all_project_users(self, info):
        return list(ProjectUser.objects.all())
    
    def resolve_all_project_notifications(self, info):
        return list(ProjectNotification.objects.all())
    
    def resolve_all_project_tracking(self, info):
        return list(ProjectTracking.objects.all())
    
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