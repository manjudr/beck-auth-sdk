import { Request, Response } from 'express';
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
export declare class AuthUtils {
    private static readonly paramRegex;
    static constructRegistryUrl(config: RegistryConfig, subscriberId: string, uniqueKeyId: string): string;
    static parseAuthHeader(authHeader: string | undefined): ParsedAuthHeader;
    static validateTimestamps(auth: ParsedAuthHeader): void;
    static sendErrorResponse(req: Request, res: Response, error: Error): void;
    private static getErrorPaths;
    private static getErrorStatusCode;
    private static getErrorCode;
}
