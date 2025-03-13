from celery import shared_task
from datetime import datetime
from django.http import HttpRequest
from django.utils import timezone
from .views import (
    delete_old_notifications, 
    delete_old_trackings,
    generate_db_backup,
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
def task_generate_db_backup():
    logger.info("Starting MongoDB backup task...")
    result = generate_db_backup()
    logger.info("Backup task result: %s", result)
    return result