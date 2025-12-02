from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

from .repository import (
    project_comment_repository,
    project_crud_repository,
    project_db_repository,
    project_default_guide_product_repository,
    project_default_material_repository,
    project_default_task_repository,
    project_extra_repository,
    project_notification_repository,
    project_reminder_repository,
    project_stage_repository,
    project_task_attachment_repository,
    project_task_repository,
    project_task_stage_repository,
    project_tracking_repository,
    project_work_orders_repository,
    project_calendar_notes_repository,
    project_profit_report_repository,
    project_installation_crew_repository,
)

from rest_framework.response import Response
from rest_framework import status

from api_projects.tasks import task_manage_profit_report
    
    
#############################################
# DELETE PROJECT FILE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_file(request, id, folder, file):
    return project_crud_repository.delete_project_file(request, id, folder, file)
    
    
#############################################
# DELETE PROJECT DEFAULT TASK FILE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_task_file(request, projectId, id, folder, file):
    return project_default_task_repository.delete_default_task_file(request, projectId, id, folder, file)
    

#############################################
# CREATE PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_project(request):         
    return project_crud_repository.create_project(request)
    

#############################################
# CREATE PROJECTS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_projects(request):         
    return project_crud_repository.create_projects(request)
    

#############################################
# UPDATE PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_project(request, id): 
    return project_crud_repository.update_project(request, id)
    
    
#############################################
# CHANGE PROJECT PERMISSION
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_permission(request, id): 
    return project_extra_repository.change_project_permission(request, id)
    
    
#############################################
# CHANGE PROJECT ADDRESS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_address(request, id): 
    return project_extra_repository.change_project_address(request, id)
    
    
#############################################
# CHANGE PROJECT PHONE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_phone_number(request, id): 
    return project_extra_repository.change_project_phone_number(request, id)
    
    
#############################################
# CHANGE PROJECT REFERENCE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_reference_number(request, id): 
    return project_extra_repository.change_project_reference_number(request, id)
    

#############################################
# CHECK ITEM INSTALLATION GUIDE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def check_project_item_installation_guide(request, id): 
    return project_extra_repository.check_project_item_installation_guide(request, id)
    
    
#############################################
# CHANGE PROJECT RELEASE FORM
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_release_form(request, id): 
    return project_extra_repository.change_project_release_form(request, id)
    
    

#############################################
# CHANGE PROJECT INSTALLATION GUIDE FORM
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_project_installation_guide_form(request, id): 
    return project_extra_repository.change_project_installation_guide_form(request, id)
    

#############################################
# ADD USERS ASSIGNEES TO PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def add_project_users_assignees(request, id): 
    return project_crud_repository.add_project_users_assignees(request, id)
    
    

#############################################
# DELETE PROJECT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project(request, id):
    return project_crud_repository.delete_project(request, id)
    

#############################################
# DELETE PROJECTS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_projects(request):
    return project_crud_repository.delete_projects(request)
    

#############################################
# DELETE PROJECT USER
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_user(request, id, userId):
    return project_crud_repository.delete_project_user(request, id, userId)
    
    
#############################################
# GET FILE URL
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_default_file_url(request):
    return project_crud_repository.get_default_file_url(request)
    
    
#############################################
# CREATE STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_stage(request):
    return project_stage_repository.create_stage(request)
    
    
#############################################
# EDIT STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_stage(request, id):
    return project_stage_repository.edit_stage(request, id)
    

#############################################
# DELETE STAGE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_stage(request, id):
    return project_stage_repository.delete_stage(request, id)
    
#############################################
# DELETE STAGES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_stages(request):
    return project_stage_repository.delete_stages(request)
    
    

#############################################
# CREATE STAGE TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_stage_task(request):
    return project_task_stage_repository.create_stage_task(request)
    
    
#############################################
# EDIT STAGE TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_stage_task(request, id):
    return project_task_stage_repository.edit_stage_task(request, id)
    

#############################################
# DELETE STAGE TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_stage_task(request, id):
    return project_task_stage_repository.delete_stage_task(request, id)
    
#############################################
# DELETE STAGES TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_stages_task(request):
    return project_task_stage_repository.delete_stages_task(request)
    
    
#############################################
# CREATE PROJECT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_project_task(request):         
    return project_task_repository.create_project_task(request)
    

#############################################
# UPDATE PROJECT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_project_task(request, id):
    return project_task_repository.update_project_task(request, id)
    
    
