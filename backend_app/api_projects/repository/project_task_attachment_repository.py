from api_projects.models import (
    ProjectTaskAttachment,
)
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# REDEFINE PROJECT TASK ATTACHMENTS
#############################################

def redefine_project_task_attachments():
    task_attachments = ProjectTaskAttachment.objects.all()
    for ta in task_attachments:
        if ta.project_task.get('project_default_task', {}).get('redefined', False) is False:
            project_task = {
                'project_default_task': {
                    '_id': ta.project_task.get('project_default_task', {}).get('_id'),
                    'id': ta.project_task.get('project_default_task', {}).get('_id'),
                    'name': ta.project_task.get('project_default_task', {}).get('name'),
                    'order': ta.project_task.get('project_default_task', {}).get('order'),
                    'redefined': True,
                    'project_stage': {
                        '_id': ta.project_task.get('project_default_task', {}).get('project_stage', {}).get('_id'),
                        'id': ta.project_task.get('project_default_task', {}).get('project_stage', {}).get('_id'),
                        'name': ta.project_task.get('project_default_task', {}).get('project_stage', {}).get('name'),
                        'order': ta.project_task.get('project_default_task', {}).get('project_stage', {}).get('order'),
                    }
                },
            }
            ta.project_task = project_task
            ta.save()
    return True