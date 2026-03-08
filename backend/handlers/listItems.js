'use strict';

/**
 * @module listItems
 * GET /items — List items with pagination, filtering, and sorting.
 *
 * Query parameters:
 *   limit?     : number  (1–100, default 20)
 *   nextKey?   : string  (opaque pagination cursor from previous response)
 *   status?    : string  (filter by status: active | inactive | archived)
 *   search?    : string  (text search against name field, case-insensitive)
 *   sortBy?    : string  (createdAt | updatedAt | name, default: createdAt)
 *   sortOrder? : string  (asc | desc, default: desc)
 *
 * Response 200:
 *   {
 *     success: true,
 *     data: Item[],
 *     pagination: { limit, count, nextKey, hasMore }
 *   }
 */

const db = require('../utils/dynamodb');
const res = require('../utils/response');

const VALID_STATUSES = ['active', 'inactive', 'archived'];
const VALID_SORT_FIELDS = ['createdAt', 'updatedAt', 'name'];
const VALID_SORT_ORDERS = ['asc', 'desc'];

/**
 * Parses and validates query string parameters.
 * @param {object} qs - event.queryStringParameters
 * @returns {{ params: object, errors: object }}
 */
const parseQueryParams = (qs = {}) => {
  const errors = {};
  const params = {};

  // Limit
  const rawLimit = parseInt(qs.limit || '20', 10);
  if (isNaN(rawLimit) || rawLimit < 1) {
    errors.limit = 'limit must be a positive integer';
  } else {
    params.limit = Math.min(rawLimit, 100);
  }

  // Pagination cursor (opaque — just pass through)
  params.nextKey = qs.nextKey || null;

  // Status filter
  if (qs.status) {
    if (!VALID_STATUSES.includes(qs.status)) {
      errors.status = `status must be one of: ${VALID_STATUSES.join(', ')}`;
    } else {
      params.status = qs.status;
    }
  }

  // Text search
  if (qs.search) {
    params.search = qs.search.trim().toLowerCase();
  }

  // Sort field
  params.sortBy = VALID_SORT_FIELDS.includes(qs.sortBy) ? qs.sortBy : 'createdAt';

  // Sort order
  params.sortOrder = VALID_SORT_ORDERS.includes(qs.sortOrder) ? qs.sortOrder : 'desc';

  return { params, errors };
};

/**
 * Lambda handler for GET /items
 *
 * @param {import('aws-lambda').APIGatewayProxyEvent} event
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
exports.handler = async (event) => {
  console.log('listItems invoked', {
    requestId: event.requestContext?.requestId,
    queryParams: event.queryStringParameters,
  });

  const { params, errors } = parseQueryParams(event.queryStringParameters || {});

  if (Object.keys(errors).length > 0) {
    return res.badRequest('Invalid query parameters', errors);
  }

  try {
    let result;

    if (params.status) {
      // Use GSI1 to efficiently query by status
      result = await db.queryItems(`STATUS#${params.status}`, {
        indexName: 'GSI1',
        pkAttribute: 'gsi1pk',
        skAttribute: 'gsi1sk',
        limit: params.limit,
        lastKey: params.nextKey,
        scanForward: params.sortOrder === 'asc',
      });
    } else {
      // No status filter — scan the table (acceptable at small scale)
      result = await db.scanItems({
        limit: params.limit,
        lastKey: params.nextKey,
      });
    }

    let items = result.items
      // Strip internal DynamoDB keys
      .map(({ pk, sk, gsi1pk, gsi1sk, ...item }) => item)
      // Only return items of type 'item' (not other entity types in the table)
      .filter((item) => item.type === 'item');

    // Client-side text search (DynamoDB doesn't support full-text search natively)
    if (params.search) {
      items = items.filter(
        (item) =>
          item.name?.toLowerCase().includes(params.search) ||
          item.description?.toLowerCase().includes(params.search)
      );
    }

    // Sort results
    items.sort((a, b) => {
      const aVal = a[params.sortBy] || '';
      const bVal = b[params.sortBy] || '';
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return params.sortOrder === 'asc' ? comparison : -comparison;
    });

    return res.ok(items, {
      pagination: {
        limit: params.limit,
        count: items.length,
        nextKey: result.nextKey,
        hasMore: result.nextKey !== null,
      },
    });
  } catch (err) {
    console.error('Failed to list items', { error: err.message, stack: err.stack });
    return res.internalError('Failed to retrieve items');
  }
};
