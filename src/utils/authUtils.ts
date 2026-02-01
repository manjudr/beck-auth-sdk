import { Request, Response } from 'express';
import { ErrorCodes, HttpStatusCodes, AckResponse, AckStatus, ErrorMessages } from '../models';

export interface ParsedAuthHeader {
    keyId: string;
    subscriberId: string;
    uniqueKeyId: string;
    algorithm: string;
    created: number;
    expires: number;
    headers: string;
    signature: string;
}

export interface RegistryConfig {
    baseUrl: string;
    registryName: string;
    apiToken?: string;
    retryCount?: number;
    timeoutSeconds?: number;
}

export class AuthUtils {
    private static readonly paramRegex = /(\w+)="([^"]+)"/g;

    static constructRegistryUrl(config: RegistryConfig, subscriberId: string, uniqueKeyId: string): string {
        return `${config.baseUrl}/${subscriberId}/${config.registryName}/${uniqueKeyId}`;
    }

    static parseAuthHeader(authHeader: string | undefined): ParsedAuthHeader {
        if (!authHeader) {
            throw new Error(ErrorMessages.AUTH_HEADER_MISSING);
        }
        if (!authHeader.startsWith('Signature ')) {
            throw new Error(ErrorMessages.AUTH_INVALID_FORMAT);
        }

        const signaturePart = authHeader.substring(10);
        const params: Record<string, string> = {};

        let match;
        this.paramRegex.lastIndex = 0;
        while ((match = this.paramRegex.exec(signaturePart)) !== null) {
            params[match[1]] = match[2];
        }

        const requiredFields = ['keyId', 'algorithm', 'created', 'expires', 'headers', 'signature'];
        const missingFields = requiredFields.filter(field => !params[field]);
        if (missingFields.length > 0) {
            throw new Error(ErrorMessages.AUTH_PARTIAL_SIGNATURE);
        }

        const keyIdParts = params.keyId.split('|');
        if (keyIdParts.length !== 3 || !keyIdParts[0]) {
            throw new Error(ErrorMessages.AUTH_SUBSCRIBER_NOT_FOUND);
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

    static validateTimestamps(auth: ParsedAuthHeader): void {
        const now = Math.floor(Date.now() / 1000);

        if (auth.created > now) {
            throw new Error(ErrorMessages.AUTH_FUTURE_CREATED);
        }
        if (auth.expires < now) {
            throw new Error(ErrorMessages.AUTH_EXPIRED);
        }
    }

    static sendErrorResponse(req: Request, res: Response, error: Error): void {
        const statusCode = this.getErrorStatusCode(error.message);
        const errorCode = this.getErrorCode(error.message);
        const paths = this.getErrorPaths(error.message);

        const transactionId = req.body?.context?.transaction_id || 'unknown';

        const errorResponse: AckResponse = {
            transaction_id: transactionId,
            timestamp: new Date().toISOString(),
            ack_status: AckStatus.NACK,
            error: {
                code: errorCode,
                paths: paths,
                message: error.message
            }
        };

        res.status(statusCode).json(errorResponse);
    }

    private static getErrorPaths(message: string): string {
        if (message.includes('expired')) return 'authorization/expires';
        if (message.includes('future')) return 'authorization/created';
        if (message.includes('server')) return 'server';
        return 'authorization';
    }

    private static getErrorStatusCode(message: string): number {
        if (message.includes(ErrorMessages.AUTH_HEADER_MISSING)) return HttpStatusCodes.BAD_REQUEST;
        if (message.includes(ErrorMessages.AUTH_INVALID_FORMAT)) return HttpStatusCodes.BAD_REQUEST;
        if (message.includes(ErrorMessages.AUTH_PARTIAL_SIGNATURE)) return HttpStatusCodes.BAD_REQUEST;

        if (
            message.includes(ErrorMessages.INTERNAL_SERVER_ERROR) ||
            message.includes('Failed to fetch public key') ||
            message.includes('temporarily unavailable')
        ) {
            return HttpStatusCodes.INTERNAL_SERVER_ERROR;
        }
        return HttpStatusCodes.UNAUTHORIZED;
    }

    private static getErrorCode(message: string): string {
        if (message.includes(ErrorMessages.AUTH_HEADER_MISSING)) return ErrorCodes.SEC_SIGNATURE_MISSING;
        if (message.includes(ErrorMessages.AUTH_INVALID_FORMAT)) return ErrorCodes.INVALID_REQUEST;

        if (
            message.includes(ErrorMessages.INTERNAL_SERVER_ERROR) ||
            message.includes('unavailable') ||
            message.includes('Failed to fetch') ||
            message.includes('timeout') ||
            message.includes('Network Error')
        ) {
            return ErrorCodes.NET_INTERNAL_ERROR;
        }

        if (message.includes(ErrorMessages.REGISTRY_RECORD_NOT_FOUND)) return ErrorCodes.SEC_KEY_NOT_FOUND;
        if (message.includes(ErrorMessages.AUTH_PUBLIC_KEY_EXPIRED)) return ErrorCodes.SEC_KEY_EXPIRED_OR_REVOKED;
        if (message.includes('Subscriber not found')) return ErrorCodes.SEC_SUBSCRIBER_NOT_FOUND;
        if (message.includes(ErrorMessages.AUTH_SUBSCRIBER_NOT_FOUND)) return ErrorCodes.SEC_SUBSCRIBER_NOT_FOUND;

        if (
            message.includes(ErrorMessages.AUTH_FUTURE_CREATED) ||
            message.includes(ErrorMessages.AUTH_EXPIRED) ||
            message.includes(ErrorMessages.AUTH_VERIFICATION_FAILED) ||
            message.includes(ErrorMessages.REGISTRY_EMPTY_RESPONSE) ||
            message.includes(ErrorMessages.AUTH_PUBLIC_KEY_FIELD_MISSING) ||
            message.includes(ErrorMessages.AUTH_PARTIAL_SIGNATURE)
        ) {
            return ErrorCodes.SEC_SIGNATURE_INVALID;
        }

        return ErrorCodes.SEC_UNAUTHORIZED_ACTION;
    }
}
