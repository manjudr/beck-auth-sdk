"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpStatusCodes = exports.AckStatus = exports.ErrorMessages = exports.ErrorCodes = void 0;
exports.ErrorCodes = {
    INVALID_REQUEST: 'INVALID_REQUEST',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SEC_SIGNATURE_MISSING: 'SEC_SIGNATURE_MISSING',
    SEC_SIGNATURE_INVALID: 'SEC_SIGNATURE_INVALID',
    SEC_SUBSCRIBER_NOT_FOUND: 'SEC_SUBSCRIBER_NOT_FOUND',
    SEC_KEY_NOT_FOUND: 'SEC_KEY_NOT_FOUND',
    SEC_KEY_EXPIRED_OR_REVOKED: 'SEC_KEY_EXPIRED_OR_REVOKED',
    SEC_UNAUTHORIZED_ACTION: 'SEC_UNAUTHORIZED_ACTION',
    NET_INTERNAL_ERROR: 'NET_INTERNAL_ERROR'
};
exports.ErrorMessages = {
    AUTH_HEADER_MISSING: 'Missing Authorization or X-Gateway-Authorization header',
    AUTH_INVALID_FORMAT: 'Invalid Beckn HTTP Signature format',
    AUTH_FUTURE_CREATED: 'Signature created in the future',
    AUTH_EXPIRED: 'Signature has expired',
    AUTH_VERIFICATION_FAILED: 'Signature verification failed',
    REGISTRY_EMPTY_RESPONSE: 'Registry returned empty response',
    AUTH_PUBLIC_KEY_EXPIRED: 'Key is expired or revoked',
    AUTH_PUBLIC_KEY_FIELD_MISSING: 'No public key found in registry response',
    REGISTRY_RECORD_NOT_FOUND: 'Public key not found in registry',
    AUTH_PARTIAL_SIGNATURE: 'Signature incomplete',
    AUTH_SUBSCRIBER_NOT_FOUND: 'Subscriber ID missing in keyId',
    INTERNAL_SERVER_ERROR: 'Internal server error occurred'
};
exports.AckStatus = {
    ACK: 'ACK',
    NACK: 'NACK'
};
exports.HttpStatusCodes = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    INTERNAL_SERVER_ERROR: 500
};
