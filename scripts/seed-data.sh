#!/usr/bin/env bash
# ============================================================
# seed-data.sh — Seeds DynamoDB with sample items
#
# Usage:
#   bash scripts/seed-data.sh              # seeds local DynamoDB
#   TABLE_NAME=my-table bash scripts/seed-data.sh  # override table name
#   ENDPOINT=https://... bash scripts/seed-data.sh # use AWS (omit endpoint)
#
# Prerequisites: AWS CLI v2 installed and configured
# ============================================================

set -euo pipefail

TABLE_NAME="${TABLE_NAME:-serverless-kit-items-dev}"
ENDPOINT_FLAG="${ENDPOINT:+--endpoint-url $ENDPOINT}"

# Default: target local DynamoDB (SAM local)
if [[ -z "${ENDPOINT:-}" ]]; then
  ENDPOINT_FLAG="--endpoint-url http://localhost:8000"
fi

echo "Seeding table: $TABLE_NAME"
echo "Endpoint: ${ENDPOINT:-http://localhost:8000}"
echo ""

# Helper: write a single item to DynamoDB
put_item() {
  local id="$1"
  local name="$2"
  local description="$3"
  local status="$4"
  local tags="$5"
  local now
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  aws dynamodb put-item \
    $ENDPOINT_FLAG \
    --table-name "$TABLE_NAME" \
    --item "{
      \"pk\":          {\"S\": \"ITEM#${id}\"},
      \"sk\":          {\"S\": \"ITEM#${id}\"},
      \"gsi1pk\":      {\"S\": \"STATUS#${status}\"},
      \"gsi1sk\":      {\"S\": \"CREATED#${now}\"},
      \"id\":          {\"S\": \"${id}\"},
      \"type\":        {\"S\": \"item\"},
      \"name\":        {\"S\": \"${name}\"},
      \"description\": {\"S\": \"${description}\"},
      \"status\":      {\"S\": \"${status}\"},
      \"tags\":        {\"SS\": ${tags}},
      \"createdAt\":   {\"S\": \"${now}\"},
      \"updatedAt\":   {\"S\": \"${now}\"}
    }" 2>&1 && echo "  ✓ Created: $name" || echo "  ✗ Failed:  $name"
}

echo "Creating sample items..."
echo ""

put_item \
  "11111111-1111-4111-8111-111111111111" \
  "User Authentication Service" \
  "Handles sign-up, sign-in, and token refresh via Cognito." \
  "active" \
  "[\"cognito\",\"auth\",\"lambda\"]"

put_item \
  "22222222-2222-4222-8222-222222222222" \
  "Data Export Pipeline" \
  "Exports DynamoDB snapshots to S3 on a nightly schedule." \
  "active" \
  "[\"s3\",\"dynamo\",\"scheduled\"]"

put_item \
  "33333333-3333-4333-8333-333333333333" \
  "Email Notification Worker" \
  "Processes SQS queue and sends transactional emails via SES." \
  "active" \
  "[\"sqs\",\"ses\",\"worker\"]"

put_item \
  "44444444-4444-4444-8444-444444444444" \
  "Image Processing Lambda" \
  "Resizes and optimises uploaded images stored in S3." \
  "inactive" \
  "[\"s3\",\"sharp\",\"images\"]"

put_item \
  "55555555-5555-4555-8555-555555555555" \
  "API Rate Limiter" \
  "Token-bucket rate limiting middleware for all API routes." \
  "active" \
  "[\"api-gateway\",\"waf\",\"security\"]"

put_item \
  "66666666-6666-4666-8666-666666666666" \
  "Legacy CSV Importer" \
  "One-off batch import for migrating legacy CSV data." \
  "archived" \
  "[\"migration\",\"batch\",\"csv\"]"

put_item \
  "77777777-7777-4777-8777-777777777777" \
  "Search Index Builder" \
  "Streams DynamoDB changes to OpenSearch for full-text search." \
  "active" \
  "[\"opensearch\",\"streams\",\"search\"]"

put_item \
  "88888888-8888-4888-8888-888888888888" \
  "Audit Log Aggregator" \
  "Collects CloudTrail events and stores them in a queryable format." \
  "active" \
  "[\"cloudtrail\",\"audit\",\"compliance\"]"

echo ""
echo "Done! Seeded 8 sample items into $TABLE_NAME."
echo ""
echo "To verify, run:"
echo "  aws dynamodb scan --table-name $TABLE_NAME $ENDPOINT_FLAG --query 'Items[].name'"
