from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import ProjectInstallationCrew, ProjectTracking
from api_authorization.models import LoginUser
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)

import json
import logging

##############################################
# CREATE PROJECT INSTALLATION CREW
##############################################

# class ProjectInstallationCrew(Document):
#     users_installers = ListField(DynamicField(), default=list, null=True)
#     users_helpers = ListField(DynamicField(), default=list, null=True)
#     cost_by_unit = FloatField(default=0.0)
#     unit = StringField(max_length=255, null=True)
#     type_crew = StringField(max_length=255, null=True)
#     description = StringField(null=True)
#     created_time = DateTimeField(default=timezone.now, null=True)
#     last_modified_time = DateTimeField(default=timezone.now, null=True)
#     is_active = BooleanField(default=True)

def create_project_installation_crew(request):
    data = request.data
    try:
        name = data.get('name', '')
        users_installers = data.get('usersInstallers', [])
        users_helpers = data.get('usersHelpers', [])
        cost_by_unit = data.get('costByUnit', 0.0)
        unit = data.get('unit', None)
        type_crew = data.get('typeCrew', None)
        description = data.get('description', '')
        user_reporter = data.get('userReporter', None)
        is_active = data.get('isActive', True)
        
        users_installers_objs = [LoginUser.objects(id=user.get('id', None)).first() for user in users_installers]
        
        # users_installers = [
        #     transform_data_to_mongo(
        #         user, include_fields=['id', 'username', 'email', 'first_name', 'last_name', 'name']
        #     ) for user in users_installers_objs if user
        # ]
        
        if len(users_installers_objs) != len(users_installers):
            return Response({'error': 'One or more installer users not found'}, status=404)
        
        if isinstance(user_reporter, str):
            user_reporter = json.loads(user_reporter)
            
        crew = ProjectInstallationCrew(
            name=name,
            users_installers=users_installers,
            users_helpers=users_helpers,
            cost_by_unit=cost_by_unit,
            unit=unit,
            type_crew=type_crew,
            description=description,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            is_active=is_active,
            user_reporter=user_reporter,
        )
        crew.save()
        
        tracking_info = transform_data_to_mongo(crew)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create installation crew ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='installation_crews'
            info=f'has created new installation crew {crew.name} with installer(s) {[installer["username"] for installer in users_installers]}'
            info_id=crew.id
            type='create_installation_crew'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        
        return Response({'message': 'Project installation crew created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
##############################################
# EDIT PROJECT INSTALLATION CREW
##############################################

def edit_project_installation_crew(request, id):
    data = request.data
    try:
        name = data.get('name', '')
        users_installers = data.get('usersInstallers', [])
        users_helpers = data.get('usersHelpers', [])
        cost_by_unit = data.get('costByUnit', 0.0)
        unit = data.get('unit', None)
        type_crew = data.get('typeCrew', None)
        description = data.get('description', '')
        user_reporter = data.get('userReporter', None)
        is_active = data.get('isActive', True)
        
        users_installers_objs = [LoginUser.objects(id=user.get('id', None)).first() for user in users_installers]
        
        if len(users_installers_objs) != len(users_installers):
            return Response({'error': 'One or more installer users not found'}, status=404)
        
        # users_installers = [
        #     transform_data_to_mongo(
        #         user, include_fields=['id', 'username', 'email', 'first_name', 'last_name', 'name']
        #     ) for user in users_installers_objs if user
        # ]
        
        if isinstance(user_reporter, str):
            user_reporter = json.loads(user_reporter)
        
        crew = ProjectInstallationCrew.objects(id=id).first()
        if not crew:
            return Response({'error': 'Project installation crew not found'}, status=404)
        
        crew.name = name
        crew.users_installers = users_installers
        crew.users_helpers = users_helpers
        crew.cost_by_unit = cost_by_unit
        crew.unit = unit
        crew.type_crew = type_crew
        crew.description = description
        crew.last_modified_time = timezone.now()
        crew.is_active = is_active
        crew.user_reporter = user_reporter
        crew.save()
        
        tracking_info = transform_data_to_mongo(crew)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'edit installation crew ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='installation_crews'
            info=f'has edited installation crew {crew.name} with installer(s) {[installer["username"] for installer in users_installers]}'
            info_id=crew.id
            type='edit_installation_crew'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        return Response({'message': 'Project installation crew edited successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE PROJECT INSTALLATION CREW
#############################################

def delete_project_installation_crew(request, id):
    data = request.data
    try:
        user_reporter = data.get('userReporter', None)
        crew = ProjectInstallationCrew.objects(id=id).first()
        if not crew:
            return Response({'error': 'Project installation crew not found'}, status=404)
        
        tracking_info = transform_data_to_mongo(crew)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete installation crew ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='installation_crews'
            info=f'has deleted installation crew {crew.name}'
            info_id=crew.id
            type='delete_installation_crew'
            create_notification(module, info_id, info, type, user_reporter['username'])
        
        crew.delete()
        
        return Response({'message': 'Project installation crew deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE INSTALLATION CREWS
#############################################

def delete_project_installation_crews(request):
    data = request.data
    try:
        ids = data.get('ids', [])
        user_reporter = data.get('userReporter', None)
        list_tracking_info = []
        list_to_delete = []
        for id in ids:
            crew = ProjectInstallationCrew.objects(id=id).first()
            if crew:
                tracking_info = transform_data_to_mongo(crew)
                list_tracking_info.append(tracking_info)
                list_to_delete.append(crew)
                
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list installation crews ({", ".join([crew["name"] for crew in list_tracking_info])})',
            created_time=timezone.now(),
            managed_data={
                'data': list_tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='installation_crews'
            info=f'has deleted list of installation crew ({", ".join([crew["name"] for crew in list_tracking_info])})'
            info_id=','.join(ids)
            type='delete_list_installation_crew'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        for crew in list_to_delete:
            crew.delete()
        
        return Response({'message': 'Project installation crews deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    