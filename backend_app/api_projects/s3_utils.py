# s3_utils.py
import boto3
from botocore.exceptions import ClientError
from django.conf import settings

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
