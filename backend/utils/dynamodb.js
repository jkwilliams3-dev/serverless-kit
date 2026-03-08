'use strict';

/**
 * @module dynamodb
 * Thin wrapper around the AWS DynamoDB DocumentClient.
 * Provides Promise-based helpers for common operations used by Lambda handlers.
 *
 * All methods accept and return plain JS objects — no DynamoDB attribute typing needed.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

// Re-use the client across Lambda invocations (connection pooling)
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // When running locally via SAM, point to local DynamoDB
  ...(process.env.AWS_SAM_LOCAL && {
    endpoint: 'http://host.docker.internal:8000',
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,  // Don't write null attrs for undefined JS fields
    convertEmptyValues: false,
  },
});

const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Retrieves a single item by primary key.
 *
 * @param {string} pk - Partition key value
 * @param {string} sk - Sort key value
 * @returns {Promise<object|null>} The item or null if not found
 */
const getItem = async (pk, sk) => {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk },
    })
  );
  return result.Item || null;
};

/**
 * Writes a new item, fails if pk+sk already exists (add-only).
 *
 * @param {object} item - Must include pk and sk fields
 * @returns {Promise<object>} The item that was written
 * @throws {Error} If item already exists (ConditionalCheckFailedException)
 */
const putItem = async (item) => {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Ensure we don't overwrite an existing item
      ConditionExpression: 'attribute_not_exists(pk)',
    })
  );
  return item;
};

/**
 * Upserts an item (creates or fully replaces).
 * Use this when you want to overwrite regardless of existing state.
 *
 * @param {object} item - Must include pk and sk fields
 * @returns {Promise<object>} The item that was written
 */
const upsertItem = async (item) => {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...item,
        updatedAt: new Date().toISOString(),
      },
    })
  );
  return item;
};

/**
 * Partially updates an item using a dynamic update expression.
 * Only the fields provided in `updates` will be changed.
 *
 * @param {string} pk - Partition key
 * @param {string} sk - Sort key
 * @param {object} updates - Key-value pairs to update
 * @returns {Promise<object>} The updated item attributes
 * @throws {Error} If item does not exist
 */
const updateItem = async (pk, sk, updates) => {
  // Dynamically build UpdateExpression from the updates object
  const expressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {
    ':updatedAt': new Date().toISOString(),
  };

  // Always update the updatedAt timestamp
  expressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  Object.entries(updates).forEach(([key, value]) => {
    // Prefix attribute names with # to avoid reserved word conflicts
    const nameKey = `#${key}`;
    const valueKey = `:${key}`;
    expressionParts.push(`${nameKey} = ${valueKey}`);
    expressionAttributeNames[nameKey] = key;
    expressionAttributeValues[valueKey] = value;
  });

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      // Only update if item exists
      ConditionExpression: 'attribute_exists(pk)',
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes;
};

/**
 * Deletes an item by primary key.
 *
 * @param {string} pk - Partition key
 * @param {string} sk - Sort key
 * @returns {Promise<void>}
 * @throws {Error} If item does not exist
 */
const deleteItem = async (pk, sk) => {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk },
      ConditionExpression: 'attribute_exists(pk)',
    })
  );
};

/**
 * Queries items by partition key, with optional sort key filtering.
 *
 * @param {string} pk - Partition key value
 * @param {object} [options] - Query options
 * @param {string} [options.skPrefix] - Filter items where sk begins_with this value
 * @param {number} [options.limit] - Max items to return (default 20, max 100)
 * @param {string} [options.lastKey] - Base64-encoded pagination cursor
 * @param {boolean} [options.scanForward] - Sort ascending (default true)
 * @param {string} [options.indexName] - Use a GSI instead of the main table
 * @returns {Promise<{items: object[], nextKey: string|null, count: number}>}
 */
const queryItems = async (pk, options = {}) => {
  const {
    skPrefix,
    limit = 20,
    lastKey,
    scanForward = true,
    indexName,
    pkAttribute = 'pk',
    skAttribute = 'sk',
  } = options;

  const safeLimit = Math.min(Math.max(1, limit), 100);

  let keyConditionExpression = '#pk = :pk';
  const expressionAttributeNames = { '#pk': pkAttribute };
  const expressionAttributeValues = { ':pk': pk };

  if (skPrefix) {
    keyConditionExpression += ' AND begins_with(#sk, :skPrefix)';
    expressionAttributeNames['#sk'] = skAttribute;
    expressionAttributeValues[':skPrefix'] = skPrefix;
  }

  let exclusiveStartKey;
  if (lastKey) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'));
    } catch {
      // Invalid cursor — start from beginning
    }
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      ...(indexName && { IndexName: indexName }),
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: safeLimit,
      ScanIndexForward: scanForward,
      ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey }),
    })
  );

  const nextKey = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : null;

  return {
    items: result.Items || [],
    nextKey,
    count: result.Count || 0,
  };
};

/**
 * Scans the entire table with optional filter expression.
 * Use sparingly — scan reads every item in the table.
 *
 * @param {object} [options]
 * @param {number} [options.limit]
 * @param {string} [options.lastKey] - Pagination cursor
 * @param {string} [options.filterExpression] - DynamoDB filter expression
 * @param {object} [options.filterValues] - Values for the filter expression
 * @param {object} [options.filterNames] - Attribute names for the filter expression
 * @returns {Promise<{items: object[], nextKey: string|null, count: number}>}
 */
const scanItems = async (options = {}) => {
  const { limit = 20, lastKey, filterExpression, filterValues, filterNames } = options;

  const safeLimit = Math.min(Math.max(1, limit), 100);

  let exclusiveStartKey;
  if (lastKey) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'));
    } catch {
      // Invalid cursor
    }
  }

  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: safeLimit,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ...(filterValues && { ExpressionAttributeValues: filterValues }),
      ...(filterNames && { ExpressionAttributeNames: filterNames }),
      ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey }),
    })
  );

  const nextKey = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : null;

  return {
    items: result.Items || [],
    nextKey,
    count: result.Count || 0,
  };
};

module.exports = {
  getItem,
  putItem,
  upsertItem,
  updateItem,
  deleteItem,
  queryItems,
  scanItems,
};
