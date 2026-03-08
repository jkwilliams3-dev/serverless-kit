'use strict';

/**
 * @module getItem
 * GET /items/:id — Retrieve a single item by ID.
 *
 * Path parameters:
 *   id: string (UUID)
 *
 * Response 200:
 *   { success: true, data: { id, name, description, status, tags, createdAt, updatedAt } }
 * Response 404:
 *   { success: false, error: { code: 'NOT_FOUND', message: '...' } }
 */

const db = require('../utils/dynamodb');
const res = require('../utils/response');

/**
 * Lambda handler for GET /items/{id}
 *
 * @param {import('aws-lambda').APIGatewayProxyEvent} event
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
exports.handler = async (event) => {
  const { id } = event.pathParameters || {};

  console.log('getItem invoked', {
    requestId: event.requestContext?.requestId,
    id,
  });

  // Validate the ID path parameter
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return res.badRequest('id must be a valid UUID');
  }

  try {
    const item = await db.getItem(`ITEM#${id}`, `ITEM#${id}`);

    if (!item) {
      return res.notFound('Item');
    }

    // Strip internal DynamoDB keys before returning
    const { pk, sk, gsi1pk, gsi1sk, ...publicItem } = item;

    return res.ok(publicItem);
  } catch (err) {
    console.error('Failed to get item', { id, error: err.message, stack: err.stack });
    return res.internalError('Failed to retrieve item');
  }
};
