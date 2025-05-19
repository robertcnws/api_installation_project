from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_entity_number,
    to_aware,
)
from api_projects.s3_utils import (
    delete_attachment_from_s3,
)
from api_projects.models import (
    ProjectTracking,
    Project,
)
from api_services.models import (
    Service,
)
from .models import (
    Measurement,
    MesurementAttachment,
    MeasurementComment,
)

import json

#############################################
# CREATE MEASUREMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_measurement(request):
    data = request.data
    try:
        project = None
        service = None
        sales_order = None
        items = None
        address = None
        installer = None
        customer = None
        
        user_reporter = json.loads(data.get('userReporter', None))
        
        if data.get('project', None) is not None:
            project = json.loads(data.get('project', None))
        if data.get('service', None) is not None:
            service = json.loads(data.get('service', None))
        if data.get('salesOrder', None) is not None:
            sales_order = json.loads(data.get('salesOrder', None))
        if data.get('items', None) is not None:
            items = json.loads(data.get('items', None))
        if data.get('address', None) is not None:
            address = data.get('address', None)
        if data.get('installer', None) is not None:
            installer = json.loads(data.get('installer', None)) if data.get('installer') else None
        if data.get('customer', None) is not None:
            customer = json.loads(data.get('customer', None)) if data.get('customer') else None
            address = customer.get('address', None) if customer.get('address') else address
        
        is_new = True
        
        if sales_order is not None:
            measurement = Measurement.objects.filter(
                sales_order__salesorder_id=sales_order.get('salesorder_id', None),
                is_active=True
            ).first()
            
        else:
            measurement = Measurement.objects.filter(
                customer__email=customer.get('email', None),
                is_active=True
            ).first()
        
        if measurement:
            is_new = False
            measurement.user_reporter = user_reporter
            measurement.project = project if project else None
            measurement.service = service if service else None
            measurement.check_assignee = installer if installer else measurement.check_assignee
            measurement.sales_order = sales_order if sales_order else measurement.sales_order
            measurement.address = address if address else measurement.address
            measurement.marks = items if items else measurement.marks
            measurement.customer = customer if customer else measurement.customer
            measurement.is_active = True
            measurement.last_modified_time = timezone.now()
            
        else:
            number = create_entity_number(
                sales_order.get('salesorder_number', None) if sales_order else None, 
                prefix='MR'
            )
            measurement = Measurement(
                number=number,
                user_reporter=user_reporter,
                project=project if project else None,
                service=service if service else None,
                check_assignee=installer if installer else None,
                sales_order=sales_order if sales_order else None,
                address=address,
                marks=items if items else [],
                is_active=True,
                customer=customer if customer else None,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
            )
        
        measurement.save()
        
        tracking_info = transform_data_to_mongo(measurement)
        action = 'update' if not is_new else 'create'
        obj_name = 'project' if project else 'service' if service else 'customer'
        obj = project if project else service if service else customer
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'{action} measurement ({tracking_info["id"]}) in {obj_name} {obj["name"]}',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='measurements'
            info=f'has {action}d {'new' if is_new else ''} measurement {measurement["number"]}'
            info_id=measurement.id
            type=f'{action}_measurement'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({
            'message': f'Measurement {action}d successfully',
            'data': tracking_info,
        }, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHECK MARK IN MEASUREMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
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

@api_view(['DELETE'])
@permission_classes([AllowAny])
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
# DELETE MEASUREMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_measurement(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        measurement = Measurement.objects(id=id).first()
        if not measurement:
            return Response({'error': 'Measurement not found'}, status=404)
        attachments = measurement.measurement_attachments if measurement.measurement_attachments else []
        MesurementAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
        for attachment in attachments:
            delete_attachment_from_s3(attachment['file'])
        measurement.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete measurement ({measurement.id} - {measurement.number})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(measurement, exclude_fields=['sales_order'])
            },
        )
        tracking.save()
        if user_reporter:
            module='measurements'
            info=f'has deleted measurement {measurement.number}'
            info_id=measurement.id
            type='delete_measurement'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Measurement deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE MEASUREMENTS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_measurements(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    list_tracking_info = []
    try:
        measurements = Measurement.objects(id__in=ids).all()
        if not measurements:
            return Response({'error': 'Measurements not found'}, status=404)
        for m in measurements:
            tracking_info = transform_data_to_mongo(m, exclude_fields=['sales_order'])
            list_tracking_info.append(tracking_info)
            attachments = m.measurement_attachments if m.measurement_attachments else []
            MesurementAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
            for attachment in attachments:
                delete_attachment_from_s3(attachment['file'])
            m.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list measurements',
            created_time=timezone.now(),
            managed_data={
                'data': list_tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='measurements'
            info=f'has deleted {len(ids)} measurements'
            info_id='list'
            type='delete_measurements'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Measurements deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# SAVE GENERAL NOTES
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
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

@api_view(['POST'])
@permission_classes([AllowAny])
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

@api_view(['POST'])
@permission_classes([AllowAny])
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

@api_view(['POST'])
@permission_classes([AllowAny])
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

@api_view(['POST'])
@permission_classes([AllowAny])
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

@api_view(['POST'])
@permission_classes([AllowAny])
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

@api_view(['POST'])
@permission_classes([AllowAny])
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
    
    
#############################################
# CREATE MEASUREMENT COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_comment(request, id): 
    
    m = Measurement.objects(id=id).first()
    if not m:
        return Response({'error': 'Measurement not found'}, status=404)
    
    last_comments = m.measurement_comments if m.measurement_comments else []
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    text_comment = data.get('comment', None)
    
    task = None
    
    if not text_comment:
        return Response({'error': 'Comment is required'}, status=400)
    
    new_comment = MeasurementComment(
        comment=text_comment,
        created_time=timezone.now(),
        last_modified_time=timezone.now(),
        user_reporter=user_reporter,
        measurement=transform_data_to_mongo(m, include_fields=['id', 'number']),
        measurement_default_task=task if task else None,
        measurement_default_task_comment_attachments=[]
    )
    
    new_comment.save()
    
    last_comments.append(transform_data_to_mongo(new_comment))
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    
    m.last_modified_time = timezone.now()
    m.measurement_comments = sorted_comments
        
    m.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'create comment in measurement ({m.id} - {m.number})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(m, include_fields=['id', 'number', 'measurement_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='measurements'
        info=f'has created comment in measurement {m.number}'
        info_id=m.id
        type='create_measurement_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in measurement created successfully',
        'data': json.loads(m.to_json())
    }, status=201)
    
    
