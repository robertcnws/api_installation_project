from celery import shared_task
from datetime import datetime
from django.http import HttpRequest
from django.utils import timezone
from .views import delete_old_notifications, delete_old_trackings
import json
    
@shared_task
def task_delete_old_notifications():
    delete_old_notifications()
    
@shared_task
def task_delete_old_trackings():
    delete_old_trackings()