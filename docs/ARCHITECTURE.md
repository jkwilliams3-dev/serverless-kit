# Architecture Decisions

This document explains the key design decisions in ServerlessKit and the trade-offs considered.

---

## 1. Single CloudFormation/SAM Template

**Decision**: All infrastructure is defined in one `template.yaml` using SAM (Serverless Application Model).

**Rationale**:
- Single source of truth — the template IS the documentation for what's deployed
- SAM extends CloudFormation natively; no third-party tools required
- `sam local` lets developers run Lambda + API Gateway on their laptop without AWS credentials
- Parameter overrides per environment (`dev`, `staging`, `prod`) avoid template duplication

**Trade-off**: A single large template can become unwieldy at scale. For multi-team projects, consider breaking into nested stacks or using CDK.

---

## 2. DynamoDB Single-Table Design

**Decision**: One DynamoDB table for all application entities, using a generic `pk`/`sk` key schema.

**Rationale**:
- Single-table design aligns with DynamoDB's access pattern model — design for your queries, not your entities
- Avoids hot partitions by using item-specific partition keys (`ITEM#<uuid>`)
- GSI1 supports efficient status-based queries without full table scans
- On-demand billing (`PAY_PER_REQUEST`) scales to zero — no capacity planning needed in dev/staging

**Key schema**:
```
pk          = ITEM#<uuid>
sk          = ITEM#<uuid>
gsi1pk      = STATUS#<status>
gsi1sk      = CREATED#<ISO-8601>
```

**Trade-off**: Single-table DynamoDB has a steep learning curve and makes ad-hoc queries difficult. For analytics or complex filtering, stream data to S3/Athena or OpenSearch.

---

## 3. Lambda — Individual Functions per Route

**Decision**: Each CRUD route is its own Lambda function (not a monolithic "router Lambda").

**Rationale**:
- Independent scaling — list/get operations scale separately from write operations
- Independent deploy — update one function without redeploying the others
- Smaller deployment packages — each function only includes its own code
- Cleaner CloudWatch logs — each function has its own log group with separate retention

**Trade-off**: More CloudFormation resources and more functions to manage. For very simple APIs, a single "fat Lambda" with an express-style router can reduce overhead.

---

## 4. Cognito for Authentication

**Decision**: AWS Cognito User Pool with SRP (Secure Remote Password) auth flow.

**Rationale**:
- Zero-infrastructure auth — no auth server to maintain, patch, or scale
- JWT tokens integrate directly with API Gateway authorizer
- SRP flow means passwords are never sent in plaintext over the network
- Supports OAuth 2.0 / OIDC flows for federated identity (Google, GitHub, etc.) without code changes
- Up to 50,000 MAU free tier

**Trade-off**: Cognito has quirky behaviour and limited customisation of the hosted UI. For bespoke auth UX, consider using Cognito only as the JWT provider while building a custom sign-in flow.

---

## 5. CloudFront + S3 with OAC (Origin Access Control)

**Decision**: React SPA served from S3 via CloudFront using OAC (not the legacy OAI).

**Rationale**:
- S3 bucket is fully private — no public ACLs or bucket policies exposed to the internet
- OAC uses AWS SigV4 signing for requests from CloudFront to S3 (more secure than OAI)
- CloudFront handles SSL termination, HTTP/2, IPv6, and global edge caching
- SPA routing: 403/404 responses from S3 are rewritten to return `index.html` (React Router handles the route client-side)

**Trade-off**: Adds ~50–100ms to the first deploy propagation. For teams needing instant cache invalidation, CloudFront invalidation API calls add minor cost (~$0.005/1000 paths).

---

## 6. Node.js 18 + ESBuild Minification

**Decision**: Lambda functions target Node.js 18 with SAM's esbuild bundler.

**Rationale**:
- Node.js 18 is an LTS release with AWS SDK v3 support
- esbuild produces significantly smaller bundles than webpack (sub-second build times)
- Smaller packages → faster cold starts → better p99 latency

**Cold start optimisation**:
- Shared `DynamoDBClient` is instantiated outside the handler (reused across warm invocations)
- `DynamoDBDocumentClient.from()` wraps the base client with automatic marshalling
- `removeUndefinedValues: true` prevents accidental `null` attribute writes

---

## 7. Structured Logging

**Decision**: All Lambda handlers log structured JSON objects (not raw strings).

**Rationale**:
- CloudWatch Logs Insights can query JSON fields natively
- Example query to find slow invocations: `filter @type = "REPORT" | sort @duration desc`
- Request IDs, source IPs, and item IDs are included for traceability
- Error logs include `error.message` and `error.stack` separately

---

## 8. CORS Strategy

**Decision**: CORS headers are set in every Lambda response, not managed entirely by API Gateway.

**Rationale**:
- Lambda returns CORS headers directly → they are present even when the authorizer rejects the request
- API Gateway CORS settings handle `OPTIONS` preflight responses
- `CorsOrigin` CloudFormation parameter allows easy restriction per environment

---

## Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        AWS Region                        │
│                                                          │
│  ┌──────────┐     ┌─────────────┐     ┌──────────────┐  │
│  │   User   │────▶│ CloudFront  │────▶│  S3 (React)  │  │
│  └──────────┘     └──────┬──────┘     └──────────────┘  │
│                          │                               │
│                   ┌──────▼──────┐                        │
│                   │ API Gateway │                        │
│                   └──────┬──────┘                        │
│                          │ JWT (Cognito)                  │
│             ┌────────────┼────────────┐                  │
│             ▼            ▼            ▼                  │
│         ┌───────┐  ┌──────────┐  ┌────────┐             │
│         │Create │  │  List /  │  │Delete  │             │
│         │ Item  │  │ Get Item │  │ Item   │  ...        │
│         └───┬───┘  └────┬─────┘  └───┬────┘             │
│             └───────────┼────────────┘                  │
│                         ▼                               │
│                  ┌────────────┐                          │
│                  │  DynamoDB  │                          │
│                  │   Table    │                          │
│                  └────────────┘                          │
│                                                          │
│  ┌────────────┐  ┌─────────────┐                        │
│  │  Cognito   │  │ CloudWatch  │                         │
│  │ User Pool  │  │  Alarms +   │                        │
│  └────────────┘  │  Dashboard  │                        │
│                  └─────────────┘                        │
└─────────────────────────────────────────────────────────┘
```
