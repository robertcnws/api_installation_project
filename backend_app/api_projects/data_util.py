from bson.objectid import ObjectId
from django.utils import timezone
from datetime import timezone as dt_timezone
from datetime import datetime
from dateutil import parser
from collections import defaultdict
from .models import ProjectNotification, ProjectNotificationUser
from api_authorization.models import LoginUser
from django.conf import settings
import json
import random

def transform_data_to_mongo(data, exclude_fields=None, include_fields=None):
    if isinstance(data, dict):
        for key, value in data.items():
            data[key] = transform_data_to_mongo(value)
        if not 'id' in data and '_id' in data:
            data['id'] = data.get('_id', None)
    else:
        data = data.to_mongo().to_dict()
        if '_id' in data and isinstance(data['_id'], ObjectId):
            data['_id'] = str(data['_id'])
            data['id'] = data['_id']
    if exclude_fields:
        for field in exclude_fields:
            if field in data:
                del data[field]
    if include_fields:
        for field in list(data.keys()):
            if field not in include_fields:
                del data[field]
    return data


def transform_dict_to_camelcase(data):
    if isinstance(data, dict):
        new_data = {}
        for key, value in data.items():
            if '_' in key and key != '_id':
                words = key.split('_')
                new_key = words[0].lower() + ''.join(word.capitalize() for word in words[1:])
            else:
                new_key = key[0].lower() + key[1:] if key else key
            new_data[new_key] = transform_dict_to_camelcase(value)
        return new_data
    elif isinstance(data, list):
        return [transform_dict_to_camelcase(item) for item in data]
    else:
        return data


def serialize_datetime(value):
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            value = timezone.make_aware(value, dt_timezone.utc) 
        local_dt = timezone.localtime(value)  
        return local_dt.isoformat()
    elif isinstance(value, dict):
        return {key: serialize_datetime(val) for key, val in value.items()}
    elif isinstance(value, list):
        return [serialize_datetime(item) for item in value]
    else:
        return value
    
    
def dynamic_field_to_json(data):
    if isinstance(data, str):
        try:
            return json.loads(data)
        except Exception:
            return data
    return data


def create_entity_number(salesorder_number, prefix='P'):
    if salesorder_number is not None:
        number = salesorder_number.split('-')[1]
    else:
        number = generate_code()
    return f'{prefix}-{number}'


def generate_code():
    n = random.randint(1, 9999)
    return f"C{n:04d}"


def create_default_task_number(order):
    return f'T-{str(order).zfill(5)}'


def parse_custom_date(logger, date_str):
    try:
        return parser.parse(date_str)
    except Exception as e:
        if logger:
            logger.warning(f'Error parsing date: {e}')
        return None


def fix_order(result_set, start_order=1):
    ordered_items = result_set.order_by('order')  
    for index, item in enumerate(ordered_items, start=start_order):
        if item.order != index:
            item.order = index
            item.save()
    return True


def fix_order_after_edit(result_set, edited_task, new_order):
    ordered_tasks = result_set.order_by('order')
    old_order = edited_task.order

    if new_order == old_order:
        return  

    if new_order > old_order:
        for task in ordered_tasks.filter(order__gt=old_order, order__lte=new_order):
            task.order -= 1
            task.save()
    else:
        for task in ordered_tasks.filter(order__gte=new_order, order__lt=old_order):
            task.order += 1
            task.save()
            
    edited_task.order = new_order
    edited_task.save()
    fix_order(result_set, start_order=1)
    
    
def get_current_stage_from_tasks(tasks, module='project'):
    grupos = defaultdict(list)
    
    for task in tasks:
        pdt = task.get(f"{module}_default_task", {})
        stage = pdt.get(f"{module}_stage", {})
        key = (stage.get("order", 0), stage.get("name", ""))
        grupos[key].append(task)
        
    grupos_promedio = []
    for key, group_tasks in grupos.items():
        total = sum(task.get("percentage", 0) for task in group_tasks)
        promedio = total / len(group_tasks) if group_tasks else 0
        grupos_promedio.append((key, promedio))
    
    grupos_promedio.sort(key=lambda x: x[0][0])
    
    completed_order = None
    for (order, name), promedio in grupos_promedio:
        if promedio == 100:
            completed_order = order
    
    if completed_order is None:
        current_group = grupos_promedio[0][0] if grupos_promedio else None
    else:
        current_group = None
        for (order, name), promedio in grupos_promedio:
            if order > completed_order:
                current_group = (order, name)
                break
    
    if current_group is None:
        return None
    else:
        order, name = current_group
        return {"order": order, "name": name}
    
    
def to_aware(dt):
    if isinstance(dt, str):
        dt = parse_custom_date(None, dt)
    if dt is None:
        return dt
    if dt.tzinfo is None:
        return timezone.make_aware(dt, timezone.get_default_timezone())
    return dt


def create_notification(module, info_id, info, type, username):
    notification = ProjectNotification(
        module=module,
        info_id=str(info_id),
        info=info,
        type=type,
        created_time=timezone.now(),
        last_modified_time=timezone.now(),
    )
    
    notification.save()
    
    user = LoginUser.objects(username=username).first()
    
    username = user.username if user else 'System Job'
    
    all_users = LoginUser.objects.all()
    
    for user in all_users:
        user_notification = ProjectNotificationUser(
            notification=transform_data_to_mongo(notification),
            username=username,
            user=transform_data_to_mongo(user, exclude_fields=['password']),
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
        )
        user_notification.save()
    
    return notification


def find_task_in_stage(tasks, stage, position=0):
    filtered_tasks = [task for task in tasks if task.get("project_default_task", {}).get("project_stage", {}).get("name") == stage]
    filtered_tasks.sort(key=lambda x: x.get("project_default_task", {}).get("order", 0), reverse=False)
    if isinstance(position, int):
        return filtered_tasks[position] if len(filtered_tasks) > position else None
    elif isinstance(position, str):
        if position == 'last':
            return filtered_tasks[-1] if filtered_tasks else None
        

def get_project_installers(project):
    installers = None
    if project:
        installers = [project.user_installer] if project.user_installer else None
        if installers is None:
            all_tasks = project.project_default_tasks if project.project_default_tasks else []
            installation_tasks = [
                task for task in all_tasks if \
                task.get('project_default_task', {}).get('project_stage', {}).get('name', '').lower() == settings.INSTALLATION_STAGE.lower()
            ]
            installer_task = next(
                (
                    task for task in installation_tasks if \
                    task.get('project_default_task', {}).get('name', '').lower() == settings.TASK_START_INSTALLATION.lower() or \
                    task.get('project_default_task', {}).get('name', '').lower() == settings.TASK_FINISH_INSTALLATION.lower() or \
                    task.get('project_default_task', {}).get('name', '').lower() == settings.TASK_COMPLETE_SATISFACTION_FORM.lower()
                ), 
                None
            )
            if installer_task:
                user_assignees = installer_task['users_assignees']
                if user_assignees:
                    installers = [
                        user_assignee for user_assignee in user_assignees if user_assignee.get('user_role', {}).get('name', '').lower() == settings.ROLE_INSTALLER.lower()
                    ]
    return installers