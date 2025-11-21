from pymongo import MongoClient
from bson import json_util
from django.utils import timezone
from django.conf import settings
from api_projects.s3_utils import (
    backup_mongo_to_s3,
)
import zipstream
from django.http import StreamingHttpResponse
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# GENERATE DB BACKUP
#############################################

def generate_db_backup():
    try:
        backup_mongo_to_s3(
            logger, 
            settings.MONGO_URI, 
            settings.MONGO_DB, 
            settings.AWS_STORAGE_BUCKET_NAME, 
            settings.AWS_S3_FOLDER_BACKUPS
        )
        return True
    except Exception as e:
        return str(e)
    
    
#############################################
# DOWNLOAD MONGO DB
#############################################

# @api_view(['GET'])
# @permission_classes([AllowAny])
# def download_mongo_db(request):
#     mongo_uri = settings.MONGO_URI
#     db_name = settings.MONGO_DB
#     client = MongoClient(mongo_uri)
#     db = client[db_name]
    
#     zip_buffer = io.BytesIO()
    
#     with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
#         for info in db.list_collections():
#             name = info['name']
#             if name == 'system.views':
#                 continue
#             collection = db[name]
#             documents = list(collection.find())
#             plain_data = json.loads(json_util.dumps(documents))
#             # json_data = json.dumps(plain_data, indent=2)
#             json_data = json.dumps(plain_data)
#             zip_file.writestr(f"{name}.json", json_data)
    
#     zip_buffer.seek(0)
    
#     timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
#     response = HttpResponse(zip_buffer, content_type="application/zip")
#     response['Content-Disposition'] = f'attachment; filename="mongo_db_export_{timestamp}.zip"'
#     response['Access-Control-Expose-Headers'] = 'Content-Disposition'
#     return response

def download_mongo_db(request):
    client = MongoClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]

    z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    
    for info in db.list_collections():
        name = info['name']
        if name == 'system.views':
            continue

        def gen_collection(coll_name):
            cursor = db[coll_name].find()
            yield b'['
            first = True
            for doc in cursor:
                if not first:
                    yield b','
                first = False
                yield json_util.dumps(doc).encode('utf-8')
            yield b']'
        
        z.write_iter(f'{name}.json', gen_collection(name))
    
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    response = StreamingHttpResponse(
        streaming_content=z, 
        content_type='application/zip'
    )
    response['Content-Disposition'] = f'attachment; filename="mongo_db_export_{timestamp}.zip"'
    response['Access-Control-Expose-Headers'] = 'Content-Disposition'
    return response

