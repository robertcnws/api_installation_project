from celery import shared_task, chain
from api_projects.tasks import (
    task_delete_old_notifications,
    task_delete_old_trackings
)

@shared_task
def task_sequence_daily_delete_old():
    workflow = chain(
        task_delete_old_notifications.si(),
        task_delete_old_trackings.si()
    )
    workflow.apply_async()