#############################################
# EDIT MEASUREMENT COMMENT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_comment(request, id, measurementId): 
    
    m = Measurement.objects(id=measurementId).first()
    if not m:
        return Response({'error': 'Measurement not found'}, status=404)
    
    last_comments = m.measurement_comments if m.measurement_comments else []
    last_comments = [comment for comment in last_comments if str(comment['id']) != id]
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    text_comment = data.get('comment', None)
    
    task = None
    
    if not text_comment:
        return Response({'error': 'Comment is required'}, status=400)
    
    existing_comment = MeasurementComment.objects(id=id).first()
    
    if existing_comment:
        existing_comment.comment = text_comment
        existing_comment.last_modified_time = timezone.now()
        existing_comment.user_reporter = user_reporter
        existing_comment.measurement = transform_data_to_mongo(m, include_fields=['id', 'number'])
        existing_comment.measurement_default_task = task if task else None
        existing_comment.save()
    else:
        existing_comment = MeasurementComment(
            comment=text_comment,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            user_reporter=user_reporter,
            measurement=transform_data_to_mongo(m, include_fields=['id', 'number']),
            measurement_default_task=task if task else None,
            measurement_default_task_comment_attachments=[]
        )
        existing_comment.save()
    
    last_comments.append(transform_data_to_mongo(existing_comment))
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    m.last_modified_time = timezone.now()
    m.measurement_comments = sorted_comments
        
    m.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'edit comment ({existing_comment.id}) in measurement ({m.id} - {m.number})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(m, include_fields=['id', 'number', 'measurement_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='measurements'
        info=f'has updated comment in measurement {m.number}'
        info_id=m.id
        type='update_measurement_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in measurement edited successfully',
        'data': json.loads(m.to_json())
    }, status=201)
    
    
#############################################
# DELETE SERVICE COMMENT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_comment(request, id, measurementId): 
    
    m = Measurement.objects(id=measurementId).first()
    if not m:
        return Response({'error': 'Measurement not found'}, status=404)
    
    last_comments = m.measurement_comments if m.measurement_comments else []
    
    last_comments = [comment for comment in last_comments if str(comment['id']) != str(id)]
    last_comments = last_comments if last_comments else []
            
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    
    existing_comment = MeasurementComment.objects(id=id).first()
    
    if existing_comment:
        existing_comment.delete()
    
    sorted_comments = sorted(last_comments, key=lambda x: to_aware(x['created_time']), reverse=True)
    
    m.last_modified_time = timezone.now()
    m.measurement_comments = sorted_comments
        
    m.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'delete comment in measurement ({m.id} - {m.number})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(m, include_fields=['id', 'number', 'service_comments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='measurements'
        info=f'has deleted comment in measurement {m.number}'
        info_id=m.id
        type='delete_measurement_comment'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Comment in measurement deleted successfully',
        'data': json.loads(m.to_json())
    }, status=201)