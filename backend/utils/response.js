'use strict';

/**
 * @module response
 * Utility for constructing consistent API Gateway HTTP responses.
 * All responses include CORS headers and a JSON body.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * Builds a success response (2xx).
 *
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {object|array|null} data - The response payload
 * @param {object} [meta] - Optional metadata (pagination, etc.)
 * @returns {object} API Gateway-compatible response object
 */
const success = (statusCode, data, meta = {}) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    success: true,
    data,
    ...meta,
    timestamp: new Date().toISOString(),
  }),
});

/**
 * Builds an error response (4xx / 5xx).
 *
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable error message
 * @param {string} [code] - Machine-readable error code for clients
 * @param {object} [details] - Additional error details (validation errors, etc.)
 * @returns {object} API Gateway-compatible response object
 */
const error = (statusCode, message, code = 'ERROR', details = null) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  }),
});

/**
 * 200 OK
 * @param {object|array} data
 * @param {object} [meta]
 */
const ok = (data, meta) => success(200, data, meta);

/**
 * 201 Created
 * @param {object} data - The newly created resource
 */
const created = (data) => success(201, data);

/**
 * 204 No Content — used for successful deletes
 */
const noContent = () => ({
  statusCode: 204,
  headers: CORS_HEADERS,
  body: '',
});

/**
 * 400 Bad Request — invalid input from the client
 * @param {string} message
 * @param {object} [details] - Validation error details per field
 */
const badRequest = (message, details) =>
  error(400, message, 'BAD_REQUEST', details);

/**
 * 401 Unauthorized — missing or invalid authentication
 * @param {string} [message]
 */
const unauthorized = (message = 'Authentication required') =>
  error(401, message, 'UNAUTHORIZED');

/**
 * 403 Forbidden — authenticated but not allowed
 * @param {string} [message]
 */
const forbidden = (message = 'You do not have permission to perform this action') =>
  error(403, message, 'FORBIDDEN');

/**
 * 404 Not Found
 * @param {string} [resource] - Name of the resource that was not found
 */
const notFound = (resource = 'Resource') =>
  error(404, `${resource} not found`, 'NOT_FOUND');

/**
 * 409 Conflict — resource already exists
 * @param {string} [message]
 */
const conflict = (message = 'Resource already exists') =>
  error(409, message, 'CONFLICT');

/**
 * 429 Too Many Requests
 * @param {string} [message]
 */
const tooManyRequests = (message = 'Rate limit exceeded. Please retry after a moment.') =>
  error(429, message, 'RATE_LIMITED');

/**
 * 500 Internal Server Error
 * @param {string} [message] - Avoid exposing internal details in production
 */
const internalError = (message = 'An internal server error occurred') =>
  error(500, message, 'INTERNAL_ERROR');

module.exports = {
  success,
  error,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
};
