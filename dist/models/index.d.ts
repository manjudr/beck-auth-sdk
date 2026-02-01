export declare const ErrorCodes: {
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly SEC_SIGNATURE_MISSING: "SEC_SIGNATURE_MISSING";
    readonly SEC_SIGNATURE_INVALID: "SEC_SIGNATURE_INVALID";
    readonly SEC_SUBSCRIBER_NOT_FOUND: "SEC_SUBSCRIBER_NOT_FOUND";
    readonly SEC_KEY_NOT_FOUND: "SEC_KEY_NOT_FOUND";
    readonly SEC_KEY_EXPIRED_OR_REVOKED: "SEC_KEY_EXPIRED_OR_REVOKED";
    readonly SEC_UNAUTHORIZED_ACTION: "SEC_UNAUTHORIZED_ACTION";
    readonly NET_INTERNAL_ERROR: "NET_INTERNAL_ERROR";
};
export declare const ErrorMessages: {
    readonly AUTH_HEADER_MISSING: "Missing Authorization or X-Gateway-Authorization header";
    readonly AUTH_INVALID_FORMAT: "Invalid Beckn HTTP Signature format";
    readonly AUTH_FUTURE_CREATED: "Signature created in the future";
    readonly AUTH_EXPIRED: "Signature has expired";
    readonly AUTH_VERIFICATION_FAILED: "Signature verification failed";
    readonly REGISTRY_EMPTY_RESPONSE: "Registry returned empty response";
    readonly AUTH_PUBLIC_KEY_EXPIRED: "Key is expired or revoked";
    readonly AUTH_PUBLIC_KEY_FIELD_MISSING: "No public key found in registry response";
    readonly REGISTRY_RECORD_NOT_FOUND: "Public key not found in registry";
    readonly AUTH_PARTIAL_SIGNATURE: "Signature incomplete";
    readonly AUTH_SUBSCRIBER_NOT_FOUND: "Subscriber ID missing in keyId";
    readonly INTERNAL_SERVER_ERROR: "Internal server error occurred";
};
export declare const AckStatus: {
    readonly ACK: "ACK";
    readonly NACK: "NACK";
};
export declare const HttpStatusCodes: {
    readonly OK: 200;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export interface AckResponse {
    transaction_id: string;
    timestamp: string;
    ack_status: string;
    error?: {
        code: string;
        paths: string;
        message: string;
    };
}
