# API Reference

Base URL: `https://{api-id}.execute-api.us-east-1.amazonaws.com/{env}`

For local development: `http://localhost:3000`

All requests require:
```
Authorization: Bearer <cognito-id-token>
Content-Type: application/json
```

---

## Items

### List Items

```
GET /items
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `20` | Items per page (1–100) |
| `nextKey` | string | — | Pagination cursor from previous response |
| `status` | string | — | Filter: `active`, `inactive`, `archived` |
| `search` | string | — | Text search against name/description |
| `sortBy` | string | `createdAt` | Sort field: `createdAt`, `updatedAt`, `name` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Example Request**

```bash
curl -X GET \
  "https://abc123.execute-api.us-east-1.amazonaws.com/dev/items?limit=10&status=active&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer eyJ..."
```

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "type": "item",
      "name": "User Authentication Service",
      "description": "Handles sign-up, sign-in, and token refresh via Cognito.",
      "status": "active",
      "tags": ["cognito", "auth", "lambda"],
      "metadata": {},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "count": 1,
    "nextKey": null,
    "hasMore": false
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

### Get Item

```
GET /items/:id
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID v4 | Item identifier |

**Example Request**

```bash
curl -X GET \
  "https://abc123.execute-api.us-east-1.amazonaws.com/dev/items/11111111-1111-4111-8111-111111111111" \
  -H "Authorization: Bearer eyJ..."
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "type": "item",
    "name": "User Authentication Service",
    "description": "Handles sign-up, sign-in, and token refresh via Cognito.",
    "status": "active",
    "tags": ["cognito", "auth"],
    "metadata": {},
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**Response 404**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

### Create Item

```
POST /items
```

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–200 characters |
| `description` | string | No | Max 2000 characters |
| `status` | string | No | `active` (default), `inactive`, `archived` |
| `tags` | string[] | No | Max 20 tags |
| `metadata` | object | No | Arbitrary key-value pairs |

**Example Request**

```bash
curl -X POST \
  "https://abc123.execute-api.us-east-1.amazonaws.com/dev/items" \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cache Warming Service",
    "description": "Pre-warms Lambda containers before peak traffic windows.",
    "status": "active",
    "tags": ["lambda", "performance", "scheduled"],
    "metadata": {
      "schedule": "rate(5 minutes)",
      "targetFunctions": ["ListItemsFunction", "GetItemFunction"]
    }
  }'
```

**Response 201**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
    "type": "item",
    "name": "Cache Warming Service",
    "description": "Pre-warms Lambda containers before peak traffic windows.",
    "status": "active",
    "tags": ["lambda", "performance", "scheduled"],
    "metadata": {
      "schedule": "rate(5 minutes)",
      "targetFunctions": ["ListItemsFunction", "GetItemFunction"]
    },
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**Response 400 — Validation Error**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {
      "name": "name is required and must be a non-empty string",
      "status": "status must be one of: active, inactive, archived"
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

### Update Item

```
PUT /items/:id
```

All fields are optional — only provided fields will be updated (partial update / PATCH semantics).

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID v4 | Item identifier |

**Request Body** (all fields optional)

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | 1–200 characters |
| `description` | string | Max 2000 characters |
| `status` | string | `active`, `inactive`, `archived` |
| `tags` | string[] | Max 20 tags |
| `metadata` | object | Arbitrary key-value pairs |

**Example Request**

```bash
curl -X PUT \
  "https://abc123.execute-api.us-east-1.amazonaws.com/dev/items/a1b2c3d4-e5f6-4789-abcd-ef0123456789" \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive",
    "tags": ["lambda", "performance", "deprecated"]
  }'
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
    "name": "Cache Warming Service",
    "status": "inactive",
    "tags": ["lambda", "performance", "deprecated"],
    "updatedAt": "2024-01-16T08:00:00.000Z"
  },
  "timestamp": "2024-01-16T08:00:00.000Z"
}
```

---

### Delete Item

```
DELETE /items/:id
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID v4 | Item identifier |

**Example Request**

```bash
curl -X DELETE \
  "https://abc123.execute-api.us-east-1.amazonaws.com/dev/items/a1b2c3d4-e5f6-4789-abcd-ef0123456789" \
  -H "Authorization: Bearer eyJ..."
```

**Response 204** — No content (success)

**Response 404**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found"
  },
  "timestamp": "2024-01-16T08:00:00.000Z"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid input or missing required fields |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | Valid token but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests — back off and retry |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Pagination

List endpoints return a `pagination` object. To fetch the next page, pass the `nextKey` value as a query parameter:

```bash
# First page
curl ".../items?limit=20"

# Next page (use nextKey from previous response)
curl ".../items?limit=20&nextKey=eyJwayI6IklURU0j..."
```

`nextKey` is an opaque base64-encoded cursor. Do not construct or modify it — treat it as an implementation detail.
