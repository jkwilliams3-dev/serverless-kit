# ServerlessKit

> Production-ready AWS serverless application template — Lambda, DynamoDB, API Gateway, Cognito, CloudFront, and a React dashboard.

![Architecture](docs/architecture-preview.png)

---

## Overview

ServerlessKit is a full-stack serverless starter that you can deploy to AWS in minutes. It demonstrates production-grade patterns: least-privilege IAM, DynamoDB single-table design, Cognito JWT auth, CloudFront CDN, and operational CloudWatch dashboards.

**Built to showcase cloud architecture expertise for teams looking for senior AWS engineers.**

---

## Architecture

```
User → CloudFront (CDN) → S3 (React SPA)
                        ↓
              API Gateway (REST)
                        ↓
              Lambda (Node.js 18)
                        ↓
              DynamoDB (on-demand)
```

All resources are defined in a single CloudFormation/SAM template and are 100% infrastructure-as-code.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| AWS CLI | v2 | [aws.amazon.com/cli](https://aws.amazon.com/cli) |
| SAM CLI | latest | `brew install aws/tap/aws-sam-cli` |
| Docker | any | Required for `sam local` |

Configure AWS credentials:

```bash
aws configure
# or
export AWS_PROFILE=your-profile
```

---

## Quick Start — Local Development

```bash
# 1. Clone and install
git clone https://github.com/yourusername/serverless-kit.git
cd serverless-kit

# 2. Install frontend deps
cd frontend && npm install && cd ..

# 3. Start local DynamoDB
npm run local:dynamo   # runs DynamoDB Local in Docker on :8000

# 4. Seed sample data (in a second terminal)
npm run seed

# 5. Start the local API (SAM Lambda emulation)
npm run local:api      # API available at http://localhost:3000

# 6. Start the React dev server (in a third terminal)
npm run dev            # Frontend at http://localhost:5173
```

Copy `.env.example` to `frontend/.env.local` and set `VITE_API_URL=http://localhost:3000`.

---

## Deployment

### One-command deploy (first time)

```bash
sam build && sam deploy --guided
```

SAM will walk you through configuring region, stack name, and S3 bucket. Answers are saved to `samconfig.toml`.

### Subsequent deploys

```bash
npm run deploy          # deploy dev (uses samconfig.toml defaults)
npm run deploy:prod     # deploy prod environment
```

### Deploy frontend

After deploying the CloudFormation stack, push the React build to S3:

```bash
cd frontend
npm run build

# Get the bucket name from the stack output
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name serverless-kit-dev \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

aws s3 sync dist/ s3://$BUCKET --delete

# Invalidate the CloudFront cache
DIST=$(aws cloudformation describe-stacks \
  --stack-name serverless-kit-dev \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text)
echo "Frontend live at: $DIST"
```

---

## API Endpoints

Base URL: `https://{api-id}.execute-api.us-east-1.amazonaws.com/{env}`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/items` | List items (pagination, filter, sort) |
| `POST` | `/items` | Create a new item |
| `GET` | `/items/:id` | Get a single item |
| `PUT` | `/items/:id` | Update an item (partial) |
| `DELETE` | `/items/:id` | Delete an item |

All endpoints require a valid Cognito JWT in the `Authorization: Bearer <token>` header.

See [docs/API.md](docs/API.md) for full documentation with curl examples.

---

## Request / Response Schema

### Item object

```json
{
  "id": "uuid-v4",
  "name": "string (required, max 200 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "active | inactive | archived",
  "tags": ["string"],
  "metadata": {},
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### Error response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { "field": "error description" }
  },
  "timestamp": "ISO-8601"
}
```

---

## Project Structure

```
serverless-kit/
├── infrastructure/
│   └── template.yaml        # SAM/CloudFormation (single source of truth)
├── backend/
│   ├── handlers/            # Lambda function entry points
│   │   ├── createItem.js
│   │   ├── getItem.js
│   │   ├── listItems.js
│   │   ├── updateItem.js
│   │   └── deleteItem.js
│   └── utils/
│       ├── dynamodb.js      # DynamoDB DocumentClient wrapper
│       └── response.js      # Consistent HTTP response builder
├── frontend/                # React 18 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── pages/           # Route-level components
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript interfaces
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md      # Design decisions and trade-offs
│   └── API.md               # Full API reference
├── scripts/
│   └── seed-data.sh         # Populate DynamoDB with sample data
├── samconfig.toml           # SAM deployment configuration
├── .env.example             # Environment variable template
└── package.json             # Root scripts
```

---

## Cost Estimation

For **moderate traffic (~100K requests/month)**:

| Service | Cost |
|---------|------|
| Lambda (100K invocations) | ~$0.02 |
| API Gateway (100K requests) | ~$0.35 |
| DynamoDB (on-demand, 1M R/W) | ~$1.50 |
| S3 (1GB storage + transfers) | ~$0.03 |
| CloudFront (10GB transfer) | ~$0.85 |
| Cognito (up to 50K MAU) | Free |
| CloudWatch logs + metrics | ~$0.50 |
| **Total** | **~$3–5/month** |

For **high traffic (~5M requests/month)**:
Estimated **$20–40/month** — still far below equivalent EC2/ECS deployments.

---

## Security

- All S3 buckets block public access — served exclusively through CloudFront with OAC
- Lambda execution role uses least-privilege IAM (DynamoDB access scoped to specific table/indexes)
- Cognito User Pool with SRP auth flow (no plain passwords over the wire)
- API Gateway CORS restricted to configured origin
- DynamoDB encryption at rest (AWS managed key)
- CloudWatch alarms for error rate and throttling

---

## docs

- [Architecture Decisions](docs/ARCHITECTURE.md)
- [Full API Reference](docs/API.md)

---

## License

MIT

---

*Built by **Jonathan Williams** — Senior Cloud Architect | AWS Solutions Architect*
*Available for cloud architecture engagements: [linkedin.com/in/jonathanwilliams](https://linkedin.com)*
