from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
    get_current_stage_from_tasks,
)
from api_projects.models import (
    ProjectTracking,
)

from api_services.models import (
    Service,
    ServiceStage,
)

from api_services.utils import (
    updated_tasks,
)
import json

#############################################
# ADD NEW ISSUE SERVICE
#############################################

def add_new_issue_service(request, id, issued_product_id):
    data = request.data   
    user_reporter = json.loads(data.get('userReporter', None))
    quantity = data.get('quantity', 0)
    notes = data.get('notes', None)
    issue_service = json.loads(data.get('issueService', None))
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        issued_products = service.issued_products if service.issued_products else []
        
        issued_product = next((product for product in issued_products if str(product.get('line_item_id')) == issued_product_id), None)
        if not issued_product:
            return Response({'error': 'Issued product not found'}, status=404)
        
        if issue_service.get('id') in [issue.get('issue').get('id') for issue in issued_product.get('issues', [])]:
            return Response({'error': 'Issue already exists'}, status=404)
        
        issues = issued_product.get('issues', [])
        
        max_id = max([int(issue.get('id')) for issue in issues]) if issues else 0
        
        issues.append({
            'issue': issue_service,
            'quantity': quantity,
            'created_time': timezone.now(),
            'last_modified_time': timezone.now(),
            'notes': notes,
            'color': 'default',
            'id': int(max_id) + 1,
        })
        
        issued_product['issues'] = issues
        issued_products = [product for product in issued_products if str(product.get('line_item_id')) != issued_product_id]
        issued_products.append(issued_product)
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.issued_products = issued_products
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'issued_products'])
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'add new issue to service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has added new issue to service {service.name}'
            info_id=service.id
            type='add_new_issue_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue added successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE ISSUE SERVICE
#############################################

def delete_issue_service(request, id, issued_product_id, issue_id):
    data = request.data   
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        issued_products = service.issued_products if service.issued_products else []
        
        issued_product = next((product for product in issued_products if str(product.get('line_item_id')) == issued_product_id), None)
        if not issued_product:
            return Response({'error': 'Issued product not found'}, status=404)
        
        issues = issued_product.get('issues', [])
        
        issues = [issue for issue in issues if str(issue.get('id')) != issue_id]
        
        issued_product['issues'] = issues
        issued_products = [product for product in issued_products if str(product.get('line_item_id')) != issued_product_id]
        
        if len(issues) > 0:
            issued_products.append(issued_product)
            
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.issued_products = issued_products
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'issued_products'])
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete issue to service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has deleted issue to service {service.name}'
            info_id=service.id
            type='delete_issue_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# EDIT ISSUE SERVICE
#############################################

def edit_issue_service(request, id, issued_product_id, issue_id):
    data = request.data   
    user_reporter = json.loads(data.get('userReporter', None))
    quantity = data.get('quantity', 0)
    notes = data.get('notes', None)
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        issued_products = service.issued_products if service.issued_products else []
        
        issued_product = next((product for product in issued_products if str(product.get('line_item_id')) == issued_product_id), None)
        if not issued_product:
            return Response({'error': 'Issued product not found'}, status=404)
        
        issues = issued_product.get('issues', [])
        
        issue = next((issue for issue in issues if str(issue.get('id')) == issue_id), None)
        if not issue:
            return Response({'error': 'Issue not found'}, status=404)
        
        issue['quantity'] = quantity
        issue['notes'] = notes
        issue['last_modified_time'] = timezone.now()
        
        issues = [issue for issue in issues if str(issue.get('id')) != issue_id]
        issues.append(issue)
        issues = sorted(issues, key=lambda x: x['id'], reverse=False)
        
        issued_product['issues'] = issues
        issued_products = [product for product in issued_products if str(product.get('line_item_id')) != issued_product_id]
        issued_products.append(issued_product)
        
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.issued_products = issued_products
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'issued_products'])
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update issue to service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has updated issue to service {service.name}'
            info_id=service.id
            type='update_issue_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service issue updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)   
    
    
