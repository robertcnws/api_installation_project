from mongoengine import Document, DynamicField, StringField, DateTimeField, BooleanField, IntField

class ProjectSync(Document):
    meta = {
        'collection': 'project_sync',  
        'strict': False,                   
        'indexes': [
            'start_date',
            ('is_active', 'start_date'),
        ],
    }
    
    address                 = StringField()
    name                    = StringField()
    number                  = StringField()
    description             = StringField()
    reference_number        = StringField()
    start_date              = DateTimeField()
    end_date                = DateTimeField()
    created_time            = DateTimeField()
    last_modified_time      = DateTimeField()
    is_active               = BooleanField()
    has_permission          = BooleanField()
    all_products_marked     = BooleanField()
    all_windows_marked      = BooleanField()
    all_screw_marked        = BooleanField()
    all_trash_marked        = BooleanField()
    project_materials_other_notes = StringField()
    
    sales_order             = DynamicField()
    project_tasks           = DynamicField()
    project_default_tasks   = DynamicField()
    project_history         = DynamicField()
    project_attachments     = DynamicField()
    project_comments        = DynamicField()
    stage_history           = DynamicField()
    users_assignees         = DynamicField()
    project_materials       = DynamicField()
    project_guide_products  = DynamicField()
    user_manager            = DynamicField()
    user_reporter           = DynamicField()
    user_installer          = DynamicField()
    feedback                = StringField()
    work_scope              = StringField()
    inspection_date         = DateTimeField()
    inspection_end_date     = DateTimeField()
    inspection_duration     = IntField()
    inspection_is_part_days = BooleanField()
    finish_permission_date  = DateTimeField()
    finish_permission_end_date = DateTimeField()
    finish_permission_duration = IntField()
    finish_permission_is_part_days = BooleanField()
    is_part_days            = BooleanField()
    current_stage           = DynamicField()
    project_tasks           = DynamicField()
    duration                = IntField()
    work_orders            = DynamicField()