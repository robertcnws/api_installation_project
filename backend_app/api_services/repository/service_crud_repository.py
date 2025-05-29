from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.http import HttpResponse
from api_projects.data_util import (
    transform_data_to_mongo,
    transform_dict_to_camelcase,
    create_notification,
    create_entity_number,
    to_aware,
)
from api_projects.s3_utils import (
    upload_attachment_to_s3, 
    generate_default_file_url,
    delete_attachment_from_s3,
    make_s3_archive_stream,
)
from api_projects.models import (
    ProjectTracking,
)
from api_authorization.models import (
    LoginUser,
)

from api_services.models import (
    Service,
    ServiceStage,
    ServiceDefaultTask,
    ServiceAttachment,
)

from api_services.utils import (
    updated_tasks,
)
import json


#############################################
# CREATE SERVICE
#############################################

def create_service(request):
    files = request.FILES.getlist('serviceAttachments')
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    role = user_reporter.get('user_role', None) if user_reporter else None
    responsible = None
    
    if role and role.get('name') == 'superadmin':
        responsible = LoginUser.objects(user_role__name='administrator').first()
        responsible = transform_data_to_mongo(responsible)
    elif role and role.get('name') == 'administrator':
        responsible = transform_dict_to_camelcase(user_reporter)
    
    if responsible:
        responsible['name'] = f'{responsible["firstName"]} {responsible["lastName"]}'
    
    try:
        issued_products = json.loads(data.get('issuedProducts', []))
        sales_order = json.loads(data.get('salesOrder', None))
        service_type = data.get('serviceType', None)
        service_notes = data.get('notes', None)
        service_place = json.loads(data.get('servicePlace', None))
        has_to_pay_str = data.get('hasToPay', 'false')
        has_to_pay = True if has_to_pay_str.lower() == 'true' else False
        by_factory_str = data.get('byFactory', 'false')
        by_factory = True if by_factory_str.lower() == 'true' else False
        address = data.get('address', None)
        stage_history = None
        users_assignees = []
        start_date = None
        end_date = None
        # current_stage = None
        service_history = []
        user_manager = responsible
        service_comments = []
        service_default_tasks = []
        users_service_team = []
        client = None
        
        last_version = Service.objects(sales_order__salesorder_id=sales_order['salesorder_id']).order_by('-version').first()
        version = last_version.version + 1 if last_version else 1
        
        number = create_entity_number(sales_order.get('salesorder_number'), prefix='SR')
        
        name = f'{number} ({sales_order.get("customer_name")})'
        
        current_stage = ServiceStage.objects(name='Preparation').first()
    
        current_stage = transform_data_to_mongo(current_stage)
        
        default_tasks = ServiceDefaultTask.objects.all().order_by('order')
        
        def active_conditions (default_task):
            return default_task.order >= 3 and default_task.service_stage.get('name', '').lower() != 'closing'
        
        for default_task in default_tasks:
            service_default_task = transform_data_to_mongo(default_task)
            service_default_task['is_active'] = not active_conditions(default_task)
            info = {
                'service_default_task': service_default_task,
                'status': 'not started',
                'percentage': 0,
                'created_time': timezone.now(),
                'last_modified_time': timezone.now(),
                'users_assignees': [user_manager] if user_manager else [],
                'user_reporter': user_reporter,
                'priority': 'medium',
                'service_task_attachments': [],
                'is_active': not active_conditions(default_task),
            }
            service_default_tasks.append(info)
            
        for default_task in service_default_tasks:
            if default_task['service_default_task']['order'] == 3:
                default_task['service_default_task']['is_active'] = has_to_pay
            if default_task['service_default_task']['order'] == 5:
                default_task['service_default_task']['is_active'] = by_factory
            if default_task['service_default_task']['order'] == 6:
                default_task['service_default_task']['is_active'] = not by_factory
            if default_task['service_default_task']['order'] == 7:
                default_task['service_default_task']['is_active'] = not by_factory
            
        service_attachments = []
        
        for file_obj in files:
            key = upload_attachment_to_s3(file_obj, settings.AWS_S3_FOLDER_SERVICES)
            if key:
                # Ejemplo: url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{key}"
                attachment = ServiceAttachment(
                    name=file_obj.name,
                    file=key,
                    created_time=timezone.now(),
                    last_modified_time=timezone.now(),
                    user_upload = user_reporter,
                    attachment_type = file_obj.attachment_type if hasattr(file_obj, 'attachment_type') else 'issued',
                )
                attachment.save()
                service_attachments.append(transform_data_to_mongo(attachment))
                
        service_attachments = sorted(service_attachments, key=lambda x: x['name'], reverse=True)
        
        
        service = Service(
            number=create_entity_number(sales_order.get('salesorder_number'), prefix='SR'),
            name=name,
            version=version,
            client=client,
            sales_order=sales_order,
            issued_products=issued_products,
            user_reporter=user_reporter,
            stage_history=stage_history,
            users_assignees=users_assignees,
            start_date=start_date,
            end_date=end_date,
            current_stage=current_stage,
            service_attachments=service_attachments,
            service_history=service_history,
            address=address,
            user_manager=user_manager,
            service_comments=service_comments,
            service_default_tasks=service_default_tasks,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            users_service_team=users_service_team,
            service_type=service_type,
            created_by=user_reporter,
            service_notes=service_notes,
            service_place=service_place,
            has_to_pay=has_to_pay,
            by_factory=by_factory,
        )
        
        service.save()
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.save()
        
        all_tasks = service.service_default_tasks if service.service_default_tasks else []
        
        if len(service.service_attachments) > 0:
            
            target_task = settings.TASK_SERVICE_UPLOAD_ISSUES.lower()
            
            files_task = None
                                    
            for task in all_tasks:
                name = task.get('service_default_task', {}).get('name', '').lower()
                if target_task in name:
                    files_task = task
                    break
            
            if files_task:
                files_task['status'] = 'finished'
                files_task['percentage'] = 100
                files_task['user_reporter'] = user_reporter
                files_task['last_modified_time'] = timezone.now()
                all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(files_task['service_default_task']['_id'])]
                all_tasks.append(files_task)
                    
                         
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
        
        tracking_info = transform_data_to_mongo(service)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has created new service {service.name}'
            info_id=service.id
            type='create_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# UPDATE SERVICE
