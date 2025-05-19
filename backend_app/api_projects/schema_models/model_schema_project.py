import graphene
from datetime import datetime
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from api_projects.models import (
    Project, 
    ProjectView,
)
from api_projects.models_sync import (
    ProjectSync,
)
from api_projects.schema_models.json_datetime import JSONDateTime, datetime_to_timezone


@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )


class ProjectViewType(MongoengineObjectType):
    class Meta:
        model = ProjectView
        
    address = graphene.String()
    description = graphene.String()
    has_permission = graphene.Boolean()
    is_active = graphene.Boolean()
    name = graphene.String()
    number = graphene.String()
    reference_number = graphene.String()
    feedback = graphene.String()
    work_scope = graphene.String()
    is_part_days = graphene.Boolean()
    all_products_marked = graphene.Boolean()
    all_windows_marked = graphene.Boolean()
    all_screw_marked = graphene.Boolean()
    all_trash_marked = graphene.Boolean()
    project_materials_other_notes = graphene.String()
        
    sales_order = JSONDateTime()
    project_tasks = JSONDateTime()
    project_history = JSONDateTime()
    project_default_tasks = JSONDateTime()
    project_attachments = JSONDateTime()
    project_comments = JSONDateTime()
    stage_history = JSONDateTime()
    users_assignees = JSONDateTime()
    project_materials = JSONDateTime()
    project_guide_products = JSONDateTime()
    user_reporter = JSONDateTime()
    user_installer = JSONDateTime()
    user_manager = JSONDateTime()
    current_stage = JSONDateTime()
    
    created_time = graphene.String()
    last_modified_time = graphene.String()
    end_date = graphene.String()     
    start_date = graphene.String()
    inspection_date = graphene.String()
    finish_permission_date = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self._data.get('created_time') 
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self._data.get('last_modified_time')
        return datetime_to_timezone(dt)
    
    def resolve_end_date(self, info):
        dt = self._data.get('end_date')
        return datetime_to_timezone(dt) 
    
    def resolve_start_date(self, info):
        dt = self._data.get('start_date')
        return datetime_to_timezone(dt)
    
    def resolve_inspection_date(self, info):
        dt = self._data.get('inspection_date')
        return datetime_to_timezone(dt)
    
    def resolve_finish_permission_date(self, info):
        dt = self._data.get('finish_permission_date')
        return datetime_to_timezone(dt)
    
    def resolve_sales_order(self, info):
        return self._data.get('sales_order')
    
    def resolve_stage_history(self, info):
        return self._data.get('stage_history')
    
    def resolve_user_reporter(self, info):
        return self._data.get('user_reporter')
    
    def resolve_users_assignees(self, info):
        return self._data.get('users_assignees')
    
    def resolve_current_stage(self, info):
        return self._data.get('current_stage')

    def resolve_project_attachments(self, info):
        return self._data.get('project_attachments')

    def resolve_project_tasks(self, info):
        return self._data.get('project_tasks')
    
    def resolve_project_history(self, info):
        return self._data.get('project_history')
    
    def resolve_user_manager(self, info):
        return self._data.get('user_manager')
    
    def resolve_project_default_tasks(self, info):
        return self._data.get('project_default_tasks')
    
    def resolve_project_comments(self, info):
        return self._data.get('project_comments')
    
    def resolve_project_materials(self, info):
        return self._data.get('project_materials')
    
    def resolve_project_guide_products(self, info):
        return self._data.get('project_guide_products')
    
    def resolve_user_installer(self, info):
        return self._data.get('user_installer')
    
    def resolve_current_stage(self, info):
        return self._data.get('current_stage')
    
    def resolve_address(self, info):
        return self._data.get('address')

    def resolve_description(self, info):
        return self._data.get('description')
    
    def resolve_has_permission(self, info):
        return self._data.get('has_permission')

    def resolve_is_active(self, info):
        return self._data.get('is_active')

    def resolve_name(self, info):
        return self._data.get('name')

    def resolve_number(self, info):
        return self._data.get('number')

    def resolve_reference_number(self, info):
        return self._data.get('reference_number')

    def resolve_feedback(self, info):
        return self._data.get('feedback')

    def resolve_work_scope(self, info):
        return self._data.get('work_scope')
    
    def resolve_is_part_days(self, info):
        return self._data.get('is_part_days')
    
    def resolve_all_products_marked(self, info):
        return self._data.get('all_products_marked')
    
    def resolve_all_windows_marked(self, info):
        return self._data.get('all_windows_marked')
    
    def resolve_all_screw_marked(self, info):
        return self._data.get('all_screw_marked')
    
    def resolve_all_trash_marked(self, info):
        return self._data.get('all_trash_marked')
    
    def resolve_project_materials_other_notes(self, info):
        return self._data.get('project_materials_other_notes')
    

