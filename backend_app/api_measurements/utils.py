from django.utils import timezone

def updated_tasks(service, user_reporter):
    def get_next_task(task, sorted_tasks):
            return next(
                (tt for tt in sorted_tasks if tt['service_default_task']['order'] > task['service_default_task']['order']),
                None
            )       
        
    all_tasks = service.service_default_tasks if service.service_default_tasks else []
    first_task = next((task for task in all_tasks if task['service_default_task']['order'] == 1), None)
    not_started_tasks = [
        t for t in all_tasks if t['status'] == 'not started' and \
        t['service_default_task']['order'] > first_task['service_default_task']['order']
    ]
    sorted_tasks = sorted(not_started_tasks, key=lambda tt: tt['service_default_task']['order'])
    second_task = get_next_task(first_task, sorted_tasks)
        
    if first_task:
        first_task['status'] = 'finished'
        first_task['percentage'] = 100
        first_task['user_reporter'] = user_reporter
        first_task['last_modified_time'] = timezone.now()
        all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(first_task['service_default_task']['_id'])]
        all_tasks.append(first_task)
            
    if second_task:
        second_task['status'] = 'in progress'
        second_task['percentage'] = 50
        second_task['user_reporter'] = user_reporter
        second_task['last_modified_time'] = timezone.now()
        all_tasks = [t for t in all_tasks if str(t['service_default_task']['_id']) != str(second_task['service_default_task']['_id'])]
        all_tasks.append(second_task)
            
    sorted_tasks = sorted(all_tasks, key=lambda x: x['service_default_task']['order'], reverse=True)
    
    return sorted_tasks