#############################################

def update_service(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
    
    start_date = data.get('startDate', None)
    end_date = data.get('endDate', None)
    notes = data.get('notes', None)
    name = data.get('name', data.get('title', None))
    
    try:
        start_date = start_date if start_date else None
        end_date = end_date if end_date else None
        name = name if name else None
        notes = notes if notes else None
        
        service.start_date = start_date
        service.end_date = end_date
        service.service_notes = notes
        service.name = name
        
        sorted_tasks = updated_tasks(service, user_reporter)
                
        service.service_default_tasks = sorted_tasks
        
        service.save()
        
        tracking_info = transform_data_to_mongo(service, include_fields=['id', 'name', 'version', 'start_date', 'end_date', 'notes'])
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has updated service {service.name}'
            info_id=service.id
            type='update_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE SERVICE
#############################################

def delete_service(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        attachments = service.service_attachments if service.service_attachments else []
        ServiceAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
        for attachment in attachments:
            delete_attachment_from_s3(attachment['file'])
        tracking_info = transform_data_to_mongo(service)
        service.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has deleted service {service.name}'
            info_id=service.id
            type='delete_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Service deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE SERVICES
#############################################

def delete_services(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        services = Service.objects(id__in=ids).all()
        if not services:
            return Response({'error': 'Services not found'}, status=404)
        for service in services:
            attachments = service.service_attachments if service.service_attachments else []
            ServiceAttachment.objects(id__in=[attachment['_id'] for attachment in attachments]).delete()
            for attachment in attachments:
                delete_attachment_from_s3(attachment['file'])
        tracking_info = [transform_data_to_mongo(service) for service in services]
        Service.objects(id__in=ids).delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list service',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='services'
            info=f'has deleted {len(ids)} services'
            info_id='list'
            type='delete_services'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Services deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE SERVICE FILE
#############################################

def delete_service_file(request, id, folder, file):
    data = request.data
    user_reporter = data.get('userReporter', None)
    attachment_type = data.get('attachmentType', None)
    try: 
        obj = Service.objects(id=id).first()
        attachments = obj.service_attachments if obj.service_attachments else []
        attachments = [attachment for attachment in attachments if attachment['file'] !=  folder + '/' + file]
        attachments = sorted(attachments, key=lambda x: to_aware(x['created_time']), reverse=True)
        obj.service_attachments = attachments
        
        if len(obj.service_attachments) == 0:
        
            all_tasks = obj.service_default_tasks if obj.service_default_tasks else []
            
            target_task = settings.TASK_SERVICE_UPLOAD_ISSUES.lower() if attachment_type == 'issued' else settings.TASK_SERVICE_UPLOAD_REPAIR.lower()
                                    
            for task in all_tasks:
                name = task.get('service_default_task', {}).get('name', '').lower()
                if target_task in name:
                    task['status'] = 'not started'
                    task['percentage'] = 0
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                                
            sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                
            obj.service_default_tasks = sorted_tasks
        
        obj.save()
        
        attachment = ServiceAttachment.objects(file=folder + '/' + file).first()
        attachment.service = transform_data_to_mongo(obj, include_fields=['id', 'name', 'number'])
        if not attachment:
            return Response({'error': 'Attachment not found'}, status=404)
        delete_attachment_from_s3(attachment.file)
        tracking_info = transform_data_to_mongo(attachment)
        attachment.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service ({obj.id} - {obj.name}) file attachment',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has deleted file attachment in service {obj.name}'
            info_id=obj.id
            type='delete_service_file'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Service file deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# UPLOAD FILES TO SERVICE
#############################################

def upload_files_to_service(request, id): 
    
    service = Service.objects(id=id).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)
    
    last_attachments = service.service_attachments if service.service_attachments else []
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    attachment_type = data.get('attachmentType', None)
    
    service_attachments = []
    files = request.FILES.getlist('serviceAttachments')
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj, settings.AWS_S3_FOLDER_SERVICES)
        if key:
            attachment = ServiceAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload=user_reporter,
                attachment_type=attachment_type if attachment_type else 'file',
            )
            attachment.save()
            service_attachments.append(transform_data_to_mongo(attachment))
            
    last_attachments.extend(service_attachments)
            
    last_attachments = sorted(last_attachments, key=lambda x: x['name'], reverse=True)
    
    service.last_modified_time = timezone.now()
    service.user_reporter = user_reporter if user_reporter else service.user_reporter
    service.service_attachments = last_attachments if last_attachments else service.service_attachments
    
    if len(service.service_attachments) > 0:
        
        all_tasks = service.service_default_tasks if service.service_default_tasks else []
            
        target_task = settings.TASK_SERVICE_UPLOAD_ISSUES.lower() if attachment_type == 'issued' else settings.TASK_SERVICE_UPLOAD_REPAIR.lower()
            
        files_task = None
                                    
        for task in all_tasks:
            name = task.get('service_default_task', {}).get('name', '').lower()
            if target_task in name:
                files_task = task
                break
            
        if files_task:
            files_task['status'] = 'finished'
            files_task['percentage'] = 100
            files_task['user_reporter'] = user_reporter
            files_task['last_modified_time'] = timezone.now()
            all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(files_task['service_default_task']['_id'])]
            all_tasks.append(files_task)
                            
            not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['service_default_task']['order'] > files_task['service_default_task']['order']]
                            
            sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
                            
            def get_next_task(task, sorted_tasks):
                return next(
                    (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                    None
                )
                                        
            next_task = get_next_task(task, sorted_tasks)
                            
            if next_task:
                next_task['status'] = 'in progress'
                next_task['percentage'] = 50
                next_task['user_reporter'] = user_reporter
                next_task['last_modified_time'] = timezone.now()
                all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(next_task['service_default_task']['_id'])]
                all_tasks.append(next_task)
                                
        sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                
        service.service_default_tasks = sorted_tasks
        
    service.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'upload files to service ({service.id} - {service.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'service_attachments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='services'
        info=f'has uploaded file attachments to service {service.name}'
        info_id=service.id
        type='upload_files_to_service'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Uploaded files to service successfully',
        'data': json.loads(service.to_json())
    }, status=201)
    
    
