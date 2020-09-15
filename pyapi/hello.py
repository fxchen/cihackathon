try:
  import unzip_requirements
except ImportError:
  pass

def handler(event, context):
    return {
        "statusCode": 200,
        "body": "<html><body><p>Hello!</p></body></html>",
        "headers": {
            "Content-Type": "text/html"
        }
    }