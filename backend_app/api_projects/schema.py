import graphene
from graphene_mongo import MongoengineObjectType
from graphene.types.generic import GenericScalar
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from datetime import datetime
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

def convert_dynamic_field(field, registry=None):
    return GenericScalar(description=getattr(field, 'help_text', ''))
convert_mongoengine_field.register(DynamicField)(convert_dynamic_field)

class DateTime(graphene.Scalar):
    """Auto-serialize datetime to ISO 8601 string"""
    @staticmethod
    def serialize(dt):
        if isinstance(dt, datetime):
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.utc)
            return timezone.localtime(dt).isoformat()
        return dt

class TimestampMixin:
    created_time = DateTime()
    last_modified_time = DateTime()

class ProjectType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = Project
        interfaces = (graphene.relay.Node,)
    
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

    start_date = DateTime()

class ProjectDefaultMaterialType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectDefaultMaterial
        interfaces = (graphene.relay.Node,)

    default_guide_products = GenericScalar()

class ProjectPermissionsType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectPermissions
        interfaces = (graphene.relay.Node,)

class ProjectStageType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectStage
        interfaces = (graphene.relay.Node,)

class ProjectDefaultGuideProductType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectDefaultGuideProduct
        interfaces = (graphene.relay.Node,)

class ProjectTaskStageType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectTaskStage
        interfaces = (graphene.relay.Node,)

class ProjectRoleType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectRole
        interfaces = (graphene.relay.Node,)

class ProjectUserType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectUser
        interfaces = (graphene.relay.Node,)

class ProjectNotificationType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectNotification
        interfaces = (graphene.relay.Node,)

    notification = GenericScalar()
    user = GenericScalar()

class ProjectNotificationUserType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectNotificationUser
        interfaces = (graphene.relay.Node,)

    notification = GenericScalar()
    user = GenericScalar()

class ProjectTrackingType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectTracking
        interfaces = (graphene.relay.Node,)

    managed_data = GenericScalar()
    user_reporter = GenericScalar()

class ProjectDefaultTaskType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectDefaultTask
        interfaces = (graphene.relay.Node,)

    project_stage = GenericScalar()

class ProjectReminderType(MongoengineObjectType, TimestampMixin):
    class Meta:
        model = ProjectReminder
        interfaces = (graphene.relay.Node,)

    project = GenericScalar()
    project_default_task = GenericScalar()
    user_reporter = GenericScalar()

class Query(graphene.ObjectType):
    node = graphene.relay.Node.Field()
    
    all_projects = graphene.relay.ConnectionField(ProjectType)
    
    all_project_notifications = graphene.List(ProjectNotificationType)
    all_project_notification_users = graphene.relay.ConnectionField(ProjectNotificationUserType)

    def resolve_all_projects(self, info, **kwargs):
        cache_key = 'all_projects_light'
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        qs = Project.objects.order_by('start_date')
        cache.set(cache_key, qs, timeout=settings.PROJECTS_LIGHT_CACHE_TTL)

    def resolve_all_project_notifications(self, info):
        return list(ProjectNotification.objects.order_by('-created_time'))

    def resolve_all_project_notification_users(self, info, **kwargs):
        return ProjectNotificationUser.objects.order_by('-created_time')

schema = graphene.Schema(
    query=Query,
    types=[
        ProjectType,
        ProjectDefaultMaterialType,
        ProjectPermissionsType,
        ProjectStageType,
        ProjectDefaultGuideProductType,
        ProjectTaskStageType,
        ProjectRoleType,
        ProjectUserType,
        ProjectNotificationType,
        ProjectNotificationUserType,
        ProjectTrackingType,
        ProjectDefaultTaskType,
        ProjectReminderType,
    ]
)
