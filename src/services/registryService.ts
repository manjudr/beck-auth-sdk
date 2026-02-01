import axios from 'axios';
// @ts-ignore
import axiosRetry from 'axios-retry';
import { ErrorMessages } from '../models';
import { AuthUtils, RegistryConfig } from '../utils/authUtils';

export interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

const defaultLogger: Logger = {
    debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args),
    info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
};

export class RegistryService {
    private config: RegistryConfig;
    private logger: Logger;
    private axiosInstance: any;

    constructor(config: RegistryConfig, logger: Logger = defaultLogger) {
        this.config = config;
        this.logger = logger;
        this.axiosInstance = axios.create();

        axiosRetry(this.axiosInstance, {
            retries: this.config.retryCount || 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error: any) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                    (error.response?.status !== undefined && error.response.status >= 500 && error.response.status < 600);
            },
            onRetry: (retryCount: number, error: any, requestConfig: any) => {
                this.logger.warn(`Retry attempt ${retryCount} for registry`, {
                    url: requestConfig.url,
                    error: error.message
                });
            }
        });
    }

    async getPublicKey(subscriberId: string, uniqueKeyId: string): Promise<string> {
        const registryUrl = AuthUtils.constructRegistryUrl(this.config, subscriberId, uniqueKeyId);

        this.logger.debug('Fetching public key from registry', { registryUrl });

        try {
            const responseData = await this.fetchRegistryData(registryUrl);
            this.validateKeyState(responseData, registryUrl);
            const rawKey = this.extractPublicKey(responseData, registryUrl);
            const pemKey = this.formatToPem(rawKey);

            this.logger.info('Public key retrieved from registry', {
                registryUrl,
                recordName: responseData?.data?.record_name
            });

            return pemKey;

        } catch (error: any) {
            this.handleError(error, registryUrl);
            throw error;
        }
    }

    private async fetchRegistryData(url: string): Promise<any> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this.config.apiToken) {
            headers['Authorization'] = `Bearer ${this.config.apiToken}`;
        }

        const response = await this.axiosInstance.get(url, {
            headers,
            timeout: (this.config.timeoutSeconds || 10) * 1000
        });

        if (!response.data) {
            this.logger.warn('Registry returned empty response', { url });
            throw new Error(ErrorMessages.REGISTRY_EMPTY_RESPONSE);
        }

        return response.data;
    }

    private validateKeyState(data: any, url: string): void {
        const state = data?.data?.state;
        if (state && state.toLowerCase() !== 'live') {
            this.logger.warn('Public key is not in live state', { url, state });
            throw new Error(ErrorMessages.AUTH_PUBLIC_KEY_EXPIRED);
        }
    }

    private extractPublicKey(data: any, url: string): string {
        const details = data?.data?.details;
        const publicKey = details?.publicKey || details?.signing_public_key;

        if (!publicKey) {
            this.logger.warn('No public key found in registry response', { url });
            throw new Error(ErrorMessages.AUTH_PUBLIC_KEY_FIELD_MISSING);
        }
        return publicKey;
    }

    private formatToPem(rawKey: string): string {
        let publicKey = rawKey.trim().replace(/^"|"$/g, '');
        if (!publicKey.includes('BEGIN PUBLIC KEY')) {
            publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----\n`;
        }
        return publicKey;
    }

    private handleError(error: any, url: string): void {
        if (error.response?.status === 404) {
            this.logger.warn('Registry returned 404', { url });
            throw new Error(ErrorMessages.REGISTRY_RECORD_NOT_FOUND);
        }

        const isInternalValidationError =
            error.message === ErrorMessages.AUTH_PUBLIC_KEY_EXPIRED ||
            error.message === ErrorMessages.AUTH_PUBLIC_KEY_FIELD_MISSING ||
            error.message === ErrorMessages.REGISTRY_EMPTY_RESPONSE ||
            error.message === ErrorMessages.REGISTRY_RECORD_NOT_FOUND;

        if (!isInternalValidationError) {
            this.logger.error('Failed to get public key from registry after retries', {
                url,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        throw error;
    }
}
