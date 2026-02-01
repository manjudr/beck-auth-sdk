"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUtils = void 0;
const models_1 = require("../models");
class AuthUtils {
    static constructRegistryUrl(config, subscriberId, uniqueKeyId) {
        return `${config.baseUrl}/${subscriberId}/${config.registryName}/${uniqueKeyId}`;
    }
    static parseAuthHeader(authHeader) {
        if (!authHeader) {
            throw new Error(models_1.ErrorMessages.AUTH_HEADER_MISSING);
        }
        if (!authHeader.startsWith('Signature ')) {
            throw new Error(models_1.ErrorMessages.AUTH_INVALID_FORMAT);
        }
        const signaturePart = authHeader.substring(10);
        const params = {};
        let match;
        this.paramRegex.lastIndex = 0;
        while ((match = this.paramRegex.exec(signaturePart)) !== null) {
            params[match[1]] = match[2];
        }
        const requiredFields = ['keyId', 'algorithm', 'created', 'expires', 'headers', 'signature'];
        const missingFields = requiredFields.filter(field => !params[field]);
        if (missingFields.length > 0) {
            throw new Error(models_1.ErrorMessages.AUTH_PARTIAL_SIGNATURE);
        }
        const keyIdParts = params.keyId.split('|');
        if (keyIdParts.length !== 3 || !keyIdParts[0]) {
            throw new Error(models_1.ErrorMessages.AUTH_SUBSCRIBER_NOT_FOUND);
        }
        return {
            keyId: params.keyId,
            subscriberId: keyIdParts[0],
            uniqueKeyId: keyIdParts[1],
            algorithm: keyIdParts[2],
            created: parseInt(params.created, 10),
            expires: parseInt(params.expires, 10),
            headers: params.headers,
            signature: params.signature
        };
    }
    static validateTimestamps(auth) {
        const now = Math.floor(Date.now() / 1000);
        if (auth.created > now) {
            throw new Error(models_1.ErrorMessages.AUTH_FUTURE_CREATED);
        }
        if (auth.expires < now) {
            throw new Error(models_1.ErrorMessages.AUTH_EXPIRED);
        }
    }
    static sendErrorResponse(req, res, error) {
        const statusCode = this.getErrorStatusCode(error.message);
        const errorCode = this.getErrorCode(error.message);
        const paths = this.getErrorPaths(error.message);
        const transactionId = req.body?.context?.transaction_id || 'unknown';
        const errorResponse = {
            transaction_id: transactionId,
            timestamp: new Date().toISOString(),
            ack_status: models_1.AckStatus.NACK,
            error: {
                code: errorCode,
                paths: paths,
                message: error.message
            }
        };
        res.status(statusCode).json(errorResponse);
    }
    static getErrorPaths(message) {
        if (message.includes('expired'))
            return 'authorization/expires';
        if (message.includes('future'))
            return 'authorization/created';
        if (message.includes('server'))
            return 'server';
        return 'authorization';
    }
    static getErrorStatusCode(message) {
        if (message.includes(models_1.ErrorMessages.AUTH_HEADER_MISSING))
            return models_1.HttpStatusCodes.BAD_REQUEST;
        if (message.includes(models_1.ErrorMessages.AUTH_INVALID_FORMAT))
            return models_1.HttpStatusCodes.BAD_REQUEST;
        if (message.includes(models_1.ErrorMessages.AUTH_PARTIAL_SIGNATURE))
            return models_1.HttpStatusCodes.BAD_REQUEST;
        if (message.includes(models_1.ErrorMessages.INTERNAL_SERVER_ERROR) ||
            message.includes('Failed to fetch public key') ||
            message.includes('temporarily unavailable')) {
            return models_1.HttpStatusCodes.INTERNAL_SERVER_ERROR;
        }
        return models_1.HttpStatusCodes.UNAUTHORIZED;
    }
    static getErrorCode(message) {
        if (message.includes(models_1.ErrorMessages.AUTH_HEADER_MISSING))
            return models_1.ErrorCodes.SEC_SIGNATURE_MISSING;
        if (message.includes(models_1.ErrorMessages.AUTH_INVALID_FORMAT))
            return models_1.ErrorCodes.INVALID_REQUEST;
        if (message.includes(models_1.ErrorMessages.INTERNAL_SERVER_ERROR) ||
            message.includes('unavailable') ||
            message.includes('Failed to fetch') ||
            message.includes('timeout') ||
            message.includes('Network Error')) {
            return models_1.ErrorCodes.NET_INTERNAL_ERROR;
        }
        if (message.includes(models_1.ErrorMessages.REGISTRY_RECORD_NOT_FOUND))
            return models_1.ErrorCodes.SEC_KEY_NOT_FOUND;
        if (message.includes(models_1.ErrorMessages.AUTH_PUBLIC_KEY_EXPIRED))
            return models_1.ErrorCodes.SEC_KEY_EXPIRED_OR_REVOKED;
        if (message.includes('Subscriber not found'))
            return models_1.ErrorCodes.SEC_SUBSCRIBER_NOT_FOUND;
        if (message.includes(models_1.ErrorMessages.AUTH_SUBSCRIBER_NOT_FOUND))
            return models_1.ErrorCodes.SEC_SUBSCRIBER_NOT_FOUND;
        if (message.includes(models_1.ErrorMessages.AUTH_FUTURE_CREATED) ||
            message.includes(models_1.ErrorMessages.AUTH_EXPIRED) ||
            message.includes(models_1.ErrorMessages.AUTH_VERIFICATION_FAILED) ||
            message.includes(models_1.ErrorMessages.REGISTRY_EMPTY_RESPONSE) ||
            message.includes(models_1.ErrorMessages.AUTH_PUBLIC_KEY_FIELD_MISSING) ||
            message.includes(models_1.ErrorMessages.AUTH_PARTIAL_SIGNATURE)) {
            return models_1.ErrorCodes.SEC_SIGNATURE_INVALID;
        }
        return models_1.ErrorCodes.SEC_UNAUTHORIZED_ACTION;
    }
}
exports.AuthUtils = AuthUtils;
AuthUtils.paramRegex = /(\w+)="([^"]+)"/g;
