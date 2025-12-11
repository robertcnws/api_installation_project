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
    parse_custom_date,
    transform_data_to_mongo,
    create_notification,
)
from api_projects.repository import (
    project_profit_report_repository as profit_repo,
)
from django.http import HttpResponse
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

# --------------------------------------------
# CORE: lógica reutilizable para crear/actualizar un work order
# --------------------------------------------

def manage_project_work_order_core(
    *,
    project,
    user_reporter,
    name=None,
    description=None,
    start_date=None,
    duration=None,
    users_assignees=None,
    work_type=None,
    inspection_type=None,
    items=None,
    work_order_id=None,
    is_finished=None,
    installer_crews=None,
):
    """
    Lógica pura de creación/actualización de un work order sobre un Project.

    Devuelve: (project, work_order, action)
      - action: 'create' o 'update'
    """

    if not project:
        raise ValueError("Project is required")

    existing_work_orders = project.work_orders if project.work_orders else []

    # Buscar work order existente
    work_order = None
    if work_order_id:
        work_order = next(
            (wo for wo in existing_work_orders if str(wo.get('id', None)) == str(work_order_id)),
            None
        )
        
    if start_date:
        new_start_date = parse_custom_date(logger, start_date)
        if duration:
            try:
                if int(duration) > 0:
                    new_duration = int(duration) - 1 if duration else 0
                    end_date = new_start_date + timezone.timedelta(days=new_duration)
                    end_date = parse_custom_date(logger, end_date)
                else:
                    end_date = None
            except ValueError:
                return Response({'error': 'Invalid duration value'}, status=400)

    # Si no existe, creamos
    if not work_order:
        action = 'create'

        # Generar ID si no vino uno
        if not work_order_id:
            work_order_id = str(timezone.now().timestamp()).replace('.', '')
            
        

        work_order = {
            'id': work_order_id,
            'name': name,
            'description': description,
            'start_date': start_date,
            'duration': int(duration) if duration is not None else None,
            # 'project_stage': project_stage,
            'users_assignees': users_assignees,
            'work_type': work_type,
            'inspection_type': inspection_type,
            'items': items,
            'created_time': timezone.now(),
            'last_modified_time': timezone.now(),
            'is_finished': False,
            'end_date': end_date,
            'finish_date': None,
            'installer_crews': installer_crews,
        }
        existing_work_orders.append(work_order)

    # Si existe, actualizamos
    else:
        action = 'update'

        work_order['name'] = name if name is not None else work_order.get('name')
        work_order['description'] = description if description is not None else work_order.get('description')
        work_order['start_date'] = start_date if start_date is not None else work_order.get('start_date')
        work_order['duration'] = int(duration) if duration is not None else work_order.get('duration')
        work_order['end_date'] = end_date if end_date is not None else work_order.get('end_date')
        # work_order['project_stage'] = project_stage if project_stage is not None else work_order.get('project_stage')
        work_order['users_assignees'] = users_assignees if users_assignees is not None else work_order.get('users_assignees')
        work_order['work_type'] = work_type if work_type is not None else work_order.get('work_type')
        work_order['inspection_type'] = inspection_type if inspection_type is not None else work_order.get('inspection_type')
        work_order['items'] = items if items is not None else work_order.get('items')
        work_order['installer_crews'] = installer_crews if installer_crews is not None else work_order.get('installer_crews')
        work_order['last_modified_time'] = timezone.now()

        # Manejo de is_finished (como ya hacías en la view)
        if is_finished is not None:
            work_order['is_finished'] = bool(is_finished)
            if is_finished:
                work_order['finish_date'] = timezone.now()
            else:
                work_order['finish_date'] = None
                work_order['is_finished'] = False
            work_order['last_modified_time'] = timezone.now()

        # Reemplazar en la lista (para mantener consistencia)
        existing_work_orders = [
            wo for wo in existing_work_orders if str(wo.get('id')) != str(work_order_id)
        ]
        existing_work_orders.append(work_order)

    # Persistir en el proyecto
    project.work_orders = existing_work_orders
    project.save()
    profit_repo.manage_profit_report(str(project.id), force_update=True)

    return project, work_order, action
    

#############################################
# MANAGE PROJECT WORK ORDER (API VIEW)
#############################################

def manage_project_work_order(request, id):
    project = Project.objects(id=id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)

    data = request.data

    # user_reporter: si no viene en request, tomamos el del proyecto
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter

    # Parseo de campos que llegan como JSON string desde el frontend
    users_assignees = json.loads(data.get('usersAssignees', None)) if data.get('usersAssignees') else None
    work_type = json.loads(data.get('workType', None)) if data.get('workType') else None
    inspection_type = json.loads(data.get('inspectionType', None)) if data.get('inspectionType') else None
    items = json.loads(data.get('items', None)) if data.get('items') else None

    # Otros campos simples
    name = data.get('name', None)
    description = data.get('description', None)
    start_date = data.get('startDate', None)
    duration = data.get('duration', None)
    work_order_id = data.get('workOrderId', None)
    is_finished = data.get('isFinished', None)
    installer_crews = json.loads(data.get('installerCrews', None)) if data.get('installerCrews') else None

    # Usamos la función core
    project, work_order, action = manage_project_work_order_core(
        project=project,
        user_reporter=user_reporter,
        name=name,
        description=description,
        start_date=start_date,
        duration=duration,
        users_assignees=users_assignees,
        work_type=work_type,
        inspection_type=inspection_type,
        items=items,
        work_order_id=work_order_id,
        is_finished=is_finished,
        installer_crews=installer_crews,
    )

    # Tracking + notificación (igual que antes)
    include_fields = ['id', 'name', 'work_orders']

    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'{action} project work order ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=include_fields)
        },
    )
    tracking.save()

    if user_reporter:
        module = 'projects'
        info = f'has {action}d project work order {project.name}'
        info_id = project.id
        type = f'{action}_project_work_order'
        create_notification(module, info_id, info, type, user_reporter['username'])

    return Response({
        'message': 'Project updated successfully',
        'data': json.loads(project.to_json())
    }, status=201)
    

