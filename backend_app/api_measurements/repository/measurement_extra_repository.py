from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
from api_projects.models import (
    ProjectTracking,
)
from api_measurements.models import (
    Measurement,
)

import json


#############################################
# CHECK MARK IN MEASUREMENT
#############################################

def check_mark(request, id):
    data = request.data
    try:
        measurement = Measurement.objects.filter(id=id).first()
        if not measurement:
            return Response({'error': 'Measurement not found'}, status=404)
        user_reporter = json.loads(data.get('userReporter', None))
        mark = json.loads(data.get('mark', None))
        if not mark:
            return Response({'error': 'Mark not found'}, status=404)
        
        marks = measurement.marks or []

        try:
            i = next(i for i, m in enumerate(marks) if m['line_item_id'] == mark['line_item_id'])
            marks.pop(i)
            marks.insert(i, mark)
        except StopIteration:
            marks.append(mark)

        measurement.marks = marks
        
        measurement.save()
        
        tracking_info = {
            'id': mark['line_item_id'],
            'type': mark['type'],
            'config': mark['config'],
            'dimensions': mark['dimensions'],
            'notes': mark['notes'],
            'first_check': mark['first_check'],
            'second_check': mark['second_check'],
        }
        
        action = 'check mark by second time' if mark['second_check'] else 'check mark by first time'
        past_action = 'checked mark by second time' if mark['second_check'] else 'checked mark by first time'
        icon_action = 'check_mark_by_second_time' if mark['second_check'] else 'check_mark_by_first_time'
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'{action} in measurement ({measurement.id})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='measurements'
            info=f'has {past_action} in measurement {measurement["number"]}'
            info_id=measurement.id
            type=f'{icon_action}_measurement'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': f'Measurement updated ({past_action}) successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE MARK IN MEASUREMENT
#############################################

def delete_mark(request, id, mark_id):
    data = request.data
    try:
        measurement = Measurement.objects.filter(id=id).first()
        if not measurement:
            return Response({'error': 'Measurement not found'}, status=404)
        user_reporter = json.loads(data.get('userReporter', None))
        
        marks = measurement.marks if measurement.marks else []
        marks = [mark for mark in marks if mark['line_item_id'] != mark_id]
        deleted_mark = next((mark for mark in measurement.marks if mark['line_item_id'] == mark_id), None)
        measurement.marks = marks
        measurement.save()
        
        tracking_info = {
            'id': deleted_mark['line_item_id'],
            'type': deleted_mark['type'],
            'config': deleted_mark['config'],
            'dimensions': deleted_mark['dimensions'],
            'notes': deleted_mark['notes'],
            'first_check': deleted_mark['first_check'],
            'second_check': deleted_mark['second_check'],
        }
        
        action = f'delete mark'
        past_action = 'deleted mark'
        icon_action = 'delete_mark'
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'{action} in measurement ({measurement.id})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='measurements'
            info=f'has {past_action} in measurement {measurement["number"]}'
            info_id=measurement.id
            type=f'{icon_action}_measurement'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': f'Measurement updated ({past_action}) successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# SAVE GENERAL NOTES
#############################################

def save_general_notes(request, id):
    data = request.data
    try:
        measurement = Measurement.objects.filter(id=id).first()
        if not measurement:
            return Response({'error': 'Measurement not found'}, status=404)
        user_reporter = json.loads(data.get('userReporter', None))
        general_notes = data.get('generalNotes', None)

        measurement.general_notes = general_notes if general_notes else None
        
        measurement.save()
        
        tracking_info = transform_data_to_mongo(measurement, include_fields=['general_notes'])
        
        action = 'save general notes'
        past_action = 'saved general notes'
        icon_action = 'save_general_notes'
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'{action} in measurement ({measurement.id})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='measurements'
            info=f'has {past_action} in measurement {measurement["number"]}'
            info_id=measurement.id
            type=f'{icon_action}_measurement'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': f'Measurement updated ({past_action}) successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE DATES
#############################################

def change_date(request, id): 
    
    measurement = Measurement.objects.filter(id=id).first()
    if not measurement:
        return Response({'error': 'Measurement not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else measurement.user_reporter
    
    include_fields = ['id', 'number']
    
    date_type_name = ''
    date_type = ''
    first_date = None
    check_date = None
    
    if data.get('firstDate', None):
        first_date = data.get('firstDate', None)
        include_fields.append('first_date')
        date_type_name = 'first date'
        date_type = 'first_date'
    
    if data.get('checkDate', None):
        check_date = data.get('checkDate', None)
        include_fields.append('check_date')
        date_type_name = 'check date'
        date_type = 'check_date'
    
    measurement.first_date = first_date if first_date else measurement.first_date
    measurement.check_date = check_date if check_date else measurement.check_date
    measurement.last_modified_time = timezone.now()
    measurement.user_reporter = user_reporter if user_reporter else measurement.user_reporter
        
    measurement.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change {date_type_name} in measurement ({measurement.id} - {measurement.number})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(measurement, include_fields=include_fields)
        },
    )
    tracking.save()
    
    if user_reporter:
        module='measurements'
        info=f'has changed {date_type_name} in measurement {measurement.number}'
        info_id=measurement.id
        type=f'change_{date_type}_measurement'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Measurement updated successfully',
        'data': json.loads(measurement.to_json())
    }, status=201)
    
    
