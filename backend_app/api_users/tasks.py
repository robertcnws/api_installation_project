from celery import shared_task
from celery import group
from api_projects.models import Project
from api_users.repo_util import sync_project_update_info as sync_util

import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

@shared_task
def sync_project_update_info(tracking_info, id):
    projects = Project.objects.all()
    sync_util(projects, tracking_info, id)
    logger.warning(f"Sync project update info called with id: {id}")
    return "Sync completed"
    