'use strict';

/**
 * @module createItem
 * POST /items — Create a new item in DynamoDB.
 *
 * Request body:
 *   { name: string, description?: string, status?: string, tags?: string[], metadata?: object }
 *
 * Response 201:
 *   { success: true, data: { id, pk, sk, name, description, status, tags, createdAt, updatedAt } }
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../utils/dynamodb');
const res = require('../utils/response');

// Allowed status values
const VALID_STATUSES = ['active', 'inactive', 'archived'];

/**
 * Validates the request body for item creation.
 * @param {object} body - Parsed request body
 * @returns {{ valid: boolean, errors: object }} Validation result
 */
const validateBody = (body) => {
  const errors = {};

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'name is required and must be a non-empty string';
  } else if (body.name.length > 200) {
    errors.name = 'name must be 200 characters or fewer';
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.description = 'description must be a string';
    } else if (body.description.length > 2000) {
      errors.description = 'description must be 2000 characters or fewer';
    }
  }

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    errors.status = `status must be one of: ${VALID_STATUSES.join(', ')}`;
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.tags = 'tags must be an array of strings';
    } else if (body.tags.length > 20) {
      errors.tags = 'tags cannot exceed 20 items';
    } else if (body.tags.some((t) => typeof t !== 'string')) {
      errors.tags = 'all tags must be strings';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Lambda handler for POST /items
 *
 * @param {import('aws-lambda').APIGatewayProxyEvent} event
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
exports.handler = async (event) => {
  console.log('createItem invoked', {
    requestId: event.requestContext?.requestId,
    sourceIp: event.requestContext?.identity?.sourceIp,
  });

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return res.badRequest('Request body must be valid JSON');
  }

  // Validate input
  const { valid, errors } = validateBody(body);
  if (!valid) {
    return res.badRequest('Validation failed', errors);
  }

  // Build the DynamoDB item
  const id = uuidv4();
  const now = new Date().toISOString();

  const item = {
    // Primary key — single-table design using ITEM# prefix
    pk: `ITEM#${id}`,
    sk: `ITEM#${id}`,
    // GSI key — allows querying all items by status
    gsi1pk: `STATUS#${body.status || 'active'}`,
    gsi1sk: `CREATED#${now}`,
    // Application attributes
    id,
    type: 'item',
    name: body.name.trim(),
    description: body.description?.trim() || '',
    status: body.status || 'active',
    tags: body.tags || [],
    metadata: body.metadata || {},
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.putItem(item);
    console.log('Item created', { id });

    // Return the public-facing representation (strip internal DynamoDB keys)
    const { pk, sk, gsi1pk, gsi1sk, ...publicItem } = item;
    return res.created(publicItem);
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // UUID collision — extremely unlikely but handle gracefully
      return res.conflict('An item with this ID already exists');
    }

    console.error('Failed to create item', { error: err.message, stack: err.stack });
    return res.internalError('Failed to create item');
  }
};