#############################################
# ADD USERS ASSIGNEES TO PROJECT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def add_project_task_users_assignees(request, projectId, id): 
    return project_task_repository.add_project_task_users_assignees(request, projectId, id)
    
    
#############################################
# DELETE PROJECT TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_task(request, projectId, id):
    return project_task_repository.delete_project_task(request, projectId, id)
    

#############################################
# DELETE PROJECT TASK USER
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_task_user(request, projectId, id, userId):
    return project_task_repository.delete_project_task_user(request, projectId, id, userId)
    
    
#############################################
# CREATE DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_default_task(request):
    return project_default_task_repository.create_default_task(request)
    
    
#############################################
# EDIT DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_default_task(request, id):
    return project_default_task_repository.edit_default_task(request, id)
    

#############################################
# DELETE DEFAULT TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_task(request, id):
    return project_default_task_repository.delete_default_task(request, id)
    
#############################################
# DELETE DEFAULT TASKS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_tasks(request):
    return project_default_task_repository.delete_default_tasks(request)
    
    
#############################################
# CHANGE STATUS PROJECT DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_status_project_default_task(request, projectId, id):
    return project_default_task_repository.change_status_project_default_task(request, projectId, id)
    
    
#############################################
# CHANGE PRIORITY PROJECT DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_priority_project_default_task(request, projectId, id):
    return project_default_task_repository.change_priority_project_default_task(request, projectId, id)
    
    
#############################################
# CHANGE INSTALLER PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_installer_project(request, id):
    return project_extra_repository.change_installer_project(request, id)
    
    
#############################################
# UPLOAD FILES TO PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_files_to_project(request, id): 
    return project_extra_repository.upload_files_to_project(request, id)



#############################################
# UPLOAD FILES TO DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_files_to_default_task(request, projectId, id): 
    return project_default_task_repository.upload_files_to_default_task(request, projectId, id)
    
    
#############################################
# CREATE PROJECT COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_project_comment(request, id): 
    return project_comment_repository.create_project_comment(request, id)
    
    
#############################################
# EDIT PROJECT COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_project_comment(request, id, projectId): 
    return project_comment_repository.edit_project_comment(request, id, projectId)
    
    
#############################################
# DELETE PROJECT COMMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_comment(request, id, projectId): 
    return project_comment_repository.delete_project_comment(request, id, projectId)
    
    
#############################################
# CREATE DEFAULT GUIDE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_default_guide_product(request):
    return project_default_guide_product_repository.create_default_guide_product(request)
    
    
#############################################
# EDIT DEFAULT GUIDE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_default_guide_product(request, id):
    return project_default_guide_product_repository.edit_default_guide_product(request, id)
    

#############################################
# DELETE DEFAULT GUIDE PRODUCT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_guide_product(request, id):
    return project_default_guide_product_repository.delete_default_guide_product(request, id)
    
#############################################
# DELETE DEFAULT GUIDE PRODUCTS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_guide_products(request):
    return project_default_guide_product_repository.delete_default_guide_products(request)
    

#############################################
# REMOVE ALL NOTIFICATIONS
#############################################

    
@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_old_notifications(request):
    return project_notification_repository.remove_old_notifications(request)



#############################################
# DELETE NOTIFICATIONS
#############################################

    
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_notifications(request):
    return project_notification_repository.delete_notifications(request)


#############################################
# MARK AS READ NOTIFICATIONS
#############################################

    
@api_view(['POST'])
@permission_classes([AllowAny])
def mark_as_read_notifications(request):
    return project_notification_repository.mark_as_read_notifications(request)


#############################################
# DELETE OLD NOTIFICATIONS
#############################################

def delete_old_notifications():
    return project_notification_repository.delete_old_notifications()


#############################################
# DELETE OLD TRACKINGS
#############################################

def delete_old_trackings():
    return project_tracking_repository.delete_old_trackings()


#############################################
# GENERATE DB BACKUP
#############################################

def generate_db_backup():
    return project_db_repository.generate_db_backup()
    
    
#############################################
# DOWNLOAD MONGO DB
#############################################


@api_view(['GET'])
@permission_classes([AllowAny])
def download_mongo_db(request):
    return project_db_repository.download_mongo_db(request)


#############################################
# CHANGE DESCRIPTION ALL PROJECTS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_description_all_projects(request):
    return project_extra_repository.change_description_all_projects(request)


#############################################
# CHANGE STAFF ALL PROJECTS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_staff_all_projects(request): 
    return project_extra_repository.change_staff_all_projects(request)
    
    
