from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from api_services.repository import (
    service_crud_repository,
    service_default_task_repository,
    service_extra_repository,
    service_issue_repository,
    service_properties_repository,
    service_stage_repository,
    service_task_comment_repository,
)



#############################################
# CREATE SERVICE ISSUE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_issue(request):
    return service_issue_repository.create_service_issue(request)
    
    
#############################################
# EDIT SERVICE ISSUE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_issue(request, id):
    return service_issue_repository.edit_service_issue(request, id)
    

#############################################
# DELETE SERVICE ISSUE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_issue(request, id):
    return service_issue_repository.delete_service_issue(request, id)
    
#############################################
# DELETE SERVICE ISSUES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_issues(request):
    return service_issue_repository.delete_service_issues(request)
    
    
#############################################
# CREATE SERVICE STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_stage(request):
    return service_stage_repository.create_service_stage(request)
    
    
#############################################
# EDIT SERVICE STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_stage(request, id):
    return service_stage_repository.edit_service_stage(request, id)
    

#############################################
# DELETE SERVICE STAGE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_stage(request, id):
    return service_stage_repository.delete_service_stage(request, id)
    
#############################################
# DELETE SERVICE STAGES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_stages(request):
    return service_stage_repository.delete_service_stages(request)
    
    
#############################################
# CREATE SERVICE DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_default_task(request):
    return service_default_task_repository.create_service_default_task(request)
    
    
#############################################
# EDIT SERVICE DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_default_task(request, id):
    return service_default_task_repository.edit_service_default_task(request, id)
    

#############################################
# DELETE SERVICE DEFAULT TASK
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_default_task(request, id):
    return service_default_task_repository.delete_service_default_task(request, id)
    
#############################################
# DELETE SERVICE DEFAULT TASKS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_default_tasks(request):
    return service_default_task_repository.delete_service_default_tasks(request)
    
    
#############################################
# CREATE SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def create_service(request):
    return service_crud_repository.create_service(request)
    
    
#############################################
# UPDATE SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_service(request, id):
    return service_crud_repository.update_service(request, id)
    

#############################################
# DELETE SERVICE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service(request, id):
    return service_crud_repository.delete_service(request, id)
    
#############################################
# DELETE SERVICES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_services(request):
    return service_crud_repository.delete_services(request)
    
    
#############################################
# ADD NEW ISSUE SERVICE
#############################################

    
@api_view(['POST'])
@permission_classes([AllowAny])
def add_new_issue_service(request, id, issued_product_id):
    return service_extra_repository.add_new_issue_service(request, id, issued_product_id)
    
    
#############################################
# DELETE ISSUE SERVICE
#############################################

    
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_issue_service(request, id, issued_product_id, issue_id):
    return service_extra_repository.delete_issue_service(request, id, issued_product_id, issue_id)
    
#############################################
# EDIT ISSUE SERVICE
#############################################

    
@api_view(['POST'])
@permission_classes([AllowAny])
def edit_issue_service(request, id, issued_product_id, issue_id):
    return service_extra_repository.edit_issue_service(request, id, issued_product_id, issue_id)
    
    
#############################################
# CHANGE PHONE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_phone_number(request, id): 
    return service_extra_repository.change_service_phone_number(request, id)
    
    
#############################################
# CHANGE REFERENCE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_reference_number(request, id): 
    return service_extra_repository.change_service_reference_number(request, id)
    
    
#############################################
# CHANGE ADDRESS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_address(request, id): 
    return service_extra_repository.change_service_address(request, id)
    
    
#############################################
# CHANGE MANAGER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_manager(request, id): 
    return service_extra_repository.change_service_manager(request, id)
    
    
#############################################
# CHANGE SERVICE TEAM
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_team(request, id): 
    return service_extra_repository.change_service_team(request, id)
    
    
#############################################
# CHANGE DATES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_dates(request, id): 
    return service_extra_repository.change_service_dates(request, id)
    
    
#############################################
# ADD ISSUED PRODUCT TO SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def add_issued_products(request, id):
    return service_extra_repository.add_issued_products(request, id)
    
    
#############################################
# SET SERVICE PLACE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def set_service_place(request, id): 
    return service_extra_repository.set_service_place(request, id)
    
    
#############################################
# CHANGE SERVICE TYPE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_type(request, id): 
    return service_extra_repository.change_service_type(request, id)


#############################################
# CHANGE STATUS SERVICE DEFAULT TASK
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_status_service_default_task(request, serviceId, id):
    return service_extra_repository.change_status_service_default_task(request, serviceId, id)
    
    
#############################################
# CHANGE SERVICE NOTES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_notes(request, id): 
    return service_extra_repository.change_service_notes(request, id)
    
    
#############################################
# DELETE SERVICE FILE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_file(request, id, folder, file):
    return service_crud_repository.delete_service_file(request, id, folder, file)
    
    
#############################################
# UPLOAD FILES TO SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_files_to_service(request, id): 
    return service_crud_repository.upload_files_to_service(request, id)
    
    
#############################################
# GET FILE URL
#############################################
    
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_default_file_url(request):
    return service_crud_repository.get_default_file_url(request)


#############################################
# CREATE SERVICE COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_comment(request, id): 
    return service_task_comment_repository.create_service_comment(request, id)
    
    
#############################################
# EDIT SERVICE COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_comment(request, id, serviceId): 
    return service_task_comment_repository.edit_service_comment(request, id, serviceId)
    
    
#############################################
# DELETE SERVICE COMMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_comment(request, id, serviceId): 
    return service_task_comment_repository.delete_service_comment(request, id, serviceId)
    

#############################################
# CHANGE SERVICE PROPERTIES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_service_properties(request, id): 
    return service_properties_repository.change_service_properties(request, id)
    
    
#############################################
# REMOVE DATE SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def remove_date_service(request, id):
    return service_crud_repository.remove_date_service(request, id)
    
    
#############################################
# CLOSE SERVICE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def close_service(request, id):
    return service_crud_repository.close_service(request, id)
    
    
#############################################
# DOWNLOAD ALL FILES IN SERVICE
#############################################


@api_view(['GET'])
@permission_classes([AllowAny])
def download_s3_archive(request):
    return service_crud_repository.download_s3_archive(request)
