# s3_utils.py
import boto3
import os
import subprocess
from botocore.exceptions import ClientError
from django.conf import settings
from datetime import datetime

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)

def key_exists_in_s3(key):
    try:
        s3_client.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == "404":
            return False
        else:
            raise e

def upload_attachment_to_s3(file_obj, folder=settings.AWS_S3_FOLDER_PROJECTS):
    import uuid
    extension = file_obj.name.split('.')[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    key = folder + filename
    
    if key_exists_in_s3(key):
        key = folder + f"{uuid.uuid4()}.{extension}"

    try:
        s3_client.upload_fileobj(
            file_obj,
            settings.AWS_STORAGE_BUCKET_NAME,
            key,
            ExtraArgs={
                'ContentType': file_obj.content_type
            }
        )
        return key
    except ClientError as e:
        print("Error uploading file to S3:", e)
        return None
    
    
def generate_default_file_url(object_key):
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
            'Key': object_key,
        },
        ExpiresIn=3600
    )
    return url

def delete_attachment_from_s3(key):
    try:
        s3_client.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
        return True
    except ClientError as e:
        print("Error deleting file from S3:", e)
        return False
    
    
def backup_mongo_to_s3(logger, mongo_uri, db_name, s3_bucket, s3_prefix):
    backup_folder = '/tmp/mongo_backup'
    if os.path.exists(backup_folder):
        subprocess.run(["rm", "-rf", backup_folder], check=True)
    os.makedirs(backup_folder, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"{db_name}_backup_{timestamp}.gz"
    backup_filepath = os.path.join(backup_folder, backup_filename)
    
    dump_cmd = [
        "mongodump",
        f"--uri={mongo_uri}",
        f"--db={db_name}",
        f"--archive={backup_filepath}",
        "--gzip"
    ]
    try:
        logger.info("Executing command: %s", " ".join(dump_cmd))
        result = subprocess.run(dump_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info("mongodump stdout: %s", result.stdout.decode())
        logger.info("mongodump stderr: %s", result.stderr.decode())
        logger.info("Backup created at: %s", backup_filepath)
    except subprocess.CalledProcessError as e:
        logger.error("Error executing mongodump: %s", e.stderr.decode())
        raise

    try:
        resp = s3_client.list_objects_v2(Bucket=s3_bucket, Prefix=s3_prefix)
        if 'Contents' in resp:
            for obj in resp['Contents']:
                logger.info("Deleting object in S3: %s", obj['Key'])
                s3_client.delete_object(Bucket=s3_bucket, Key=obj['Key'])
    except Exception as e:
        logger.error("Error deleting objects in S3: %s", e)
        raise

    try:
        s3_key = os.path.join(s3_prefix, backup_filename)
        s3_client.upload_file(backup_filepath, s3_bucket, s3_key)
        logger.info("Backup uploaded to S3 in: %s", s3_key)
    except Exception as e:
        logger.error("Error uploading backup to S3: %s", e)
        raise

    try:
        os.remove(backup_filepath)
        logger.info("Local backup file deleted.")
    except Exception as e:
        logger.warning("Could not delete local backup file: %s", e)