#############################################
# REMOVE DATE PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def remove_date_project(request, id):
    return project_extra_repository.remove_date_project(request, id)
    
    
#############################################
# CHANGE DESCRIPTION PROJECT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_description_project(request, id):
    return project_extra_repository.change_description_project(request, id)
    
    
#############################################
# REMOVE PROJECT GUIDE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def remove_guide_product_project(request, projectId, id):
    return project_extra_repository.remove_guide_product_project(request, projectId, id)
    

#############################################
# CREATE PROJECT REMAINDER
#############################################

def delete_old_reminders():
    return project_reminder_repository.delete_old_reminders()


#############################################
# REDEFINE PROJECT TASK ATTACHMENTS
#############################################

def redefine_project_task_attachments():
    return project_task_attachment_repository.redefine_project_task_attachments()


@api_view(['POST'])
@permission_classes([AllowAny])
def manage_project_reminder(request, projectId, taskId): 
    return project_reminder_repository.manage_project_reminder(request, projectId, taskId)
    
    
#############################################
# QUIT PROJECT REMAINDER
#############################################


@api_view(['POST'])
@permission_classes([AllowAny])
def quit_project_reminder(request, id): 
    return project_reminder_repository.quit_project_reminder(request, id)
    
    
#############################################
# DOWNLOAD ALL FILES IN PROJECT
#############################################


@api_view(['GET'])
@permission_classes([AllowAny])
def download_s3_archive(request):
    return project_extra_repository.download_s3_archive(request)


#############################################
# CREATE DEFAULT MATERIAL
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_default_material(request):
    return project_default_material_repository.create_default_material(request)
    
    
#############################################
# EDIT DEFAULT MATERIAL
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_default_material(request, id):
    return project_default_material_repository.edit_default_material(request, id)
    

#############################################
# DELETE DEFAULT MATERIAL
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_material(request, id):
    return project_default_material_repository.delete_default_material(request, id)
    
#############################################
# DELETE DEFAULT MATERIAL
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_default_materials(request):
    return project_default_material_repository.delete_default_materials(request)


#############################################
# MANAGE WORK ORDER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def manage_work_order(request, id):
    return project_work_orders_repository.manage_project_work_order(request, id)


#############################################
# DELETE WORK ORDER
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_work_order(request, project_id, id):
    return project_work_orders_repository.delete_project_work_order(request, project_id, id)


#############################################
# FINISH WORK ORDER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def finish_work_order(request, project_id, id):
    return project_work_orders_repository.finish_project_work_order(request, project_id, id)


##############################################
# CREATE PROJECT CALENDAR NOTE
##############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_project_calendar_note(request):
    return project_calendar_notes_repository.create_project_calendar_note(request)


##############################################
# UPDATE PROJECT CALENDAR NOTE
##############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_project_calendar_note(request, id):
    return project_calendar_notes_repository.update_project_calendar_note(request, id)


##############################################
# DELETE PROJECT CALENDAR NOTE
##############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_calendar_note(request, id):
    return project_calendar_notes_repository.delete_project_calendar_note(request, id)


##############################################
# TRIGGER PROFIT REBUILD
##############################################

@api_view(['POST'])
@permission_classes([AllowAny])  # o la que uses
def trigger_profit_rebuild(request):
    """
    Dispara el recálculo de profit de TODOS los proyectos en background.
    """
    async_result = task_manage_profit_report.delay(force_update=True)

    return Response(
        {
            "message": "Profit report recalculation scheduled.",
            "task_id": async_result.id,
            "status": "scheduled",
        },
        status=status.HTTP_202_ACCEPTED,
    )
    
    
##############################################
# MANAGE PROFIT REPORT
##############################################

@api_view(['POST'])
@permission_classes([AllowAny])  # o la que uses
def manage_profit_report(request, id):
    return project_profit_report_repository.update_profit_report(id, request)


##############################################
# CREATE PROJECT INSTALLATION CREW
##############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_project_installation_crew(request):
    return project_installation_crew_repository.create_project_installation_crew(request)


#############################################
# EDIT PROJECT INSTALLATION CREW
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_project_installation_crew(request, id):
    return project_installation_crew_repository.edit_project_installation_crew(request, id)


#############################################
# DELETE PROJECT INSTALLATION CREW
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_project_installation_crew(request, id):
    return project_installation_crew_repository.delete_project_installation_crew(request, id)


#############################################
# DELETE LIST OF PROJECT INSTALLATION CREWS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_list_of_project_installation_crews(request):
    return project_installation_crew_repository.delete_project_installation_crews(request)