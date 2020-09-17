try:
    import unzip_requirements
except ImportError:
    pass

import boto3
import botocore
import os
import uuid
import logging
from shutil import copyfile
from Vocoder.vocoderFunc import vocoderFunc


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
            'algorithmId': '488216b0-f901-11ea-a573-5d9008c996f7'
        }
    )
    item = response['Item']

    # Fetch uploaded file
    key = 'private/' + item['userId'] + '/' + item['attachment']
    electrocardiogram=item['attachment']
    print("Downloading " + UPLOADS_BUCKET + "/" + key + " to: " + electrocardiogram)
    try:
        s3.download_file(UPLOADS_BUCKET, key, electrocardiogram)
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == "404":
            print("The object does not exist.")
        else:
            raise

    # Run vocoder
    vocoder_output = item['label'] + '.wav'
    vocoderFunc(
        electrocardiogram,
        saveOutput=True,
        outputFile=item['label']
    )

    # Upload processed output
    object_name = item['label'] + '_' + str(uuid.uuid4()) + '.wav'
    # copyfile(electrocardiogram, vocoder_output) # Fake vocoder for testing
    print("Uploading " + object_name + " to " + VOCODER_BUCKET)
    try:
        response = s3.upload_file(vocoder_output, VOCODER_BUCKET, object_name)
    except botocore.exceptions.ClientError as e:
        print("Object failed to upload.")

    return {
        "statusCode": 200,
        "body": "<html><body><p>Hello!</p></body></html>",
        "headers": {
            "Content-Type": "text/html"
        }
    }
