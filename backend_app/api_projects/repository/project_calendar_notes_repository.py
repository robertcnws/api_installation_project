from api_measurements.models import Measurement
from api_services.models import Service
from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import (
    ProjectCalendarNotes, 
    ProjectTracking,
    Project,
)
from api_authorization.models import LoginUser
from api_projects.data_util import (
    parse_custom_date,
    transform_data_to_mongo,
    create_notification,
)
from collections import defaultdict
from datetime import datetime
from datetime import timezone as dt_timezone
from bson import ObjectId


import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    

#############################################
# MANAGE PROJECT CALENDAR NOTES
#############################################

EVENT_TYPE_MODEL_MAP = {
    "project": Project,
    "service": Service,
    "measurement": Measurement,
}

def fetch_mixed_objects(items, type_model_map):
    ids_by_type = defaultdict(list)

    for item in items:
        t = item.get("type")
        _id = item.get("id")

        if not t or not _id:
            continue

        if t not in type_model_map:
            continue

        ids_by_type[t].append(ObjectId(_id))
    
    objects_by_type_and_id = {}

    for t, ids in ids_by_type.items():
        model = type_model_map[t]
        
        qs = model.objects.filter(id__in=ids).only('id', 'name', 'number')
        
        objects_by_type_and_id[t] = {
            str(obj.id): obj
            for obj in qs
        }
    
    results = []

    for item in items:
        t = item.get("type")
        _id = item.get("id")

        if not t or not _id:
          continue

        obj_map = objects_by_type_and_id.get(t, {})
        obj = obj_map.get(str(_id))

        if obj is None:
            continue

        results.append({
            "type": t,
            "id": str(_id),
            "name": getattr(obj, 'name', None),
            "number": getattr(obj, 'number', None),
        })

    return results


def create_project_calendar_note(request):    
    data = request.data
    obj_user_reporter = {}
    if isinstance(data.get('userReporter', None), dict):
        obj_user_reporter = data.get('userReporter', None)
    elif isinstance(data.get('userReporter', None), str):
        obj_user_reporter = json.loads(data.get('userReporter', None))
    user_reporter = obj_user_reporter
    
    name = data.get('name', None)
    description = data.get('description', None)
    duration = data.get('duration', None)
    
    list_user_assignees = []
    if isinstance(data.get('userAssignees', None), list):
        list_user_assignees = data.get('userAssignees', None)
    elif isinstance(data.get('userAssignees', None), str):
        list_user_assignees = json.loads(data.get('userAssignees', None))
    user_assignees = [ObjectId(user_id) for user_id in list_user_assignees]
    
    obj_user_manager = {}
    if isinstance(data.get('userManager', None), dict):
        obj_user_manager = data.get('userManager', None)
    elif isinstance(data.get('userManager', None), str):
        obj_user_manager = json.loads(data.get('userManager', None))
    user_manager = obj_user_manager
    
    list_associated_events = []
    if isinstance(data.get('associatedEvents', None), list):
        list_associated_events = data.get('associatedEvents', None)
    elif isinstance(data.get('associatedEvents', None), str):
        list_associated_events = json.loads(data.get('associatedEvents', None))
    associated_events = list_associated_events
    
    is_active = data.get('isActive', True)
    action = 'create'
    start_date = parse_custom_date(logger, data.get('startDate')) \
        if data.get('startDate') else None
    if duration > 0:
        new_duration = duration - 1 if duration else 0
        end_date = start_date + timezone.timedelta(days=new_duration)
        end_date = parse_custom_date(logger, end_date)
    list_user_assignees = LoginUser.objects(id__in=user_assignees).only('id', 'username', 'first_name', 'last_name') \
                        if user_assignees else []
    mapped_associated_events = fetch_mixed_objects(associated_events, EVENT_TYPE_MODEL_MAP)
    
    list_user_assignees = [
        {
            'id': str(user.id),
            'username': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'name': f"{user.first_name} {user.last_name}",
        }
        for user in list_user_assignees
    ]    
    mapped_associated_events = [
        {
            'type': event.get('type'),
            'id': event.get('id'),
            'name': event.get('name'),
            'number': event.get('number'),
        }
        for event in mapped_associated_events
    ]
    
    project_calendar_note = ProjectCalendarNotes(
        name=name,
        description=description,
        start_date=start_date,
        duration=duration,
        end_date=end_date,
        user_reporter=user_reporter,
        user_assignees=list_user_assignees,
        user_manager=user_manager,
        user_installer=list_user_assignees[0] if list_user_assignees else None,
        associated_events=mapped_associated_events,
        is_active=is_active,
        created_time=datetime.now(dt_timezone.utc),
        last_modified_time=datetime.now(dt_timezone.utc),
    )
    project_calendar_note.save()
    
    include_fields = ['id', 'name', 'description', 'start_date', 'duration', 'end_date',
                      'user_assignees', 'user_manager', 'associated_events', 'is_active']
    
    exclude_fields = ['password']
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'{action} project calendar note ({project_calendar_note.id} - {project_calendar_note.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project_calendar_note, include_fields=include_fields, exclude_fields=exclude_fields)
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has {action}d project calendar note {project_calendar_note.name}'
        info_id=project_calendar_note.id
        type=f'{action}_project_calendar_note'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project calendar note created successfully',
        'data': json.loads(project_calendar_note.to_json())
    }, status=201)