#############################################
# GET FILE URL
#############################################

def get_default_file_url(request):
    object_key = request.query_params.get('key')
    if not object_key:
        return Response({'error': 'A key was not sended'}, status=400)
    try:
        url = generate_default_file_url(object_key)
        return Response({'url': url})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# REMOVE DATE SERVICE
#############################################

def remove_date_service(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    date_type = data.get('dateType', None)
    info = ''
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        if not date_type:
            return Response({'error': 'Date type is required'}, status=400)
        if date_type in ['startDate']:
            info = 'start date'
            service.start_date = None
            service.end_date = None
            
            all_tasks = service.service_default_tasks if service.service_default_tasks else []
            
            date_task = next((task for task in all_tasks if 'date' in task['service_default_task']['name'].lower()), None)
            
            if date_task:
                date_task['status'] = 'not started'
                date_task['percentage'] = 0
                date_task['user_reporter'] = user_reporter
                date_task['last_modified_time'] = timezone.now()
                all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(date_task['service_default_task']['_id'])]
                all_tasks.append(date_task)
                sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
                service.service_default_tasks = sorted_tasks
                
        service.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'remove {info} in service ({service.id} - {service.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has removed {info} date in service {service.name}'
            info_id=service.id
            type='remove_install_date_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Date removed successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CLOSE SERVICE
#############################################

def close_service(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    is_closed = data.get('isClosed', None)
    try:
        service = Service.objects(id=id).first()
        if not service:
            return Response({'error': 'Service not found'}, status=404)
        
        service.is_closed = is_closed
                
        service.save()
        
        action = 'close' if is_closed else 'reopen'
        verbose_name = 'closed' if is_closed else 'reopened'
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'{action} service ({service.id} - {service.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(service, include_fields=['id', 'name', 'number', 'is_closed'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='services'
            info=f'has {verbose_name} service {service.name}'
            info_id=service.id
            type=f'{action}_service'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': f'Service {verbose_name} successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DOWNLOAD ALL FILES IN SERVICE
#############################################

def download_s3_archive(request):
    keys = request.GET.getlist("keys[]")
    number = request.GET.get("number")
    stage = request.GET.get("stage")
    task = request.GET.get("task")
    if not keys:
        return Response({"error": "No keys provided"}, status=400)
    stream, filename, content_type = make_s3_archive_stream(keys, number, stage, task)
    response = HttpResponse(stream.read(), content_type=content_type)
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
