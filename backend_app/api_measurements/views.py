from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from api_projects.data_util import (
    transform_data_to_mongo,
    transform_dict_to_camelcase,
    create_notification,
    create_entity_number,
    fix_order,
    fix_order_after_edit,
    get_current_stage_from_tasks,
    to_aware,
)
from api_projects.s3_utils import (
    upload_attachment_to_s3, 
    generate_default_file_url,
    delete_attachment_from_s3,
    backup_mongo_to_s3,
)
from api_projects.models import (
    ProjectTracking,
)
from api_authorization.models import (
    LoginUser,
)

from .utils import (
    updated_tasks,
)
import json

#############################################
# CREATE SERVICE ISSUE
#############################################