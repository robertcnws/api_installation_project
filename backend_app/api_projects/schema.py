import graphene
from graphene_mongo import MongoengineObjectType
from graphene.types.generic import GenericScalar
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from django.utils import timezone
from datetime import datetime
from datetime import timezone as dt_timezone
from bson import ObjectId
from graphql_relay import from_global_id
from .models import (
    Project,
    ProjectDefaultMaterial,
    ProjectPermissions,
    ProjectStage,
    ProjectDefaultGuideProduct,
    ProjectTaskStage,
    ProjectRole,
    ProjectUser,
    ProjectNotification,
    ProjectNotificationUser,
    ProjectTracking,
    ProjectDefaultTask,
    ProjectReminder,
)
from api_authorization.models import LoginUser
from .data_util import serializing_datetime

class JSONDateTimeScalar(graphene.Scalar):
    @staticmethod
    def serialize(value):
        return serializing_datetime(value)
    @staticmethod
    def parse_value(value):
        return value
    @staticmethod
    def parse_literal(node):
        return node.value

def convert_dynamic_field(field, registry, executor=None):
    return JSONDateTimeScalar(description=getattr(field, 'help_text', ''))

convert_mongoengine_field.register(DynamicField)(convert_dynamic_field)
    

class TimestampMixin:
    created_time = JSONDateTimeScalar()
    last_modified_time = JSONDateTimeScalar()

    start_date = JSONDateTimeScalar()
    end_date = JSONDateTimeScalar()
    inspection_date = JSONDateTimeScalar()
    finish_permission_date = JSONDateTimeScalar()
    
    

class HeavyProjectObjectType(graphene.ObjectType, TimestampMixin):
    stage_history = JSONDateTimeScalar()
    user_reporter = JSONDateTimeScalar()
    users_assignees = JSONDateTimeScalar()
    user_installer = JSONDateTimeScalar()
    current_stage = JSONDateTimeScalar()
    project_attachments = JSONDateTimeScalar()
    project_tasks = JSONDateTimeScalar()
    project_history = JSONDateTimeScalar()
    user_manager = JSONDateTimeScalar()
    project_default_tasks = JSONDateTimeScalar()
    project_comments = JSONDateTimeScalar()
    project_materials = JSONDateTimeScalar()
    project_guide_products = JSONDateTimeScalar()
        

class ProjectType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = Project
        
    id = graphene.ID()
    name = graphene.String()
    number = graphene.String()
    description = graphene.String()    
    address = graphene.String()  
    hasPermission = graphene.Boolean()
    is_active = graphene.Boolean()
    reference_number = graphene.String()
    all_products_marked = graphene.Boolean()
    all_windows_marked = graphene.Boolean()
    all_screw_marked = graphene.Boolean()
    all_trash_marked = graphene.Boolean()
    feedback = graphene.String()
    work_scope = graphene.String()
    project_materials_other_notes = graphene.String()
    is_part_days = graphene.Boolean()
    start_date = JSONDateTimeScalar()
    end_date = JSONDateTimeScalar()
    inspection_date = JSONDateTimeScalar()
    finish_permission_date = JSONDateTimeScalar()
    sales_order = JSONDateTimeScalar()
    
    heavy_fields = graphene.Field(HeavyProjectObjectType)
    
    def resolve_heavy_fields(self, info):
        p = Project.objects.only(
            'stage_history',
            'user_reporter',
            'users_assignees',
            'user_installer',
            'current_stage',
            'project_attachments',
            'project_tasks',
            'project_history',
            'user_manager',
            'project_default_tasks',
            'project_comments',
            'project_materials',
            'project_guide_products'
        ).get(id=self.id)
        return HeavyProjectObjectType(
            stage_history=p.stage_history,
            user_reporter=p.user_reporter,
            users_assignees=p.users_assignees,
            user_installer=p.user_installer,
            current_stage=p.current_stage,
            project_attachments=p.project_attachments,
            project_tasks=p.project_tasks,
            project_history=p.project_history,
            user_manager=p.user_manager,
            project_default_tasks=p.project_default_tasks,
            project_comments=p.project_comments,
            project_materials=p.project_materials,
            project_guide_products=p.project_guide_products
        )

class ProjectTypePaginated(graphene.ObjectType, TimestampMixin):
    count = graphene.Int()
    page_size = graphene.Int()
    has_previous_page = graphene.Boolean()
    has_next_page = graphene.Boolean()
    next_cursor = graphene.String()
    results = graphene.List(ProjectType)
    
class ProjectTypeOffsetPaginated(graphene.ObjectType):
    total_count = graphene.Int(required=True)
    results     = graphene.List(lambda: ProjectType, required=True)

class ProjectDefaultMaterialType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectDefaultMaterial

    default_guide_products = JSONDateTimeScalar()

class ProjectPermissionsType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectPermissions

class ProjectStageType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectStage

class ProjectDefaultGuideProductType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectDefaultGuideProduct

class ProjectTaskStageType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectTaskStage

class ProjectRoleType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectRole

class ProjectUserType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectUser

class ProjectNotificationType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectNotification

    notification = JSONDateTimeScalar()
    user = JSONDateTimeScalar()

