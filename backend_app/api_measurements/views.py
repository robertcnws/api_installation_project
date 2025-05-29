from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from api_measurements.repository import (
    measurement_comment_repository,
    measurement_crud_repository,
    measurement_extra_repository,
)


#############################################
# CREATE MEASUREMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_measurement(request):
    return measurement_crud_repository.create_measurement(request)
    
    
#############################################
# CHECK MARK IN MEASUREMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def check_mark(request, id):
    return measurement_extra_repository.check_mark(request, id)
    
    
#############################################
# DELETE MARK IN MEASUREMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_mark(request, id, mark_id):
    return measurement_extra_repository.delete_mark(request, id, mark_id)
    
    
#############################################
# DELETE MEASUREMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_measurement(request, id):
    return measurement_crud_repository.delete_measurement(request, id)
    

#############################################
# DELETE MEASUREMENTS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_measurements(request):
    return measurement_crud_repository.delete_measurements(request)
    
    
#############################################
# SAVE GENERAL NOTES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def save_general_notes(request, id):
    return measurement_extra_repository.save_general_notes(request, id)
    
    
#############################################
# CHANGE DATES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_date(request, id): 
    return measurement_extra_repository.change_date(request, id)
    
    
#############################################
# REMOVE DATE MEASUREMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def remove_date(request, id):
    return measurement_extra_repository.remove_date(request, id)
    
    
#############################################
# CHANGE ASSIGNEE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_assignee(request, id): 
    return measurement_extra_repository.change_assignee(request, id)
    
    
#############################################
# CHANGE ADDRESS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_address(request, id): 
    return measurement_extra_repository.change_address(request, id)
    
    
#############################################
# CHANGE PHONE NUMBER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_phone_number(request, id): 
    return measurement_extra_repository.change_phone_number(request, id)
    
    
#############################################
# CHANGE COLOR
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_color(request, id): 
    return measurement_extra_repository.change_color(request, id)
    
    
#############################################
# CREATE MEASUREMENT COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_comment(request, id): 
    return measurement_comment_repository.create_comment(request, id)
    
    
#############################################
# EDIT MEASUREMENT COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_comment(request, id, measurementId): 
    return measurement_comment_repository.edit_comment(request, id, measurementId)
    
    
#############################################
# DELETE MEASUREMENT COMMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_comment(request, id, measurementId): 
    return measurement_comment_repository.delete_comment(request, id, measurementId)