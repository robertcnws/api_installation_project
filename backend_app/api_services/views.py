from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
from api_projects.models import (
    ProjectTracking,
)

from .models import (
    ServiceIssue,
    Service,
)
#############################################
# CREATE SERVICE ISSUE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_service_issue(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        service_issue = ServiceIssue.objects(name=name).first()
        if service_issue:
            return Response({'error': 'Service issue already exists'}, status=404)
        service_issue = ServiceIssue(
            name=name,
            description=description,
            user_reporter=user_reporter,
        )
        service_issue.save()
        tracking_info = transform_data_to_mongo(service_issue)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create service issue ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_issues'
            info=f'has created new service issue {service_issue.name}'
            info_id=service_issue.id
            type='create_service_issue'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT STAGE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_service_issue(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        service_issue = ServiceIssue.objects(name=name).first()
        if service_issue and str(service_issue.id) != id:
            return Response({'error': 'Service issue already exists'}, status=404)
        service_issue = ServiceIssue.objects(id=id).first()
        if not service_issue:
            return Response({'error': 'Service issue not found'}, status=404)
        service_issue.user_reporter = user_reporter
        service_issue.name = name
        service_issue.description = description
        service_issue.save()
        tracking_info = transform_data_to_mongo(service_issue)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update service_issue ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_issues'
            info=f'has updated service issue {service_issue.name}'
            info_id=service_issue.id
            type='update_service_issue'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE STAGE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_issue(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        service_issue = ServiceIssue.objects(id=id).first()
        if not service_issue:
            return Response({'error': 'Service issue not found'}, status=404)
        tracking_info = transform_data_to_mongo(service_issue)
        service_issue.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service issue ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_issues'
            info=f'has deleted service issue {service_issue.name}'
            info_id=service_issue.id
            type='delete_service_issue'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE STAGES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_service_issues(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        service_issues = ServiceIssue.objects(id__in=ids).all()
        if not service_issues:
            return Response({'error': 'Service issues not found'}, status=404)
        tracking_info = [transform_data_to_mongo(service_issue) for service_issue in service_issues]
        ServiceIssue.objects(id__in=ids).delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list service issues',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_issues'
            info=f'has deleted {len(ids)} service issues'
            info_id='list'
            type='delete_service_issues'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issues deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)