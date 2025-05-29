from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_entity_number,
)
from api_projects.s3_utils import (
    delete_attachment_from_s3,
)
from api_projects.models import (
    ProjectTracking,
    Project,
)
from api_measurements.models import (
    Measurement,
    MesurementAttachment,
)

import json

#############################################
# CREATE MEASUREMENT
#############################################

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
            
            if project:
                project_entity = Project.objects(id=project.get('id')).first()
                if project_entity:
                    tasks = project_entity.project_default_tasks if project_entity.project_default_tasks else []
                    ckeck_measurement_task = next(
                        (
                            task for task in tasks if 'check' in task.get('project_default_task', '').get('name', '').lower() and \
                                'measurement' in task.get('project_default_task', '').get('name', '').lower()
                        ),
                        None
                    )
                    if ckeck_measurement_task:
                        default_tasks = [
                            task for task in tasks if \
                                task.get('project_default_task', {}).get('id', '') != ckeck_measurement_task.get('project_default_task', {}).get('id', '')
                        ]
                        ckeck_measurement_task['status'] = 'finished'
                        ckeck_measurement_task['percentage'] = 100
                        ckeck_measurement_task['user_reporter'] = user_reporter
                        ckeck_measurement_task['last_modified_time'] = timezone.now()
                        
                        not_started_tasks = [
                            t for t in default_tasks if \
                                t.get('status', '') == 'not started' and \
                                t.get('project_default_task', {}).get('order', 0) > ckeck_measurement_task.get('project_default_task', {}).get('order', 0)
                        ]
        
                        if not project_entity.has_permission:
                            not_started_tasks = [
                                t for t in not_started_tasks if \
                                    t.get('project_default_task', {}).get('project_stage', {}).get('name', '') != 'Permission'
                            ]
                            
                        sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt.get('project_default_task', {}).get('order', 0))
                        
                        def get_next_task(task, sorted_tasks):
                            return next((
                                    tt for tt in sorted_tasks if \
                                    tt.get('project_default_task', {}).get('order', 0) > task.get('project_default_task', {}).get('order', 0)
                                ), None
                            )
                            
                        next_task = get_next_task(ckeck_measurement_task, sorted_tasks)
                        
                        if next_task:
                            default_tasks = [
                                task for task in default_tasks if \
                                    task.get('project_default_task', {}).get('id', '') != next_task.get('project_default_task', {}).get('id', '')
                            ]
                            next_task['status'] = 'in progress'
                            next_task['percentage'] = 50
                            next_task['user_reporter'] = user_reporter
                            next_task['last_modified_time'] = timezone.now()
                            
                            default_tasks.append(next_task)
                        
                        default_tasks.append(ckeck_measurement_task)
                        default_tasks = sorted(default_tasks, key=lambda x: x.get('project_default_task', {}).get('order', 0))
                        project_entity.project_default_tasks = default_tasks
                        project_entity.save()
                        
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
# DELETE MEASUREMENT
#############################################

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