def update_project_calendar_note(request, id): 
    
    project_calendar_note = ProjectCalendarNotes.objects(id=id).first()
    if not project_calendar_note:
        return Response({'error': 'Project Calendar Note not found'}, status=404)
    
    data = request.data
    obj_user_reporter = {}
    if isinstance(data.get('userReporter', None), dict):
        obj_user_reporter = data.get('userReporter', None)
    elif isinstance(data.get('userReporter', None), str):
        obj_user_reporter = json.loads(data.get('userReporter', None))
    user_reporter = obj_user_reporter
    
    name = data.get('name', None)
    description = data.get('description', None)
    duration = data.get('duration', None)
    
    list_user_assignees = []
    if isinstance(data.get('userAssignees', None), list):
        list_user_assignees = data.get('userAssignees', None)
    elif isinstance(data.get('userAssignees', None), str):
        list_user_assignees = json.loads(data.get('userAssignees', None))
    user_assignees = [ObjectId(user_id) for user_id in list_user_assignees]
    
    obj_user_manager = {}
    if isinstance(data.get('userManager', None), dict):
        obj_user_manager = data.get('userManager', None)
    elif isinstance(data.get('userManager', None), str):
        obj_user_manager = json.loads(data.get('userManager', None))
    user_manager = obj_user_manager
    
    list_associated_events = []
    if isinstance(data.get('associatedEvents', None), list):
        list_associated_events = data.get('associatedEvents', None)
    elif isinstance(data.get('associatedEvents', None), str):
        list_associated_events = json.loads(data.get('associatedEvents', None))
    associated_events = list_associated_events
    
    is_active = data.get('isActive', True)
    action = 'update'
    start_date = parse_custom_date(logger, data.get('startDate')) \
        if data.get('startDate') else project_calendar_note.start_date
    if duration > 0:
        new_duration = duration - 1 if duration else 0
        end_date = start_date + timezone.timedelta(days=new_duration)
        end_date = parse_custom_date(logger, end_date)
    list_user_assignees = LoginUser.objects(id__in=user_assignees).only('id', 'username', 'first_name', 'last_name') \
                        if user_assignees else []
    mapped_associated_events = fetch_mixed_objects(associated_events, EVENT_TYPE_MODEL_MAP)
    
    list_user_assignees = [
        {
            'id': str(user.id),
            'username': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'name': f"{user.first_name} {user.last_name}",
        }
        for user in list_user_assignees
    ]    
    mapped_associated_events = [
        {
            'type': event.get('type'),
            'id': event.get('id'),
            'name': event.get('name'),
            'number': event.get('number'),
        }
        for event in mapped_associated_events
    ]
    
    project_calendar_note.name = name \
        if name is not None else project_calendar_note.name
    project_calendar_note.description = description \
        if description is not None else project_calendar_note.description
    project_calendar_note.start_date = start_date \
        if start_date is not None else project_calendar_note.start_date
    project_calendar_note.duration = duration \
        if duration is not None else project_calendar_note.duration
    project_calendar_note.end_date = end_date \
        if duration is not None else project_calendar_note.end_date
    project_calendar_note.user_assignees = list_user_assignees \
        if user_assignees else project_calendar_note.user_assignees
    project_calendar_note.user_manager = user_manager \
        if user_manager is not None else project_calendar_note.user_manager
    project_calendar_note.associated_events = mapped_associated_events \
        if associated_events else project_calendar_note.associated_events
    project_calendar_note.is_active = is_active
    project_calendar_note.last_modified_time = datetime.now(dt_timezone.utc)
    project_calendar_note.user_installer = list_user_assignees[0] if list_user_assignees else None
    
    project_calendar_note.save()
    
    include_fields = ['id', 'name', 'description', 'start_date', 'duration', 'end_date',
                      'user_assignees', 'user_manager', 'associated_events', 'is_active']
    
    exclude_fields = ['password']
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'{action} project calendar note ({project_calendar_note.id} - {project_calendar_note.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project_calendar_note, include_fields=include_fields, exclude_fields=exclude_fields)
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has {action}d project calendar note {project_calendar_note.name}'
        info_id=project_calendar_note.id
        type=f'{action}_project_calendar_note'
        create_notification(module, info_id, info, type, user_reporter['username'])
            
    return Response({
        'message': 'Project calendar note updated successfully',
        'data': json.loads(project_calendar_note.to_json())
    }, status=201)
    
    
def delete_project_calendar_note(request, id):
    project_calendar_note = ProjectCalendarNotes.objects(id=id).first()
    if not project_calendar_note:
        return Response({'error': 'Project calendar note not found'}, status=404)
    
    data = request.data
    obj_user_reporter = {}
    if isinstance(data.get('userReporter', None), dict):
        obj_user_reporter = data.get('userReporter', None)
    elif isinstance(data.get('userReporter', None), str):
        obj_user_reporter = json.loads(data.get('userReporter', None))
    user_reporter = obj_user_reporter
    
    user_reporter = user_reporter \
        if data.get('userReporter') else project_calendar_note.user_reporter
    
    include_fields = ['id', 'name', 'description', 'start_date', 'duration', 'end_date',
                      'user_assignees', 'user_manager', 'associated_events', 'is_active']
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'delete project calendar note ({project_calendar_note.id} - {project_calendar_note.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project_calendar_note, include_fields=include_fields)
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has deleted project calendar note {project_calendar_note.name}'
        info_id=project_calendar_note.id
        type='delete_project_calendar_note'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    project_calendar_note.delete()
            
    return Response({
        'message': 'Project calendar note deleted successfully',
        'data': json.loads(project_calendar_note.to_json())
    }, status=200)