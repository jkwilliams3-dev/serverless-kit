# ServerlessKit — AWS Serverless Starter Template

Build a **production-ready AWS serverless application template** with a React frontend. This showcases deep AWS expertise for a senior developer targeting $100-160/hr cloud architecture contracts.

## Tech Stack
- **Backend**: Node.js Lambda functions (simulated locally)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Infrastructure**: CloudFormation template (YAML, well-documented)
- **Database**: DynamoDB schema definitions
- **API**: REST API with API Gateway patterns

## What to Build

### 1. CloudFormation Template (`infrastructure/template.yaml`)
A complete, well-commented CloudFormation template that defines:
- Lambda function resources (CRUD operations)
- DynamoDB table with GSI
- API Gateway REST API with CORS
- IAM roles with least-privilege
- S3 bucket for frontend hosting
- CloudFront distribution
- Cognito User Pool for auth
- CloudWatch alarms and dashboards

**This template should be deployable** (syntactically valid CloudFormation). Add comments explaining every section.

### 2. Lambda Functions (`backend/`)
Create 5 Lambda handler files (Node.js):
- `createItem.js` — POST /items
- `getItem.js` — GET /items/:id
- `listItems.js` — GET /items (with pagination, filtering)
- `updateItem.js` — PUT /items/:id
- `deleteItem.js` — DELETE /items/:id

Each handler should:
- Have proper error handling (try/catch, status codes)
- Validate input
- Return structured responses `{ statusCode, headers (CORS), body }`
- Include JSDoc comments
- Use a shared `utils/dynamodb.js` helper for DynamoDB operations
- Use a shared `utils/response.js` for consistent response formatting

### 3. React Frontend (`frontend/`)
Initialize with Vite + React + TypeScript + Tailwind.

Build a clean dashboard that demonstrates the API:
- **Items Manager** — CRUD interface for the API
  - Table view with sort/filter
  - Create modal with form validation
  - Edit inline or in modal
  - Delete with confirmation
  - Pagination controls
- **API Health** page — shows Lambda function status, latency metrics (mock data)
- **Architecture Diagram** page — visual representation of the serverless architecture
  - Use CSS/SVG to create a simple architecture diagram showing: User → CloudFront → S3 → API Gateway → Lambda → DynamoDB
  - Add labels and connection lines
  - Make it look like an AWS architecture diagram (use AWS orange colors)

### 4. Documentation
- `README.md` — comprehensive setup guide with:
  - Architecture overview
  - Prerequisites (AWS CLI, SAM CLI, Node.js)
  - Quick start (local dev with SAM)
  - Deployment guide (one-command deploy)
  - API documentation (endpoints, request/response schemas)
  - Cost estimation ($5-20/month for moderate traffic)
  - "Built by Jonathan Williams" footer
- `docs/ARCHITECTURE.md` — detailed architecture decisions
- `docs/API.md` — full API documentation with curl examples

### 5. Local Development Setup
- `package.json` with scripts for local dev
- `samconfig.toml` (SAM CLI configuration)
- `.env.example` with required environment variables
- `scripts/seed-data.sh` — seeds DynamoDB with sample data (or outputs the commands)

## Design Requirements
- The frontend should be **dark theme, professional**
- Architecture diagram page should be visually impressive
- All code should have proper TypeScript types
- Error handling everywhere
- Mobile responsive
- 508 compliant

## After Building
1. Initialize frontend: `cd frontend && npm create vite@latest . -- --template react-ts`
2. Install: `npm install`
3. `npm run build` — fix errors
4. `git add -A && git commit -m "feat: ServerlessKit AWS serverless template with React dashboard"`
