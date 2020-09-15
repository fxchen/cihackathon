try:
  import unzip_requirements
except ImportError:
  pass

import boto3
import os
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

print("Loading function")

# Get the service resource
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event, context):
    logger.info('## ENVIRONMENT VARIABLES')
    logger.info(os.environ)
    logger.info('## EVENT')
    logger.info(event)

    table = dynamodb.Table('algorithms')
    response = table.get_item(
        Key={
            'userId': 'us-east-2:2814b358-8340-489c-badf-37cef10b4f01',
            'algorithmId': 'c5155a00-c622-11ea-83b9-0d4bd55041e7'
        }
    )
    item = response['Item']
    print(item)


    return {
        "statusCode": 200,
        "body": "<html><body><p>Hello!</p></body></html>",
        "headers": {
            "Content-Type": "text/html"
        }
    }