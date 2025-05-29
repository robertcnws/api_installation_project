from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
    to_aware,
)
from api_projects.models import (
    ProjectTracking,
)
from api_measurements.models import (
    Measurement,
    MeasurementComment,
)

import json

#############################################
# CREATE MEASUREMENT COMMENT
#############################################

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
# DELETE MEASUREMENT COMMENT
#############################################

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