#############################################
# REMOVE DATE MEASUREMENT
#############################################

def remove_date(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    date_type = data.get('dateType', None)
    info = ''
    try:
        measurement = Measurement.objects(id=id).first()
        if not measurement:
            return Response({'error': 'Measurement not found'}, status=404)
        
        if not date_type:
            return Response({'error': 'Date type is required'}, status=400)
        
        tracking_info = {}
        type_date = ''
        
        if date_type in ['firstDate']:
            info = 'first date'
            type_date = 'first_date'
            last_date = measurement.first_date if measurement.first_date else None
            measurement.first_date = None
            tracking_info = {
                'first_date': last_date,
            }
        elif date_type in ['checkDate']:
            info = 'check date'
            type_date = 'check_date'
            last_date = measurement.check_date if measurement.check_date else None
            measurement.check_date = None
            tracking_info = {
                'check_date': last_date,
            }
                
        measurement.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'remove {info} in measurement ({measurement.id} - {measurement.number})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='measurements'
            info=f'has removed {info} date in measurement {measurement.number}'
            info_id=measurement.id
            type=f'remove_{type_date}_measurement'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Date removed successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE ASSIGNEE
#############################################

def change_assignee(request, id): 
    
    measurement = Measurement.objects.filter(id=id).first()
    if not measurement:
        return Response({'error': 'Measurement not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else measurement.user_reporter
    
    include_fields = ['id', 'number']
    
    assignee_type_name = ''
    assignee_type = ''
    first_assignee = None
    check_assignee = None
    
    if data.get('firstAssignee', None):
        first_assignee = json.loads(data.get('firstAssignee', None))
        include_fields.append('first_assignee')
        assignee_type_name = 'first assignee'
        assignee_type = 'first_assignee'
    
    if data.get('checkAssignee', None):
        check_assignee = json.loads(data.get('checkAssignee', None))
        include_fields.append('check_assignee')
        assignee_type_name = 'check assignee'
        assignee_type = 'check_assignee'
    
    measurement.first_assignee = first_assignee if first_assignee else measurement.first_assignee
    measurement.check_assignee = check_assignee if check_assignee else measurement.check_assignee
    measurement.last_modified_time = timezone.now()
    measurement.user_reporter = user_reporter if user_reporter else measurement.user_reporter
        
    measurement.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change {assignee_type_name} in measurement ({measurement.id} - {measurement.number})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(measurement, include_fields=include_fields)
        },
    )
    tracking.save()
    
    if user_reporter:
        module='measurements'
        info=f'has changed {assignee_type_name} in measurement {measurement.number}'
        info_id=measurement.id
        type=f'change_{assignee_type}_measurement'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Measurement updated successfully',
        'data': json.loads(measurement.to_json())
    }, status=201)
    
    
#############################################
# CHANGE ADDRESS
#############################################

def change_address(request, id): 
    
    measurement = Measurement.objects(id=id).first()
    if not measurement:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else measurement.user_reporter
    
    measurement.address = data.get('address', measurement.address) if data.get('address') else measurement.address
    measurement.last_modified_time = timezone.now()
    measurement.user_reporter = user_reporter if user_reporter else measurement.user_reporter
        
    measurement.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change measurement address ({measurement.id} - {measurement.number})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(measurement, include_fields=['id', 'name', 'address'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='measurements'
        info=f'has changed address in measurement {measurement.number}'
        info_id=measurement.id
        type='change_measurement_address'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Measurement updated successfully',
        'data': json.loads(measurement.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PHONE NUMBER
#############################################

def change_phone_number(request, id): 
    
    measurement = Measurement.objects(id=id).first()
    if not measurement:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else measurement.user_reporter
    
    current_phone_number = measurement.sales_order.get('customer', None).get('phone', '') or measurement.sales_order.get('customer', None).get('mobile', '')
    
    phone_number = data.get('phoneNumber', current_phone_number) if data.get('phoneNumber') else current_phone_number
    
    sales_order = measurement.sales_order
    
    sales_order['customer']['phone'] = phone_number
    sales_order['customer']['mobile'] = phone_number
    
    measurement.sales_order = sales_order
    
    measurement.last_modified_time = timezone.now()
    measurement.user_reporter = user_reporter if user_reporter else measurement.user_reporter
        
    measurement.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change measurement phone number ({measurement.id} - {measurement.number})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(measurement, include_fields=['id', 'name', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='measurements'
        info=f'has changed phone number in measurement {measurement.number}'
        info_id=measurement.id
        type='change_measurement_phone_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Measurement updated successfully',
        'data': json.loads(measurement.to_json())
    }, status=201)
    
    
#############################################
# CHANGE COLOR
#############################################

def change_color(request, id): 
    
    measurement = Measurement.objects(id=id).first()
    if not measurement:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else measurement.user_reporter
    
    color = json.loads(data.get('color', None)) if data.get('color') else measurement.color
    
    measurement.color = color
    measurement.last_modified_time = timezone.now()
    measurement.user_reporter = user_reporter if user_reporter else measurement.user_reporter
        
    measurement.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change measurement color ({measurement.id} - {measurement.number})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(measurement, include_fields=['id', 'name', 'color'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='measurements'
        info=f'has changed color in measurement {measurement.number}'
        info_id=measurement.id
        type='change_measurement_color'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Measurement updated successfully',
        'data': json.loads(measurement.to_json())
    }, status=201)