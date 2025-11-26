from celery import shared_task
from celery import group
from api_projects.models import Project

from api_projects.repository import (
    project_profit_report_repository as profit_repo,
    project_notification_repository as notification_repo,
    project_tracking_repository as tracking_repo,
    project_reminder_repository as reminder_repo,
    project_task_attachment_repository as attachment_repo,
    project_db_repository as db_repo,
)

import logging

logger = logging.getLogger(__name__)
    
@shared_task
def task_delete_old_notifications():
    notification_repo.delete_old_notifications()
    
@shared_task
def task_delete_old_trackings():
    tracking_repo.delete_old_trackings()
    
@shared_task
def task_delete_old_reminders():
    reminder_repo.delete_old_reminders()
    

@shared_task
def task_redefine_project_task_attachments():
    logger.info("Starting task to redefine project task attachments...")
    try:
        attachment_repo.redefine_project_task_attachments()
        logger.info("Redefinition of project task attachments completed successfully.")
    except Exception as e:
        logger.error("Error during redefinition of project task attachments: %s", str(e))
        raise e
    
@shared_task
def task_generate_db_backup():
    logger.info("Starting MongoDB backup task...")
    result = db_repo.generate_db_backup()
    logger.info("Backup task result: %s", result)
    return result

@shared_task
def task_manage_profit_single_report(project_id: str, force_update: bool = False):
  logger.info("Starting task to manage profit report for project ID: %s", project_id)
  try:
      response = profit_repo.manage_profit_report(project_id, force_update=force_update)
      logger.info(
          "Profit report done for %s | status=%s",
          project_id,
          getattr(response, "status", None)
      )
      return getattr(response, "data", None)
  except Exception as e:
      logger.error("Error managing profit report for project ID %s: %s", project_id, str(e))
      raise

BATCH_SIZE = 200  # ajusta a tu realidad

@shared_task
def task_manage_profit_report(force_update: bool = False):
    logger.info("Starting task to manage project profit reports...")
    
    projects_qs = Project.objects.only('id')
    total = projects_qs.count()
    logger.info("Found %s projects to process", total)

    batch_size = BATCH_SIZE
    current_batch = []
    batches = 0

    for project in projects_qs:
        current_batch.append(
            task_manage_profit_single_report.s(str(project.id), force_update=force_update)
        )

        if len(current_batch) >= batch_size:
            group(current_batch).apply_async()
            batches += 1
            current_batch = []
    
    if current_batch:
        group(current_batch).apply_async()
        batches += 1

    logger.info(
        "Dispatched profit report tasks: total=%s | batches=%s | batch_size=%s",
        total, batches, batch_size
    )

    return {"scheduled": total, "batches": batches, "batch_size": batch_size}