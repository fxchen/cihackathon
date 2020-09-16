try:
    import unzip_requirements
except ImportError:
    pass

import boto3
import botocore
import os
import uuid
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

UPLOADS_BUCKET = 'cihackathon-algorithm-uploads'
VOCODER_BUCKET = 'cihackathon-vocoder-outputs'

print("Loading function")

# Get the service resource
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Pass userId and algorithmId
def lambda_handler(event, context):
    logger.info('## ENVIRONMENT VARIABLES')
    logger.info(os.environ)
    logger.info('## EVENT')
    logger.info(event)

    # Fetch file attachment details
    table = dynamodb.Table('algorithms')
    response = table.get_item(
        Key={
            'userId': 'us-east-2:41bbbe83-6a4a-4222-9528-5c901313cd4a',
            'algorithmId': '34e252d0-f7aa-11ea-a57f-6d1d156ec5fe'
        }
    )
    item = response['Item']

    # Fetch uploaded file
    key = 'private/' + item['userId'] + '/' + item['attachment']
    print("Downloading " + key + " from " + UPLOADS_BUCKET)
    try:
        s3.download_file(UPLOADS_BUCKET, key, 'sample.out')
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == "404":
            print("The object does not exist.")
        else:
            raise

    # Todo: run vocoder
    vocoder = 'sample.out'

    # Upload processed output
    object_name = vocoder + '-' + str(uuid.uuid4())
    print("Uploading " + object_name + " to " + VOCODER_BUCKET)
    try:
        response = s3.upload_file(vocoder, VOCODER_BUCKET, object_name)
    except botocore.exceptions.ClientError as e:
        print("Object failed to upload.")

    return {
        "statusCode": 200,
        "body": "<html><body><p>Hello!</p></body></html>",
        "headers": {
            "Content-Type": "text/html"
        }
    }