#############################################
# CHANGE PHONE NUMBER
#############################################

def change_service_phone_number(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    
    if service.sales_order.get('customer', None):
        current_phone_number = service.sales_order.get('customer', None).get('phone', '') or service.sales_order.get('customer', None).get('mobile', '')
    else:
        current_phone_number = ''

    phone_number = data.get('phoneNumber', current_phone_number) if data.get('phoneNumber') else current_phone_number
    
    sales_order = service.sales_order
    
    if service.sales_order.get('customer', None):
        sales_order['customer']['phone'] = phone_number
        sales_order['customer']['mobile'] = phone_number
    else:
        sales_order['customer'] = {
            'phone': phone_number,
            'mobile': phone_number,
        }
        
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.phone = phone_number if phone_number else ''
    service.sales_order = sales_order
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service phone number ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed phone number in service {service.name}'
        info_id=service.id
        type='change_service_phone_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201) 
    
    
#############################################
# CHANGE REFERENCE NUMBER
#############################################

def change_service_reference_number(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    ref_number = data.get('refNumber', '')
        
    sales_order = service.sales_order if service.sales_order else {}
    sales_order['reference_number'] = ref_number
    
    service.sales_order = sales_order
    service.reference_number = ref_number if ref_number else '000000'
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service reference number ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed reference number in service {service.name}'
        info_id=service.id
        type='change_service_reference_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE ADDRESS
#############################################

def change_service_address(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    
    service.address = data.get('address', service.address) if data.get('address') else service.address
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service address ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'address'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed address in service {service.name}'
        info_id=service.id
        type='change_service_address'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE MANAGER
#############################################

def change_service_manager(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    user_manager = json.loads(data.get('userManager', None))
    
    if not user_manager:
        return Response({'error': 'User manager not found'}, status=404)
    
    service.user_manager = user_manager if user_manager else service.user_manager
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service user manager ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'user_manager'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed user manager in service {service.name}'
        info_id=service.id
        type='change_service_user_manager'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE SERVICE TEAM
#############################################

def change_service_team(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    user_service_team = json.loads(data.get('userServiceTeam', None))
    
    if not user_service_team:
        return Response({'error': 'Service Team not found'}, status=404)
    
    users_service_team = [user_service_team]
    
    service.users_service_team = users_service_team if users_service_team else service.users_service_team
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    all_tasks = service.service_default_tasks if service.service_default_tasks else []
        
    for task in all_tasks:
            if isinstance(task.get('service_default_task', {}).get('service_stage', {}), dict):
                if task.get('service_default_task', {}).get('service_stage', {}).get('name', '') == settings.SERVICE_REPAIR_STAGE:
                    name = task.get('service_default_task', {}).get('name', '').lower()
                    if settings.TASK_SERVICE_UPLOAD_REPAIR.lower() in name:
                        if users_service_team:
                            task['users_assignees'] = users_service_team
                            task['user_reporter'] = user_reporter
                            task['last_modified_time'] = timezone.now()
                            
    for task in all_tasks:
            name = task.get('service_default_task', {}).get('name', '').lower()
            if settings.TASK_SERVICE_ASSIGN_CREW.lower() in name:
                if users_service_team:
                    task['status'] = 'finished'
                    task['percentage'] = 100
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                    
                    # not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['service_default_task']['order'] > task['service_default_task']['order']]
                    
                    # sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
                    
                    # def get_next_task(task, sorted_tasks):
                    #     return next(
                    #         (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                    #         None
                    #     )
                                
                    # next_task = get_next_task(task, sorted_tasks)
                    
                    # if next_task:
                    #     next_task['status'] = 'in progress'
                    #     next_task['percentage'] = 50
                    #     next_task['user_reporter'] = user_reporter
                    #     next_task['last_modified_time'] = timezone.now()
                    #     all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                    #     all_tasks.append(next_task)
                           
    sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
        
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service users team ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'users_service_team'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed users team in service {service.name}'
        info_id=service.id
        type='change_service_users_team'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE DATES
#############################################

def change_service_dates(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    
    include_fields = ['id', 'name', 'version']
    
    if data.get('startDate', None):
        start_date = data.get('startDate', None)
        include_fields.append('start_date')
    
    if data.get('endDate', None):
        end_date = data.get('endDate', None)
        include_fields.append('end_date')
    
    is_part_days_str = data.get('isPartDays', '')
    if is_part_days_str:
        is_part_days = True if is_part_days_str.lower() == 'true' else False
        if data.get('isPartDays') and is_part_days != service.is_part_days:
            include_fields.append('is_part_days')
    
    service.start_date = start_date if start_date else service.start_date
    service.end_date = end_date if end_date else service.end_date
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    service.is_part_days = is_part_days if is_part_days_str else service.is_part_days
    
    if start_date:
        all_tasks = service.service_default_tasks if service.service_default_tasks else []
                                
        for task in all_tasks:
                name = task.get('service_default_task', {}).get('name', '').lower()
                if settings.TASK_SERVICE_SCHEDULE_DATE.lower() in name:
                        task['status'] = 'finished'
                        task['percentage'] = 100
                        task['user_reporter'] = user_reporter
                        task['last_modified_time'] = timezone.now()
                        
                        # not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['service_default_task']['order'] > task['service_default_task']['order']]
                        
                        # sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
                        
                        # def get_next_task(task, sorted_tasks):
                        #     return next(
                        #         (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                        #         None
                        #     )
                                    
                        # next_task = get_next_task(task, sorted_tasks)
                        
                        # if next_task:
                        #     next_task['status'] = 'in progress'
                        #     next_task['percentage'] = 50
                        #     next_task['user_reporter'] = user_reporter
                        #     next_task['last_modified_time'] = timezone.now()
                        #     all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                        #     all_tasks.append(next_task)
                            
        sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
            
        service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service dates ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=include_fields)
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed dates in service {service.name}'
        info_id=service.id
        type='change_service_dates'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# ADD ISSUED PRODUCT TO SERVICE
#############################################

def add_issued_products(request, id):
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        data = request.data
        user_reporter = data.get('userReporter', None)
        has_to_pay = data.get('hasToPay')
        by_factory = data.get('byFactory')
        address = data.get('address')
        service_place = data.get('servicePlace')
        notes = data.get('serviceNotes')
        
        new_issued_products = data.get('issuedProducts', [])
        
        issued_products = service.issued_products if service.issued_products else []
        issued_product_ids = [product.get('line_item_id') for product in issued_products]
        
        for new_issued_product in new_issued_products:
            if new_issued_product.get('line_item_id') not in issued_product_ids:
                issued_products.append(new_issued_product)
        
        service.issued_products = issued_products if issued_products else service.issued_products
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.has_to_pay = has_to_pay if has_to_pay is not None else service.has_to_pay
        service.by_factory = by_factory if by_factory is not None else service.by_factory
        service.address = address if address and len(address) > 0 else service.address
        service.service_place = service_place if service_place is not None else service.service_place
        service.service_notes = notes if notes and len(notes) > 0 else service.service_notes
        
        
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'issued_products', 'has_to_pay', 'by_factory', 'address', 'service_place'])
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'add issued products to service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has added issued products to service {service.name}'
            info_id=service.id
            type='add_service_issued_products'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# SET SERVICE PLACE
#############################################

def set_service_place(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    service_place = json.loads(data.get('servicePlace', None))
    
    if not service_place:
        return Response({'error': 'Service Place not found'}, status=404)
    
    service.service_place = service_place if service_place else service.service_place
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'set service place ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'service_place'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has set service place in service {service.name}'
        info_id=service.id
        type='set_service_place'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# CHANGE SERVICE TYPE
#############################################

def change_service_type(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    service_type = data.get('serviceType', None)
    
    if not service_type:
        return Response({'error': 'Service type not found'}, status=404)
    
    service.service_type = service_type if service_type else service.service_type
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service type ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'service_type'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed type in service {service.name}'
        info_id=service.id
        type='change_service_type'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    

#############################################
# CHANGE STATUS SERVICE DEFAULT TASK
#############################################

def change_status_service_default_task(request, serviceId, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        service = Service.objects(id=serviceId).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        status = data.get('status', 'not started')
        percentage = data.get('percentage', 0)
        
        all_tasks = service.service_default_tasks if service.service_default_tasks else []
        task = next((task for task in all_tasks if str(task['service_default_task']['_id']) == id), None)
        if not task:
            return Response({'error': 'Service task not found'}, status=404)
        task['status'] = status
        task['percentage'] = percentage
        task['user_reporter'] = user_reporter
        task['last_modified_time'] = timezone.now()
        
        tracking_task = task
        
        not_started_tasks = [
            t for t in all_tasks if \
            t['status'] == 'not started' and \
            t['service_default_task']['is_active'] == True and \
            t['service_default_task']['order'] > task['service_default_task']['order']
        ]
        
        sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
        
        def get_next_task(task, sorted_tasks):
            return next(
                (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                None
            )
        
        if status == 'finished':
            next_task = get_next_task(task, sorted_tasks)
            
            if next_task and next_task['status'] == 'not started':
                less_ordered_tasks = [t for t in all_tasks if t['service_default_task']['order'] < next_task['service_default_task']['order']]
                unfinished_tasks = [t for t in less_ordered_tasks if t['status'] != 'finished']
                if not unfinished_tasks:
                    next_task['status'] = 'in progress'
                    next_task['percentage'] = 50
                    next_task['user_reporter'] = user_reporter
                    next_task['last_modified_time'] = timezone.now()
                    all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                    all_tasks.append(next_task)
        
        all_tasks = [task for task in all_tasks if str(task['service_default_task']['_id']) != id]
        all_tasks.append(task)
        sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
        
        current_stage = get_current_stage_from_tasks(sorted_tasks, module='service')
        
        if not current_stage:
            current_stage = ServiceStage.objects(name='Finished').first()
        
        current_stage = ServiceStage.objects(name=current_stage['name']).first() 
        
        if current_stage:
            
            if service.current_stage['name'] != current_stage.name:
                history = service.service_history if service.service_history else []
                current_stage = transform_data_to_mongo(current_stage)
                history.append({
                    'initial_stage': service.current_stage,
                    'final_stage': current_stage,
                    'created_time': timezone.now()
                })
                service.current_stage = current_stage 
                service.service_history = history
                
                tracking = ProjectTracking(
                    user_reporter=user_reporter,
                    action=f'change stage service ({service.id} - {service.name})',
                    created_time=timezone.now(),
                    managed_data={
                        'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'current_stage', 'service_history'])
                    },
                )
                tracking.save()
        
        service.service_default_tasks = sorted_tasks
        service.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'change status default task ({task["service_default_task"]["id"]} - {task["service_default_task"]["name"]}) in service ({service.id} - {service.name})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_task
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has changed status in task {task["service_default_task"]["name"]} in service {service.name}'
            info_id=service.id
            type='change_status_service_default_task'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Status in default task updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# CHANGE SERVICE NOTES
#############################################

def change_service_notes(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else service.user_reporter
    service_notes = data.get('serviceNotes', None)
    
    if not service_notes:
        return Response({'error': 'Service notes not found'}, status=404)
    
    service.service_notes = service_notes if service_notes else service.service_notes
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    
    sorted_tasks = updated_tasks(service, user_reporter)
                
    service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change service notes ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'service_notes'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has changed notes in service {service.name}'
        info_id=service.id
        type='change_service_notes'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Service updated successfully',
        'data': json.loads(service.to_json())
    }, status=201)