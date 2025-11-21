from django.utils import timezone
from api_projects.models import (
    ProjectTracking,
)
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# DELETE OLD TRACKINGS
#############################################

def delete_old_trackings():
    trackings = ProjectTracking.objects(created_time__lt=timezone.now() - timezone.timedelta(days=30)).all()
    trackings.delete()
    return True