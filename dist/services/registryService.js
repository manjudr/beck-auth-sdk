"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryService = void 0;
const axios_1 = __importDefault(require("axios"));
// @ts-ignore
const axios_retry_1 = __importDefault(require("axios-retry"));
const models_1 = require("../models");
const authUtils_1 = require("../utils/authUtils");
const defaultLogger = {
    debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args),
    info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
};
class RegistryService {
    constructor(config, logger = defaultLogger) {
        this.config = config;
        this.logger = logger;
        this.axiosInstance = axios_1.default.create();
        (0, axios_retry_1.default)(this.axiosInstance, {
            retries: this.config.retryCount || 3,
            retryDelay: axios_retry_1.default.exponentialDelay,
            retryCondition: (error) => {
                return axios_retry_1.default.isNetworkOrIdempotentRequestError(error) ||
                    (error.response?.status !== undefined && error.response.status >= 500 && error.response.status < 600);
            },
            onRetry: (retryCount, error, requestConfig) => {
                this.logger.warn(`Retry attempt ${retryCount} for registry`, {
                    url: requestConfig.url,
                    error: error.message
                });
            }
        });
    }
    async getPublicKey(subscriberId, uniqueKeyId) {
        const registryUrl = authUtils_1.AuthUtils.constructRegistryUrl(this.config, subscriberId, uniqueKeyId);
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
        }
        catch (error) {
            this.handleError(error, registryUrl);
            throw error;
        }
    }
    async fetchRegistryData(url) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.apiToken) {
            headers['Authorization'] = `Bearer ${this.config.apiToken}`;
        }
        const response = await this.axiosInstance.get(url, {
            headers,
            timeout: (this.config.timeoutSeconds || 10) * 1000
        });
        if (!response.data) {
            this.logger.warn('Registry returned empty response', { url });
            throw new Error(models_1.ErrorMessages.REGISTRY_EMPTY_RESPONSE);
        }
        return response.data;
    }
    validateKeyState(data, url) {
        const state = data?.data?.state;
        if (state && state.toLowerCase() !== 'live') {
            this.logger.warn('Public key is not in live state', { url, state });
            throw new Error(models_1.ErrorMessages.AUTH_PUBLIC_KEY_EXPIRED);
        }
    }
    extractPublicKey(data, url) {
        const details = data?.data?.details;
        const publicKey = details?.publicKey || details?.signing_public_key;
        if (!publicKey) {
            this.logger.warn('No public key found in registry response', { url });
            throw new Error(models_1.ErrorMessages.AUTH_PUBLIC_KEY_FIELD_MISSING);
        }
        return publicKey;
    }
    formatToPem(rawKey) {
        let publicKey = rawKey.trim().replace(/^"|"$/g, '');
        if (!publicKey.includes('BEGIN PUBLIC KEY')) {
            publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----\n`;
        }
        return publicKey;
    }
    handleError(error, url) {
        if (error.response?.status === 404) {
            this.logger.warn('Registry returned 404', { url });
            throw new Error(models_1.ErrorMessages.REGISTRY_RECORD_NOT_FOUND);
        }
        const isInternalValidationError = error.message === models_1.ErrorMessages.AUTH_PUBLIC_KEY_EXPIRED ||
            error.message === models_1.ErrorMessages.AUTH_PUBLIC_KEY_FIELD_MISSING ||
            error.message === models_1.ErrorMessages.REGISTRY_EMPTY_RESPONSE ||
            error.message === models_1.ErrorMessages.REGISTRY_RECORD_NOT_FOUND;
        if (!isInternalValidationError) {
            this.logger.error('Failed to get public key from registry after retries', {
                url,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        throw error;
    }
}
exports.RegistryService = RegistryService;
