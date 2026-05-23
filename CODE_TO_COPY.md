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


# AWS IAM User Policies

### Policy 1 - AWS_MelMe_User_Policy_S3_Restricted:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "MelMeReadInboundEmailsAndAttachments",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectAttributes"
            ],
            "Resource": [
                "arn:aws:s3:::<bucket-name>/emails-receiver/*",
                "arn:aws:s3:::<bucket-name>/email-attachments/*"
            ]
        },
        {
            "Sid": "MelMeDeleteInvalidInboundEmails",
            "Effect": "Allow",
            "Action": "s3:DeleteObject",
            "Resource": "arn:aws:s3:::<bucket-name>/emails-receiver/*"
        },
        {
            "Sid": "MelMeWriteInboundAttachments",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::<bucket-name>/email-attachments/*"
        },
        {
            "Sid": "MelMeWriteOutboundEmails",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectAttributes",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::<bucket-name>/emails-sent/*"
        },
        {
            "Sid": "MelMeWriteOutboundAttachments",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectAttributes",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::<bucket-name>/sent-attachments/*"
        },
        {
            "Sid": "MelMeListBucketScoped",
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::<bucket-name>",
            "Condition": {
                "StringLike": {
                    "s3:prefix": [
                        "emails-receiver/*",
                        "email-attachments/*",
                        "emails-sent/*",
                        "sent-attachments/*"
                    ]
                }
            }
        }
    ]
}
```

### Policy 2 - AWS_MelMe_User_Policy_SES_Restricted:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "SESIdentityManagement",
            "Effect": "Allow",
            "Action": [
                "ses:CreateEmailIdentity",
                "ses:DeleteEmailIdentity",
                "ses:GetEmailIdentity",
                "ses:ListEmailIdentities",
                "ses:PutEmailIdentityDkimAttributes",
                "ses:PutEmailIdentityDkimSigningAttributes"
            ],
            "Resource": "*"
        },
        {
            "Sid": "SESSendEmail",
            "Effect": "Allow",
            "Action": [
                "ses:SendRawEmail",
                "ses:SendEmail"
            ],
            "Resource": "*"
        }
    ]
}
```