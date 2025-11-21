from celery import shared_task
from datetime import datetime
from django.http import HttpRequest
from django.utils import timezone
from .views import (
    delete_old_notifications, 
    delete_old_trackings,
    delete_old_reminders,
    generate_db_backup,
    redefine_project_task_attachments,
)
import json
import logging

logger = logging.getLogger(__name__)
    
@shared_task
def task_delete_old_notifications():
    delete_old_notifications()
    
@shared_task
def task_delete_old_trackings():
    delete_old_trackings()
    
@shared_task
def task_delete_old_reminders():
    delete_old_reminders()
    

@shared_task
def task_redefine_project_task_attachments():
    logger.info("Starting task to redefine project task attachments...")
    try:
        redefine_project_task_attachments()
        logger.info("Redefinition of project task attachments completed successfully.")
    except Exception as e:
        logger.error("Error during redefinition of project task attachments: %s", str(e))
        raise e
    
@shared_task
def task_generate_db_backup():
    logger.info("Starting MongoDB backup task...")
    result = generate_db_backup()
    logger.info("Backup task result: %s", result)
    return result