class ProjectType(MongoengineObjectType):
    class Meta:
        model = Project
        
    sales_order = JSONDateTime()
    stage_history = JSONDateTime()
    user_reporter = JSONDateTime()
    users_assignees = JSONDateTime()
    user_installer = JSONDateTime()
    current_stage = JSONDateTime()
    project_attachments = JSONDateTime()
    project_tasks = JSONDateTime()
    project_history = JSONDateTime()
    user_manager = JSONDateTime()
    project_default_tasks = JSONDateTime()
    project_comments = JSONDateTime()
    project_materials = JSONDateTime()
    project_guide_products = JSONDateTime()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    end_date = graphene.String()     
    start_date = graphene.String()
    inspection_date = graphene.String()
    finish_permission_date = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_end_date(self, info):
        dt = self.end_date
        return datetime_to_timezone(dt)
    
    def resolve_start_date(self, info):
        dt = self.start_date
        return datetime_to_timezone(dt)
    
    def resolve_inspection_date(self, info):
        dt = self.inspection_date
        return datetime_to_timezone(dt)
    
    def resolve_finish_permission_date(self, info):
        dt = self.finish_permission_date
        return datetime_to_timezone(dt)
    
    def resolve_sales_order(self, info):
        return self.sales_order or {}
    
    def resolve_stage_history(self, info):
        return self.stage_history or []
    
    def resolve_user_reporter(self, info):
        return self.user_reporter or {}
    
    def resolve_users_assignees(self, info):
        return self.users_assignees or []
    
    def resolve_current_stage(self, info):
        return self.current_stage or {}

    def resolve_project_attachments(self, info):
        return self.project_attachments or []

    def resolve_project_tasks(self, info):
        return self.project_tasks or []
    
    def resolve_project_history(self, info):
        return self.project_history or []
    
    def resolve_user_manager(self, info):
        return self.user_manager or {}
    
    def resolve_project_default_tasks(self, info):
        return self.project_default_tasks or []
    
    def resolve_project_comments(self, info):
        return self.project_comments or []
    
    def resolve_project_materials(self, info):
        return self.project_materials or []
    
    def resolve_project_guide_products(self, info):
        return self.project_guide_products or []
    
    def resolve_user_installer(self, info):
        return self.user_installer or {}
    
    
class ProjectSyncType(MongoengineObjectType):
    class Meta:
        model = ProjectSync
        
    sales_order = JSONDateTime()
    stage_history = JSONDateTime()
    user_reporter = JSONDateTime()
    users_assignees = JSONDateTime()
    user_installer = JSONDateTime()
    current_stage = JSONDateTime()
    project_attachments = JSONDateTime()
    project_tasks = JSONDateTime()
    project_history = JSONDateTime()
    user_manager = JSONDateTime()
    project_default_tasks = JSONDateTime()
    project_comments = JSONDateTime()
    project_materials = JSONDateTime()
    project_guide_products = JSONDateTime()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    start_date = graphene.String()
    end_date = graphene.String()
    inspection_date = graphene.String()
    finish_permission_date = graphene.String()
    
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_start_date(self, info):
        dt = self.start_date
        return datetime_to_timezone(dt)
    
    def resolve_end_date(self, info):
        dt = self.end_date
        return datetime_to_timezone(dt)
    
    def resolve_inspection_date(self, info):
        dt = self.inspection_date
        return datetime_to_timezone(dt)
    
    def resolve_finish_permission_date(self, info):
        dt = self.finish_permission_date
        return datetime_to_timezone(dt)
    
    def resolve_sales_order(self, info):
        return self.sales_order or {}
    
    def resolve_stage_history(self, info):
        return self.stage_history or []
    
    def resolve_user_reporter(self, info):
        return self.user_reporter or {}
    
    def resolve_users_assignees(self, info):
        return self.users_assignees or []
    
    def resolve_current_stage(self, info):
        return self.current_stage or {}

    def resolve_project_attachments(self, info):
        return self.project_attachments or []

    def resolve_project_tasks(self, info):
        return self.project_tasks or []
    
    def resolve_project_history(self, info):
        return self.project_history or []
    
    def resolve_user_manager(self, info):
        return self.user_manager or {}
    
    def resolve_project_default_tasks(self, info):
        return self.project_default_tasks or []
    
    def resolve_project_comments(self, info):
        return self.project_comments or []
    
    def resolve_project_materials(self, info):
        return self.project_materials or []
    
    def resolve_project_guide_products(self, info):
        return self.project_guide_products or []
    
    def resolve_user_installer(self, info):
        return self.user_installer or {}