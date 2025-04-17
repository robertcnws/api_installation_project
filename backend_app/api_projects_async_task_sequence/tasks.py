from celery import shared_task, chain
from api_projects.tasks import (
    task_delete_old_notifications,
    task_delete_old_trackings,
    task_generate_db_backup,
    task_delete_old_reminders,
)

@shared_task
def task_sequence_daily():
    workflow = chain(
        task_delete_old_notifications.si(),
        task_delete_old_trackings.si(),
        task_generate_db_backup.si(),
        task_delete_old_reminders.si(),
    )
    workflow.apply_async()