class ProjectNotificationUserType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectNotificationUser

    notification = JSONDateTimeScalar()
    user = JSONDateTimeScalar()
    
class ProjectNotificationUsersPaginated(graphene.ObjectType, TimestampMixin):
    count = graphene.Int()
    page = graphene.Int()
    page_size = graphene.Int()
    results = graphene.List(ProjectNotificationUserType)

class ProjectTrackingType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectTracking

    managed_data = JSONDateTimeScalar()
    user_reporter = JSONDateTimeScalar()

class ProjectDefaultTaskType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectDefaultTask

    project_stage = JSONDateTimeScalar()

class ProjectReminderType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectReminder

    project = JSONDateTimeScalar()
    project_default_task = JSONDateTimeScalar()
    user_reporter = JSONDateTimeScalar()
    

class SalesOrderType(graphene.ObjectType, TimestampMixin):
    id = graphene.ID()
    sales_order = JSONDateTimeScalar()


class Query(graphene.ObjectType):
    # REGULAR QUERIES
    all_project_permissions = graphene.List(ProjectPermissionsType)
    all_project_stages = graphene.List(ProjectStageType)
    all_project_default_guide_products = graphene.List(ProjectDefaultGuideProductType)
    all_project_task_stages = graphene.List(ProjectTaskStageType)
    all_project_roles = graphene.List(ProjectRoleType)
    all_project_users = graphene.List(ProjectUserType)
    all_project_notifications = graphene.List(ProjectNotificationType)
    all_project_tracking = graphene.List(ProjectTrackingType)
    all_project_default_tasks = graphene.List(ProjectDefaultTaskType)
    all_project_default_materials = graphene.List(ProjectDefaultMaterialType)
    all_project_reminders = graphene.List(
        ProjectReminderType, 
        username=graphene.String(required=False)
    )
    project_by_id = graphene.Field(
        ProjectType, 
        id=graphene.String(required=True)
    )
    project_user_by_username = graphene.Field(
        ProjectUserType, 
        username=graphene.String(required=True), 
    )
    sales_orders_by_ids = graphene.List(
        SalesOrderType,
        ids=graphene.List(graphene.ID, required=True)
    )
    
    # PAGINATED QUERIES
    all_projects_offset = graphene.Field(
        ProjectTypeOffsetPaginated,
        skip=graphene.Int(required=False, default_value=0),
        limit=graphene.Int(required=False, default_value=50),
    )
    
    all_projects = graphene.Field(
        ProjectTypePaginated,
        after=graphene.String(required=False),
        first=graphene.Int(required=False, default_value=50)
    )
    all_project_notifications = graphene.List(ProjectNotificationType)
    
    all_project_notification_users = graphene.Field(
        ProjectNotificationUsersPaginated,
        username=graphene.String(required=False),
        user=graphene.String(required=False),
        page=graphene.Int(required=False, default_value=1), 
        pageSize=graphene.Int(required=False, default_value=100)
    )
    
    # RESOLVERS REGULAR QUERIES
    
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
    
    def resolve_all_project_default_materials(self, info):
        return list(ProjectDefaultMaterial.objects(is_active=True))
    
    # RESOLVERS PAGINATED QUERIES

    def resolve_all_projects(self, info, after=None, first=50):
        qs = Project.objects(is_active=True).order_by('-created_time')
        
        if after:
            try:
                cursor_dt = datetime.fromisoformat(after)
                qs = qs.filter(created_time__lt=cursor_dt)
            except ValueError:
                pass

        total = qs.count()
        
        items = list(qs.limit(first + 1))
        has_next = len(items) > first
        
        results = items[:first]
        
        end_cursor = (
            results[-1].created_time.isoformat()
            if results else
            None
        )

        return ProjectTypePaginated(
            count=total,
            page_size=first,
            has_previous_page=bool(after),
            has_next_page=has_next,
            next_cursor=end_cursor,
            results=results
        )
        
    def resolve_all_projects_offset(self, info, skip, limit):
        qs = Project.objects.only(
            'id',
            'name',
            'number',
            'description',
            'address',
            'has_permission',
            'is_active',
            'reference_number',
            'all_products_marked',
            'all_windows_marked',
            'all_screw_marked',
            'all_trash_marked',
            'feedback',
            'work_scope',
            'project_materials_other_notes',
            'is_part_days',
            'start_date',
            'end_date',
            'inspection_date',
            'finish_permission_date',
            'created_time',
            'last_modified_time',
            'sales_order',
        ).order_by('-created_time')
        total = qs.count()
        docs = qs.skip(skip).limit(limit)
        return ProjectTypeOffsetPaginated(
            total_count=total,
            results=list(docs),
        )

    def resolve_all_project_notifications(self, info):
        return list(ProjectNotification.objects.order_by('-created_time'))

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
    
    def resolve_sales_orders_by_ids(self, info, ids):
        docs = Project.objects(id__in=ids).only('id', 'sales_order')
        return [
            SalesOrderType(
              id=str(p.id),
              sales_order=p.sales_order
            )
            for p in docs
        ]
    

schema = graphene.Schema(query=Query)
