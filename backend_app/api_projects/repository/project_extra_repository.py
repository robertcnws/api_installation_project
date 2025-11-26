from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from api_projects.models import (
    Project, 
    ProjectAttachment, 
    ProjectPermissions, 
    ProjectStage,
    ProjectTracking,
)
from api_projects.s3_utils import (
    upload_attachment_to_s3, 
    make_s3_archive_stream,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
from django.http import HttpResponse
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    
    
#############################################
# CHANGE PROJECT PERMISSION
#############################################

def change_project_permission(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    has_permission_str = data.get('hasPermission', 'false') if data.get('hasPermission') else None
    if has_permission_str:
        has_permission = True if has_permission_str.lower() == 'true' else False
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    project.has_permission = has_permission if has_permission_str else project.has_permission
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project permission ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'has_permission'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed permission in project {project.name}'
        info_id=project.id
        type='change_project_permission'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT ADDRESS
#############################################

def change_project_address(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    project.address = data.get('address', project.address) if data.get('address') else project.address
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project address ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'address'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed address in project {project.name}'
        info_id=project.id
        type='change_project_address'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT PHONE NUMBER
#############################################

def change_project_phone_number(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    current_phone_number = project.sales_order.get('customer', None).get('phone', '') or project.sales_order.get('customer', None).get('mobile', '')
    
    phone_number = data.get('phoneNumber', current_phone_number) if data.get('phoneNumber') else current_phone_number
    
    sales_order = project.sales_order
    
    sales_order['customer']['phone'] = phone_number
    sales_order['customer']['mobile'] = phone_number
    
    project.sales_order = sales_order
    
    project.phone = phone_number if phone_number else ''
    
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project phone number ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed phone number in project {project.name}'
        info_id=project.id
        type='change_project_phone_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT REFERENCE NUMBER
#############################################

def change_project_reference_number(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    ref_number = data.get('refNumber', '')
        
    sales_order = project.sales_order if project.sales_order else {}
    sales_order['reference_number'] = ref_number
    
    project.sales_order = sales_order
    project.reference_number = ref_number if ref_number else '000000'
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project reference number ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'reference_number', 'sales_order'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed reference number in project {project.name}'
        info_id=project.id
        type='change_project_reference_number'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    

#############################################
# CHECK ITEM INSTALLATION GUIDE
#############################################

def check_project_item_installation_guide(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    new_product = json.loads(data.get('product', {})) if data.get('product') else {}
    
    products_guide = project.project_guide_products if project.project_guide_products else []
    
    new_product_id = new_product.get("id")
    
    product_exists = next((p for p in products_guide if p.get("id") == new_product_id), None)
        
    if product_exists:
        products_guide = [p for p in products_guide if p.get("id") != new_product_id]
        
    products_guide.append(new_product)
        
    products_guide = sorted(products_guide, key=lambda x: x["id"], reverse=True)
        
    project.project_guide_products = products_guide
            
    project.save()
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'check project item in installation guide ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'project_guide_products'])
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has checked item in installation guide for project {project.name}'
        info_id=project.id
        type='check_project_item_installation_guide'
        create_notification(module, info_id, info, type, user_reporter['username'])
            
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE PROJECT RELEASE FORM
#############################################

def change_project_release_form(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    all_products_marked_str = data.get('allProductsMarked', 'false') if data.get('allProductsMarked') else None
    if all_products_marked_str:
        all_products_marked = True if all_products_marked_str.lower() == 'true' else False
        
    all_windows_marked_str = data.get('allWindowsMarked', 'false') if data.get('allWindowsMarked') else None
    if all_windows_marked_str:
        all_windows_marked = True if all_windows_marked_str.lower() == 'true' else False
        
    all_screw_marked_str = data.get('allScrewMarked', 'false') if data.get('allScrewMarked') else None
    if all_screw_marked_str:
        all_screw_marked = True if all_screw_marked_str.lower() == 'true' else False
        
    all_trash_marked_str = data.get('allTrashMarked', 'false') if data.get('allTrashMarked') else None
    if all_trash_marked_str:
        all_trash_marked = True if all_trash_marked_str.lower() == 'true' else False
    
    project.all_products_marked = all_products_marked if all_products_marked_str else project.all_products_marked
    project.all_windows_marked = all_windows_marked if all_windows_marked_str else project.all_windows_marked
    project.all_screw_marked = all_screw_marked if all_screw_marked_str else project.all_screw_marked
    project.all_trash_marked = all_trash_marked if all_trash_marked_str else project.all_trash_marked
    project.feedback = data.get('feedback', project.feedback) if data.get('feedback') else project.feedback
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    
    all_tasks = project.project_default_tasks if project.project_default_tasks else []
    for task in all_tasks:
        if settings.TASK_COMPLETE_SATISFACTION_FORM.lower() in task['project_default_task']['name'].lower():
            task['status'] = 'finished'
            task['percentage'] = 100
            task['last_modified_time'] = timezone.now()
            
    project.project_default_tasks = all_tasks
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project release form ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(
                project, include_fields=['id', 'name', 'all_products_marked', 'all_windows_marked', 'all_screw_marked', 'all_trash_marked', 'feedback']
            )
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed release form in project {project.name}'
        info_id=project.id
        type='change_project_release_form'
        create_notification(module, info_id, info, type, user_reporter.get('username'))
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    

#############################################
# CHANGE PROJECT INSTALLATION GUIDE FORM
#############################################

def change_project_installation_guide_form(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    work_scope = data.get('workScope', project.work_scope) if data.get('workScope') else project.work_scope
    
    other_notes = data.get('projectMaterialsOtherNotes', project.project_materials_other_notes) \
                    if data.get('projectMaterialsOtherNotes') else project.project_materials_other_notes
    
    project_materials = json.loads(data.get('projectMaterials', [])) if data.get('projectMaterials') else project.project_materials
    
    project_guide_products = json.loads(data.get('projectGuideProducts', [])) if data.get('projectGuideProducts') else project.project_guide_products
    
    if project.project_guide_products is not None or isinstance(project.project_guide_products, list):
        deleted_products = [p for p in project.project_guide_products if p.get('deleted', False) == True]
        project_guide_products.extend(deleted_products)
    
    project.work_scope = work_scope
    project.project_materials_other_notes = other_notes
    project.project_materials = project_materials
    project.project_guide_products = project_guide_products
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    
    all_tasks = project.project_default_tasks if project.project_default_tasks else []
    for task in all_tasks:
        if settings.TASK_GENERATE_INSTALLATION_GUIDE.lower() in task['project_default_task']['name'].lower():
            task['status'] = 'finished'
            task['percentage'] = 100
            task['last_modified_time'] = timezone.now()
    
    project.project_default_tasks = all_tasks
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'change project installation guide form ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(
                project, include_fields=['id', 'name', 'work_scope', 'project_materials_other_notes', 'project_materials', 'project_guide_products']
            )
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has changed installation guide form in project {project.name}'
        info_id=project.id
        type='change_project_installation_guide_form'
        create_notification(module, info_id, info, type, user_reporter.get('username'))
        
    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    
    
#############################################
# CHANGE INSTALLER PROJECT
#############################################

def change_installer_project(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        project = Project.objects(id=id).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        installer = json.loads(data.get('installer', None))
        
        if installer:
            if installer.get('id') not in [user['id'] for user in project.users_assignees]:
                project.users_assignees.append(installer)
        
        all_tasks = project.project_default_tasks if project.project_default_tasks else []
        
        for task in all_tasks:
            if isinstance(task.get('project_default_task', {}).get('project_stage', {}), dict):
                if task.get('project_default_task', {}).get('project_stage', {}).get('name', '') == settings.INSTALLATION_STAGE:
                    name = task.get('project_default_task', {}).get('name', '').lower()
                    if settings.TASK_START_INSTALLATION.lower() in name or \
                        settings.TASK_FINISH_INSTALLATION.lower() in name or \
                        settings.TASK_COMPLETE_SATISFACTION_FORM.lower() in name:
                        if installer:
                            task['users_assignees'] = [installer]
                            task['user_reporter'] = user_reporter
                            task['last_modified_time'] = timezone.now()
                            
        for task in all_tasks:
            name = task.get('project_default_task', {}).get('name', '').lower()
            if settings.TASK_ASSIGN_INSTALLATION_CREW.lower() in name:
                if installer:
                    task['status'] = 'finished'
                    task['percentage'] = 100
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                    
                    not_started_tasks = [t for t in all_tasks if t['status'] == 'not started' and t['project_default_task']['order'] > task['project_default_task']['order']]
                    
                    if not project.has_permission:
                        not_started_tasks = [t for t in not_started_tasks if t['project_default_task']['project_stage']['name'] != 'Permission']
                        
                    sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['project_default_task']['order'])
                    
                    def get_next_task(task, sorted_tasks):
                        return next(
                            (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
                            None
                        )
                                
                    next_task = get_next_task(task, sorted_tasks)
                    
                    if next_task:
                        next_task['status'] = 'in progress'
                        next_task['percentage'] = 50
                        next_task['user_reporter'] = user_reporter
                        next_task['last_modified_time'] = timezone.now()
                        all_tasks = [t for t in all_tasks if str(t['project_default_task']['_id']) != str(next_task['project_default_task']['_id'])]
                        all_tasks.append(next_task)
                           
        sorted_tasks = sorted(all_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        
        project.project_default_tasks = sorted_tasks
        project.user_installer = installer if installer else project.user_installer
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'change installer project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_default_tasks'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has changed installer in project {project.name}'
            info_id=project.id
            type='change_installer_project'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Installer updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# UPLOAD FILES TO PROJECT
#############################################

def upload_files_to_project(request, id): 
    
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    last_attachments = project.project_attachments if project.project_attachments else []
            
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    stage = json.loads(data.get('projectStage', None))
    if stage:
        project_stage = ProjectStage.objects(id=stage['id']).first()
        project_stage = transform_data_to_mongo(project_stage) if project_stage else None
    else:
        project_stage = project.current_stage if project.current_stage else None
    
    project_attachments = []
    files = request.FILES.getlist('projectAttachments')
    
    for file_obj in files:
        key = upload_attachment_to_s3(file_obj)
        if key:
            attachment = ProjectAttachment(
                name=file_obj.name,
                file=key,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                user_upload = user_reporter,
                current_stage = project_stage if project_stage else None,
            )
            attachment.save()
            project_attachments.append(transform_data_to_mongo(attachment))
            
    last_attachments.extend(project_attachments)
            
    last_attachments = sorted(last_attachments, key=lambda x: x['name'], reverse=True)
    
    project.last_modified_time = timezone.now()
    project.user_reporter = user_reporter if user_reporter else project.user_reporter
    project.project_attachments = last_attachments if last_attachments else project.project_attachments
        
    project.save()
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'upload files to project ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'current_stage', 'project_attachments'])
        },
    )
    tracking.save()
    
    if user_reporter:
        module='projects'
        info=f'has uploaded file attachments to project {project.name}'
        info_id=project.id
        type='upload_files_to_project'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Uploaded files to project successfully',
        'data': json.loads(project.to_json())
    }, status=201)

#############################################
# CHANGE DESCRIPTION ALL PROJECTS
#############################################

def change_description_all_projects(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    list_tracking_info = []
    try:
        projects = Project.objects(id__in=ids).all()
        if not projects:
            return Response({'error': 'Projects not found'}, status=404)
        for project in projects:
            
            sales_order = project.sales_order if project.sales_order else None
            if not sales_order:
                return Response({'error': f'Sales order not found for project {project.name}'}, status=404)
            
            installation_description = sales_order.get('line_items', [])
            installation_description = [
                item.get('description') for item in installation_description if item.get('description') \
                and item.get('name').lower() == settings.PROJECT_ITEM_INSTALLATION_NAME.lower()
            ]
            structural_description = sales_order.get('line_items', [])
            structural_description = [
                item.get('description') for item in structural_description if item.get('description') \
                and item.get('name').lower() == settings.PROJECT_ITEM_STRUCTURAL_NAME.lower()
            ]
            all_description = f'Project for sales order {sales_order.get("salesorder_number")} & ' + '.'.join(installation_description) + ' & ' + '.'.join(structural_description)
            work_scope = '.'.join(installation_description) + ' & ' + '.'.join(structural_description)
            
            project.description = all_description
            project.work_scope = work_scope
            project.last_modified_time = timezone.now()
            project.user_reporter = user_reporter if user_reporter else project.user_reporter
            project.save()
            
            list_tracking_info.append(transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'description']))
            
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update description list projects',
            created_time=timezone.now(),
            managed_data={
                'data': list_tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='projects'
            info=f'has updated description in {len(ids)} projects'
            info_id='list'
            type='update_projects'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Projects updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


#############################################
# CHANGE STAFF ALL PROJECTS
#############################################

def change_staff_all_projects(request): 
    data = request.data
    
    ids = data.get('ids', [])
    user_reporter = json.loads(data.get('userReporter', None))
    staffs = data.get('staff', [])
    staff_role = data.get('staffRole', 'installer')
    
    list_tracking_info = []
    
    permission = ProjectPermissions.objects(name='full access').first()
    if not permission:
        permission = ProjectPermissions(
            name='full access',
            description='Full access to project',
        )
        permission.save()
    permission = transform_data_to_mongo(permission)
    
    projects = Project.objects(id__in=ids).all()
    for project in projects:
        assignees = project.users_assignees if project.users_assignees else []
        new_assignees = [
            {**staff, 'project_permissions': [permission]}
            for staff in staffs
            if staff['id'] not in [user.get('id') for user in assignees]
        ]
        assignees.extend(new_assignees)
        project.users_assignees = assignees
        project.save()
        
        tasks = project.project_default_tasks if project.project_default_tasks else []
        not_started_tasks = [t for t in tasks if t['status'] == 'not started']
        
        for task in tasks:
            name = task.get('project_default_task', {}).get('name', '').lower()
            if staff_role == 'installer':
                if (settings.TASK_START_INSTALLATION.lower() in name or 
                    settings.TASK_FINISH_INSTALLATION.lower() in name or 
                    settings.TASK_COMPLETE_SATISFACTION_FORM.lower() in name):
                    task_assignees = task.get('users_assignees', [])
                    task_assignees.extend([staff for staff in staffs if staff['id'] not in [user.get('id') for user in task_assignees]])
                    task['users_assignees'] = task_assignees
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                if (settings.TASK_ASSIGN_INSTALLATION_CREW.lower() in name):
                    task['status'] = 'finished'
                    task['percentage'] = 100
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                    
                    not_started_tasks = [t for t in tasks if t['status'] == 'not started' and t['project_default_task']['order'] > task['project_default_task']['order']]
                    
                    if not project.has_permission:
                        not_started_tasks = [t for t in not_started_tasks if t['project_default_task']['project_stage']['name'] != 'Permission']
                        
                    sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['project_default_task']['order'])
                    
                    def get_next_task(task, sorted_tasks):
                        return next(
                            (tt for tt in sorted_tasks if tt['project_default_task']['order'] > task['project_default_task']['order']),
                            None
                        )
                                
                    next_task = get_next_task(task, sorted_tasks)
                    
                    if next_task:
                        next_task['status'] = 'in progress'
                        next_task['percentage'] = 50
                        next_task['user_reporter'] = user_reporter
                        next_task['last_modified_time'] = timezone.now()
                        tasks = [t for t in tasks if str(t['project_default_task']['_id']) != str(next_task['project_default_task']['_id'])]
                        tasks.append(next_task)
                                
                    
            elif staff_role == 'warehouse staff':
                if (settings.TASK_ORDER_IS_READY_TO_PICK_UP.lower() in name or 
                    settings.TASK_PICK_UP_ORDER.lower() in name or 
                    settings.TASK_COMPLETE_SATISFACTION_FORM.lower() in name or 
                    settings.TASK_GENERATE_INSTALLATION_GUIDE.lower() in name):
                    
                    task_assignees = task.get('users_assignees', [])
                    task_assignees.extend([staff for staff in staffs if staff['id'] not in [user.get('id') for user in task_assignees]])
                    task['users_assignees'] = task_assignees
                    task['user_reporter'] = user_reporter
                    task['last_modified_time'] = timezone.now()
                        
        project.project_default_tasks = tasks
        project.save()
        
        tracking_info = transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'users_assignees', 'project_default_tasks'])
        list_tracking_info.append(tracking_info)        
    
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'update list project with new {staff_role}',
        created_time=timezone.now(),
        managed_data={
            'data': list_tracking_info
        },
    )
    tracking.save()
    
    if user_reporter:
        module = 'projects'
        info = f'has updated {len(ids)} projects with new {staff_role}'
        info_id = 'list'
        type = 'update_list_project'
        create_notification(module, info_id, info, type, user_reporter['username'])
        
    return Response({
        'message': 'Projects updated successfully',
        'data': list_tracking_info
    }, status=201)
    
    
#############################################
# REMOVE DATE PROJECT
#############################################

def remove_date_project(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    date_type = data.get('dateType', None)
    info = ''
    try:
        project = Project.objects(id=id).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        if not date_type:
            return Response({'error': 'Date type is required'}, status=400)
        if date_type in ['startDate']:
            info = 'start date'
            project.start_date = None
            project.end_date = None
            project.duration = 0
        elif date_type in ['inspectionDate']:
            info = 'inspection date'
            project.inspection_date = None
            project.inspection_end_date = None
            project.inspection_duration = 0
        elif date_type in ['finishPermissionDate']:
            info = 'finish permission date'
            project.finish_permission_date = None
            project.finish_permission_end_date = None
            project.finish_permission_duration = 0
        project.save()
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'remove {info} in project ({project.id} - {project.name})',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(project, include_fields=['id', 'name', 'number'])
            },
        )
        tracking.save()
        
        if user_reporter:
            module='projects'
            info=f'has removed {info} date in project {project.name}'
            info_id=project.id
            type='remove_install_date_project'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        return Response({'message': 'Date removed successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# CHANGE DESCRIPTION PROJECT
#############################################

def change_description_project(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        project = Project.objects(id=id).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        description = data.get('description', None)
        work_scope = data.get('description', None)
            
        project.description = description
        project.work_scope = work_scope
        project.last_modified_time = timezone.now()
        project.user_reporter = user_reporter if user_reporter else project.user_reporter
        project.save()
            
        tracking_info = transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'description'])
            
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'chnge description project ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='projects'
            info=f'has changed description in project {project.name}'
            info_id=project.id
            type='change_description_project'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Project updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# REMOVE PROJECT GUIDE PRODUCT
#############################################

def remove_guide_product_project(request, projectId, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    default_product = json.loads(data.get('product', None))
    try:
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        guide_products = project.project_guide_products if project.project_guide_products else []
        
        if guide_products:
            product = next((product for product in guide_products if str(product['id']) == id), None)
            if product:
                product['deleted'] = True
                guide_products = [p for p in guide_products if str(p['id']) != id]
                guide_products.append(product)
            else:
                default_product['deleted'] = True
                guide_products.append(default_product)
            guide_products = sorted(guide_products, key=lambda x: x['id'], reverse=False)            
            
            project.project_guide_products = guide_products
            project.save()
                    
            tracking_info = transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'project_guide_products'])
                    
            tracking = ProjectTracking(
                user_reporter=user_reporter,
                action=f'remove project guide product ({tracking_info["id"]} - {tracking_info["name"]})',
                created_time=timezone.now(),
                managed_data={
                    'data': tracking_info
                },
            )
            tracking.save()
            if user_reporter:
                module='projects'
                info=f'has removed guide product in project {project.name}'
                info_id=project.id
                type='remove_guide_product_project'
                create_notification(module, info_id, info, type, user_reporter['username'])
            return Response({'message': 'Project updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DOWNLOAD ALL FILES IN PROJECT
#############################################

def download_s3_archive(request):
    keys = request.GET.getlist("keys[]")
    number = request.GET.get("number")
    stage = request.GET.get("stage")
    task = request.GET.get("task")
    if not keys:
        return Response({"error": "No keys provided"}, status=400)
    stream, filename, content_type = make_s3_archive_stream(keys, number, stage, task)
    response = HttpResponse(stream.read(), content_type="application/zip")
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Access-Control-Expose-Headers'] = 'Content-Disposition'
    return response


#############################################
# REMOVE PROJECT GUIDE PRODUCT
#############################################

def remove_guide_product_project(request, projectId, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    default_product = json.loads(data.get('product', None))
    try:
        project = Project.objects(id=projectId).first()
        if not project:
            return Response({'error': 'Project not found'}, status=404)
        
        guide_products = project.project_guide_products if project.project_guide_products else []
        
        if guide_products:
            product = next((product for product in guide_products if str(product['id']) == id), None)
            if product:
                product['deleted'] = True
                guide_products = [p for p in guide_products if str(p['id']) != id]
                guide_products.append(product)
            else:
                default_product['deleted'] = True
                guide_products.append(default_product)
            guide_products = sorted(guide_products, key=lambda x: x['id'], reverse=False)            
            
            project.project_guide_products = guide_products
            project.save()
                    
            tracking_info = transform_data_to_mongo(project, include_fields=['id', 'name', 'number', 'project_guide_products'])
                    
            tracking = ProjectTracking(
                user_reporter=user_reporter,
                action=f'remove project guide product ({tracking_info["id"]} - {tracking_info["name"]})',
                created_time=timezone.now(),
                managed_data={
                    'data': tracking_info
                },
            )
            tracking.save()
            if user_reporter:
                module='projects'
                info=f'has removed guide product in project {project.name}'
                info_id=project.id
                type='remove_guide_product_project'
                create_notification(module, info_id, info, type, user_reporter['username'])
            return Response({'message': 'Project updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


