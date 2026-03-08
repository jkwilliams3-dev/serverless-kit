'use strict';

/**
 * @module updateItem
 * PUT /items/:id — Partially update an existing item.
 *
 * All body fields are optional — only provided fields will be updated.
 *
 * Path parameters:
 *   id: string (UUID)
 *
 * Request body (all optional):
 *   { name?, description?, status?, tags?, metadata? }
 *
 * Response 200:
 *   { success: true, data: { id, name, description, status, tags, updatedAt, ... } }
 */

const db = require('../utils/dynamodb');
const res = require('../utils/response');

const VALID_STATUSES = ['active', 'inactive', 'archived'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates update body fields.
 * @param {object} body
 * @returns {{ valid: boolean, errors: object, updates: object }}
 */
const validateBody = (body) => {
  const errors = {};
  const updates = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.name = 'name must be a non-empty string';
    } else if (body.name.length > 200) {
      errors.name = 'name must be 200 characters or fewer';
    } else {
      updates.name = body.name.trim();
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.description = 'description must be a string';
    } else if (body.description.length > 2000) {
      errors.description = 'description must be 2000 characters or fewer';
    } else {
      updates.description = body.description.trim();
    }
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.status = `status must be one of: ${VALID_STATUSES.join(', ')}`;
    } else {
      updates.status = body.status;
      // Keep GSI1 in sync with the status
      updates.gsi1pk = `STATUS#${body.status}`;
    }
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.tags = 'tags must be an array of strings';
    } else if (body.tags.length > 20) {
      errors.tags = 'tags cannot exceed 20 items';
    } else if (body.tags.some((t) => typeof t !== 'string')) {
      errors.tags = 'all tags must be strings';
    } else {
      updates.tags = body.tags;
    }
  }

  if (body.metadata !== undefined) {
    if (typeof body.metadata !== 'object' || Array.isArray(body.metadata)) {
      errors.metadata = 'metadata must be an object';
    } else {
      updates.metadata = body.metadata;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, updates };
};

/**
 * Lambda handler for PUT /items/{id}
 *
 * @param {import('aws-lambda').APIGatewayProxyEvent} event
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
exports.handler = async (event) => {
  const { id } = event.pathParameters || {};

  console.log('updateItem invoked', {
    requestId: event.requestContext?.requestId,
    id,
  });

  // Validate path parameter
  if (!id || !UUID_REGEX.test(id)) {
    return res.badRequest('id must be a valid UUID');
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return res.badRequest('Request body must be valid JSON');
  }

  // Reject empty updates
  if (Object.keys(body).length === 0) {
    return res.badRequest('Request body must contain at least one field to update');
  }

  const { valid, errors, updates } = validateBody(body);
  if (!valid) {
    return res.badRequest('Validation failed', errors);
  }

  try {
    const updatedItem = await db.updateItem(`ITEM#${id}`, `ITEM#${id}`, updates);

    if (!updatedItem) {
      return res.notFound('Item');
    }

    // Strip internal DynamoDB keys
    const { pk, sk, gsi1pk, gsi1sk, ...publicItem } = updatedItem;

    return res.ok(publicItem);
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.notFound('Item');
    }

    console.error('Failed to update item', { id, error: err.message, stack: err.stack });
    return res.internalError('Failed to update item');
  }
};
