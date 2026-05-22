# AWS Lambda Configuration

### AWS MELME Lambda Function using Python:

```python
# Lambda function to process S3 email ingestion events and forward them to an internal API.

import boto3
import json
import os
import urllib3
from urllib.parse import unquote_plus

s3 = boto3.client("s3")
http = urllib3.PoolManager()

PLATFORM_API_URL = os.environ["PLATFORM_API_URL"]
PLATFORM_API_SECRET = os.environ["PLATFORM_API_SECRET"]

def lambda_handler(event, context):
    print("=== Lambda invoked (S3 email ingestion) ===")

    records = event.get("Records")
    if not records:
        print("❌ No records in event")
        return

    record = records[0]

    if record.get("eventSource") != "aws:s3":
        print("❌ Not an S3 event")
        return

    bucket = record["s3"]["bucket"]["name"]
    key = unquote_plus(record["s3"]["object"]["key"])
    size = record["s3"]["object"].get("size")

    print(f"📦 Bucket: {bucket}")
    print(f"📄 Key: {key}")
    print(f"📏 Size: {size}")

    payload = {
        "s3": {
            "bucket": bucket,
            "key": key,
            "size": size
        }
    }

    send_to_api(payload)

def send_to_api(payload):
    body = json.dumps(payload).encode("utf-8")

    response = http.request(
        "POST",
        PLATFORM_API_URL,
        body=body,
        headers={
            "Content-Type": "application/json",
            "Content-Length": str(len(body)),
            "X-Internal-Secret": PLATFORM_API_SECRET
        },
        timeout=urllib3.Timeout(connect=5.0, read=10.0),
        retries=False
    )

    print("✅ API response status:", response.status)
```

### Configuration Environment Variables for Lambda Function:

```
PLATFORM_API_SECRET = random-api-secret-token
PLATFORM_API_URL = https://<your-domain>/api/receiver
```