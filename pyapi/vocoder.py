try:
    import unzip_requirements
except ImportError:
    pass

import boto3
import botocore
import os
import json
import uuid
import time
import logging
from Vocoder.vocoderFunc import vocoderFunc


logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.info('#### Loading function')

PWD='/tmp/' # Change for local dev
UPLOADS_BUCKET = 'cihackathon-algorithm-uploads'
VOCODER_BUCKET = 'cihackathon-vocoder-outputs'

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


class VocoderException(Exception): pass
class DynamoDBException(Exception): pass
class S3ObjectNotFoundException(Exception): pass
class BotoClientException(Exception): pass

def lambda_handler(event, context):
    logger.info('## ENVIRONMENT VARIABLES')
    logger.info(os.environ)
    logger.info('## EVENT')
    logger.info(event)

    data = json.loads(event['body'])
    userId = event['requestContext']['identity']['cognitoIdentityId']
    algorithmId = data['algorithmId']

    # Fetch file attachment details
    table = dynamodb.Table('algorithms')
    try:
        response = table.get_item(
            Key={
                'userId': userId,
                'algorithmId': algorithmId
            }
        )
    except botocore.exceptions.ClientError as error:
        raise DynamoDBException('DynamoDB item does not exist\n' + error)
    
    logger.info('## DYNAMODB RESPONSE')
    logger.info(response)
    item = response['Item']

    # Fetch uploaded file
    key = 'private/' + item['userId'] + '/' + item['attachment']
    electrocardiogram=item['attachment']
    logger.info('S3: Downloading ' + UPLOADS_BUCKET + '/' + key + ' to: ' + electrocardiogram)
    try:
        s3.download_file(UPLOADS_BUCKET, key, PWD + electrocardiogram)
    except botocore.exceptions.ClientError as error:
        if error.response['Error']['Code'] == '404':
            raise S3ObjectNotFoundException('S3 object does not exist')
        else:
            raise BotoClientException('S3 upload failed\n' + error)

    # Run vocoder
    vocoder_output = PWD + item['label'] + '.wav'
    try:
        vocoderFunc(
            PWD + electrocardiogram,
            saveOutput=True,
            outputFile=PWD + item['label']
        )
    except:
        raise

    # Upload processed output
    object_name = item['label'] + '_' + str(uuid.uuid4()) + '.wav'
    logger.info('S3: Uploading ' + object_name + ' to ' + VOCODER_BUCKET)
    try:
        response = s3.upload_file(vocoder_output, VOCODER_BUCKET, object_name)
    except botocore.exceptions.ClientError as error:
        raise BotoClientException('S3 upload failed\n' + error)

    # Replace entry with addtional details
    try:
        response = table.put_item(
            Item={
                'userId': userId,
                'algorithmId': algorithmId,
                'label': item['label'],
                'attachment': item['attachment'],
                'createdAt': item['createdAt'],
                'vocoder_output': object_name,
                'processedAt': int(time.time()),
            }
        )
    except botocore.exceptions.ClientError as error:
        raise DynamoDBException('Error writing DynamoDB item\n' + error)
    logger.info('## DYNAMODB RESPONSE')
    logger.info(response)

    logger.info('#### Exiting function')
    return { 
        'statusCode': 200,
        'body': json.dumps('Success')
    }