#############################################
# MANAGE PROJECT WORK ORDER desde Celery / kwargs
#############################################

def manage_project_work_order_from_kwargs(project_id, **kwargs):
    """
    Pensada para llamar desde Celery u otros servicios, sin request.

    Ejemplo de uso:
      manage_project_work_order_from_kwargs(
          project_id="...",
          user_reporter=user_dict,
          name="WO auto",
          description="Generado por task",
          start_date="2025-01-01",
          duration=2,
          user_assignee=user_assignee_dict,
          work_type=work_type_dict,
          inspection_type=inspection_type_dict,
          items=list_items,
          work_order_id=None,
          is_finished=False,
      )
    """

    project = Project.objects(id=project_id).first()
    if not project:
        # aquí puedes lanzar excepción o loguear
        return None

    user_reporter = kwargs.get('user_reporter') or project.user_reporter

    project, work_order, action = manage_project_work_order_core(
        project=project,
        user_reporter=user_reporter,
        name=kwargs.get('name'),
        description=kwargs.get('description'),
        start_date=kwargs.get('start_date'),
        duration=kwargs.get('duration'),
        users_assignees=kwargs.get('users_assignees'),
        work_type=kwargs.get('work_type'),
        inspection_type=kwargs.get('inspection_type'),
        items=kwargs.get('items'),
        work_order_id=kwargs.get('work_order_id'),
        is_finished=kwargs.get('is_finished'),
        installer_crews=kwargs.get('installer_crews')
    )

    # Opcional: tracking/notificación también desde Celery
    if kwargs.get('with_tracking', True):
        include_fields = ['id', 'name', 'work_orders']
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'{action} project work order ({project.id} - {project.name}) [celery]',
            created_time=timezone.now(),
            managed_data={
                'data': transform_data_to_mongo(project, include_fields=include_fields)
            },
        )
        tracking.save()

    if kwargs.get('with_notification', True) and user_reporter:
        module = 'projects'
        info = f'has {action}d project work order {project.name}'
        info_id = project.id
        type = f'{action}_project_work_order'
        create_notification(module, info_id, info, type, user_reporter['username'])

    return project, work_order, action


    
    
def delete_project_work_order(request, project_id, id):
    project = Project.objects(id=project_id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    
    user_reporter = data.get('userReporter', None)
    if isinstance(user_reporter, str):
        user_reporter = json.loads(user_reporter)
    if not user_reporter:
        user_reporter = project.user_reporter
    
    existing_work_orders = project.work_orders if project.work_orders else []
    work_order = next((wo for wo in existing_work_orders if str(wo.get('id', None)) == id), None)
    if not work_order:
        return Response({'error': 'Work order not found'}, status=404)
    
    existing_work_orders = [wo for wo in existing_work_orders if str(wo.get('id')) != id]
    project.work_orders = existing_work_orders
    project.save()
    profit_repo.manage_profit_report(str(project.id), force_update=True)
    
    include_fields = ['id', 'name', 'work_orders']
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'delete project work order ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=include_fields)
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has deleted work order {work_order.get("name", "")} from project {project.name}'
        info_id=project.id
        type='delete_project_work_order'
        create_notification(module, info_id, info, type, user_reporter['username'])
            
    return Response({
        'message': 'Work order deleted successfully',
        'data': json.loads(project.to_json())
    }, status=200)
    
    
def finish_project_work_order(request, project_id, id):
    project = Project.objects(id=project_id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=404)
    
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None)) if data.get('userReporter') else project.user_reporter
    
    existing_work_orders = project.work_orders if project.work_orders else []
    work_order = next((wo for wo in existing_work_orders if str(wo.get('id', None)) == id), None)
    if not work_order:
        return Response({'error': 'Work order not found'}, status=404)
    
    existing_work_orders = [wo for wo in existing_work_orders if str(wo.get('id')) != id]
    work_order['is_finished'] = not work_order.get('is_finished', False)
    if work_order['is_finished']:
        work_order['finish_date'] = timezone.now()
    else:
        work_order['finish_date'] = None
    existing_work_orders.append(work_order)
    project.work_orders = existing_work_orders
    project.save()
    profit_repo.manage_profit_report(str(project.id), force_update=True)
    
    include_fields = ['id', 'name', 'work_orders']
        
    tracking = ProjectTracking(
        user_reporter=user_reporter,
        action=f'set {"finished" if work_order["is_finished"] else "unfinished"} project work order ({project.id} - {project.name})',
        created_time=timezone.now(),
        managed_data={
            'data': transform_data_to_mongo(project, include_fields=include_fields)
        },
    )
    tracking.save()
        
    if user_reporter:
        module='projects'
        info=f'has {"finished" if work_order["is_finished"] else "unfinished"} work order {work_order.get("name", "")} from project {project.name}'
        info_id=project.id
        type='finish_project_work_order'
        create_notification(module, info_id, info, type, user_reporter['username'])
            
    return Response({
        'message': 'Work order finished successfully',
        'data': json.loads(project.to_json())
    }, status=200)