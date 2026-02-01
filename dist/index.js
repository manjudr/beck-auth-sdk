"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSDK = void 0;
const registryService_1 = require("./services/registryService");
const cryptoUtils_1 = require("./utils/cryptoUtils");
const authUtils_1 = require("./utils/authUtils");
const models_1 = require("./models");
const defaultCache = {
    _store: new Map(),
    get(key) { return this._store.get(key); },
    set(key, value) { this._store.set(key, value); }
};
class AuthSDK {
    constructor(config) {
        this.logger = config.logger;
        this.cache = config.cache || defaultCache;
        this.registryService = new registryService_1.RegistryService(config, config.logger);
    }
    /**
     * Express middleware for Beckn Authorization
     */
    middleware() {
        return async (req, res, next) => {
            try {
                await this.authorize(req);
                next();
            }
            catch (error) {
                this.logger?.error('Authentication failed', { error: error.message, path: req.path });
                authUtils_1.AuthUtils.sendErrorResponse(req, res, error);
            }
        };
    }
    /**
     * Core authorization logic
     */
    async authorize(req) {
        const authHeader = req.headers['authorization'] || req.headers['x-gateway-authorization'];
        const signatures = authUtils_1.AuthUtils.parseAuthHeader(authHeader);
        authUtils_1.AuthUtils.validateTimestamps(signatures);
        await this.verifySignature(req, signatures);
    }
    async verifySignature(req, auth) {
        const parsedKey = await this.getPublicKeyWithCache(auth.subscriberId, auth.uniqueKeyId);
        // Expect req.rawBody to be present (usually via body-parser or custom middleware)
        const payload = req.rawBody || JSON.stringify(req.body);
        const signingString = cryptoUtils_1.CryptoUtils.createSigningString(auth.created, auth.expires, cryptoUtils_1.CryptoUtils.generateHash(payload));
        if (!(await cryptoUtils_1.CryptoUtils.verifySignature(signingString, auth.signature, parsedKey))) {
            this.logger?.warn('Signature verification failed', { subscriberId: auth.subscriberId, uniqueKeyId: auth.uniqueKeyId });
            throw new Error(models_1.ErrorMessages.AUTH_VERIFICATION_FAILED);
        }
    }
    async getPublicKeyWithCache(subscriberId, uniqueKeyId) {
        const cacheKey = `${subscriberId}:${uniqueKeyId}`;
        const cachedKey = this.cache.get(cacheKey);
        if (cachedKey) {
            return cachedKey;
        }
        const publicKeyPem = await this.registryService.getPublicKey(subscriberId, uniqueKeyId);
        const parsedKey = await cryptoUtils_1.CryptoUtils.parseKey(publicKeyPem);
        this.cache.set(cacheKey, parsedKey);
        return parsedKey;
    }
}
exports.AuthSDK = AuthSDK;
