'use strict';

/**
 * @module deleteItem
 * DELETE /items/:id — Delete an item from DynamoDB.
 *
 * This performs a hard delete. For soft deletes (status = 'archived'),
 * use PUT /items/:id with { status: 'archived' } instead.
 *
 * Path parameters:
 *   id: string (UUID)
 *
 * Response 204: No Content (success, no body)
 * Response 404: Item not found
 */

const db = require('../utils/dynamodb');
const res = require('../utils/response');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Lambda handler for DELETE /items/{id}
 *
 * @param {import('aws-lambda').APIGatewayProxyEvent} event
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
exports.handler = async (event) => {
  const { id } = event.pathParameters || {};

  console.log('deleteItem invoked', {
    requestId: event.requestContext?.requestId,
    id,
  });

  // Validate path parameter
  if (!id || !UUID_REGEX.test(id)) {
    return res.badRequest('id must be a valid UUID');
  }

  try {
    await db.deleteItem(`ITEM#${id}`, `ITEM#${id}`);

    console.log('Item deleted', { id });
    return res.noContent();
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Item did not exist — ConditionExpression caught this
      return res.notFound('Item');
    }

    console.error('Failed to delete item', { id, error: err.message, stack: err.stack });
    return res.internalError('Failed to delete item');
  }
};
