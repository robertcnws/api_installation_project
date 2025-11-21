from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
from api_projects.models import (
    ProjectTracking,
)

from api_services.models import (
    Service,
)

import json


#############################################
# CHANGE SERVICE PROPERTIES
#############################################

def change_service_properties(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    has_to_pay_str = data.get('hasToPay', 'false')
    if 'hasToPay' in data:
        if isinstance(has_to_pay_str, bool):
            has_to_pay = has_to_pay_str
        else:
            has_to_pay = True if has_to_pay_str.lower() == 'true' else False
    
    paid_str = data.get('paid', 'false')
    if 'paid' in data:
        if isinstance(paid_str, bool):
            paid = paid_str
        else:
            paid = True if paid_str.lower() == 'true' else False
        
    by_factory_str = data.get('byFactory', 'false')
    if 'byFactory' in data:
        if isinstance(by_factory_str, bool):
            by_factory = by_factory_str
        else:
            by_factory = True if by_factory_str.lower() == 'true' else False
        
    repired_str = data.get('repaired', 'false')
    if 'repaired' in data:
        if isinstance(repired_str, bool):
            repaired = repired_str
        else:
            repaired = True if repired_str.lower() == 'true' else False
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    include_fields = ['id', 'name']
    properties = []
    tasks = service.service_default_tasks if service.service_default_tasks else []
    task_3 = next((task for task in tasks if task['service_default_task']['order'] == 3), None)
    task_4 = next((task for task in tasks if task['service_default_task']['order'] == 4), None)
    task_5 = next((task for task in tasks if task['service_default_task']['order'] == 5), None)
    task_6 = next((task for task in tasks if task['service_default_task']['order'] == 6), None)
    task_7 = next((task for task in tasks if task['service_default_task']['order'] == 7), None)
    
    after_tasks = [
        t for t in tasks if t['service_default_task']['order'] > task_5['service_default_task']['order'] and\
        (t['service_default_task']['service_stage']['name'].lower() == 'repair' or\
        t['service_default_task']['service_stage']['name'].lower() == 'preparation')
    ]
    final_after_tasks = after_tasks if after_tasks else []
    if len(service.users_service_team) > 0:
        final_after_tasks = [task for task in final_after_tasks if str(task['service_default_task']['_id']) != str(task_7['service_default_task']['_id'])]
    if service.start_date:
        final_after_tasks = [task for task in final_after_tasks if str(task['service_default_task']['_id']) != str(task_6['service_default_task']['_id'])]
        
    closing_tasks = [task for task in tasks if task['service_default_task']['service_stage']['name'].lower() == 'closing']
    first_closing_task = min(closing_tasks, key=lambda x: x['service_default_task']['order']) if closing_tasks else None    
    
    if 'hasToPay' in data:
        task_3['user_reporter'] = user_reporter
        task_3['last_modified_time'] = timezone.now()
        service.has_to_pay = has_to_pay
        include_fields.append('has_to_pay')
        properties.append('has to pay')
        if not has_to_pay:
            service.paid = False
            include_fields.append('paid')
            properties.append('paid')
            if task_3:
                task_3['service_default_task']['is_active'] = False
                task_3['status'] = 'not started'
                task_3['percentage'] = 0
        elif task_3:
            task_3['service_default_task']['is_active'] = True
            task_3['status'] = 'in progress'
            task_3['percentage'] = 50
        tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_3['service_default_task']['_id'])]
        tasks.append(task_3) 
        
    if 'paid' in data:
        task_3['user_reporter'] = user_reporter
        task_3['last_modified_time'] = timezone.now()
        service.paid = paid
        include_fields.append('paid')
        properties.append('paid')
        if not paid:
            if task_3:
                task_3['status'] = 'in progress'
                task_3['percentage'] = 50
        elif task_3:
            task_3['status'] = 'finished'
            task_3['percentage'] = 100
        tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_3['service_default_task']['_id'])]
        tasks.append(task_3) 
        
    if 'byFactory' in data:
        task_5['user_reporter'] = user_reporter
        task_5['last_modified_time'] = timezone.now()
        service.by_factory = by_factory
        include_fields.append('by_factory')
        properties.append('by factory')
        
        if not by_factory:
            service.repaired = False
            include_fields.append('repaired')
            properties.append('repaired')
            
            if task_4:
                task_4['service_default_task']['is_active'] = True
                for task in final_after_tasks:
                    task['status'] = 'not started'
                    task['percentage'] = 0
                    task['service_default_task']['is_active'] = True
                if task_3['status'] == 'finished':
                    task_4['status'] = 'in progress'
                    task_4['percentage'] = 50
                tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_4['service_default_task']['_id'])]
                tasks.append(task_4) 
                tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in final_after_tasks]]
                tasks.extend(final_after_tasks)
            
            if task_5:
                task_5['status'] = 'not started'
                task_5['percentage'] = 0
                task_5['service_default_task']['is_active'] = False
                if closing_tasks:
                    for task in closing_tasks:
                        task['status'] = 'not started'
                        task['percentage'] = 0
                    tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in closing_tasks]]
                    tasks.extend(closing_tasks)
                
        elif task_5:
            task_5['status'] = 'in progress'
            task_5['percentage'] = 50
            task_5['service_default_task']['is_active'] = True
            task_4['service_default_task']['is_active'] = False
            task_4['status'] = 'not started'
            task_4['percentage'] = 0
            for task in final_after_tasks:
                task['status'] = 'not started'
                task['percentage'] = 0
                task['service_default_task']['is_active'] = False
            tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_4['service_default_task']['_id'])]
            tasks.append(task_4) 
            tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in final_after_tasks]]
            tasks.extend(final_after_tasks)
            tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(task_5['service_default_task']['_id'])]
            tasks.append(task_5) 
        
    if 'repaired' in data:
        task_5['user_reporter'] = user_reporter
        task_5['last_modified_time'] = timezone.now()
        service.repaired = repaired
        include_fields.append('repaired')
        properties.append('repaired')
        
        if not repaired:
            if task_5:
                task_5['status'] = 'in progress'
                task_5['percentage'] = 50
                if final_after_tasks:
                    for task in final_after_tasks:
                        task['status'] = 'not started'
                        task['percentage'] = 0
                        task['service_default_task']['is_active'] = False
                    tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in final_after_tasks]]
                    tasks.extend(final_after_tasks)
                if closing_tasks:
                    for task in closing_tasks:
                        task['status'] = 'not started'
                        task['percentage'] = 0
                    tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in closing_tasks]]
                    tasks.extend(closing_tasks)
                    
        elif task_5:
            task_4['status'] = 'finished'
            task_4['percentage'] = 100
            for task in final_after_tasks:
                task['status'] = 'not started'
                task['percentage'] = 0
                task['service_default_task']['is_active'] = False
            tasks = [t for t in tasks if str(t['service_default_task']['_id']) not in [str(task['service_default_task']['_id']) for task in final_after_tasks]]
            tasks.extend(final_after_tasks)
            if first_closing_task:
                first_closing_task['status'] = 'in progress'
                first_closing_task['percentage'] = 50
                tasks = [task for task in tasks if str(task['service_default_task']['_id']) != str(first_closing_task['service_default_task']['_id'])]
                tasks.append(first_closing_task)
                
    sorted_tasks = sorted(tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service properties ({service.id} - {service.name}) - {", ".join(properties)}',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=include_fields)
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed service properties {service.name} ({", ".join(properties)})'
        info_id=service.id
        type='change_service_properties'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)