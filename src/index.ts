import { Request, Response, NextFunction } from 'express';
import { RegistryService, Logger } from './services/registryService';
import { CryptoUtils } from './utils/cryptoUtils';
import { AuthUtils, ParsedAuthHeader, RegistryConfig } from './utils/authUtils';
import { ErrorMessages } from './models';

export interface Cache {
    get(key: string): any;
    set(key: string, value: any): void;
}

interface InternalCache extends Cache {
    _store: Map<string, any>;
}

const defaultCache: InternalCache = {
    _store: new Map<string, any>(),
    get(key: string) { return this._store.get(key); },
    set(key: string, value: any) { this._store.set(key, value); }
};

export interface AuthSDKConfig extends RegistryConfig {
    logger?: Logger;
    cache?: Cache;
}

export class AuthSDK {
    private registryService: RegistryService;
    private cache: Cache;
    private logger?: Logger;

    constructor(config: AuthSDKConfig) {
        this.logger = config.logger;
        this.cache = config.cache || defaultCache;
        this.registryService = new RegistryService(config, config.logger);
    }

    /**
     * Express middleware for Beckn Authorization
     */
    middleware() {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                await this.authorize(req);
                next();
            } catch (error: any) {
                this.logger?.error('Authentication failed', { error: error.message, path: req.path });
                AuthUtils.sendErrorResponse(req, res, error);
            }
        };
    }

    /**
     * Core authorization logic
     */
    async authorize(req: Request): Promise<void> {
        const authHeader = req.headers['authorization'] as string || req.headers['x-gateway-authorization'] as string;
        const signatures = AuthUtils.parseAuthHeader(authHeader);

        AuthUtils.validateTimestamps(signatures);
        await this.verifySignature(req, signatures);
    }

    private async verifySignature(req: Request, auth: ParsedAuthHeader): Promise<void> {
        const parsedKey = await this.getPublicKeyWithCache(auth.subscriberId, auth.uniqueKeyId);

        // Expect req.rawBody to be present (usually via body-parser or custom middleware)
        const payload = (req as any).rawBody || JSON.stringify(req.body);
        const signingString = CryptoUtils.createSigningString(auth.created, auth.expires, CryptoUtils.generateHash(payload));

        if (!(await CryptoUtils.verifySignature(signingString, auth.signature, parsedKey))) {
            this.logger?.warn('Signature verification failed', { subscriberId: auth.subscriberId, uniqueKeyId: auth.uniqueKeyId });
            throw new Error(ErrorMessages.AUTH_VERIFICATION_FAILED);
        }
    }

    private async getPublicKeyWithCache(subscriberId: string, uniqueKeyId: string): Promise<any> {
        const cacheKey = `${subscriberId}:${uniqueKeyId}`;
        const cachedKey = this.cache.get(cacheKey);

        if (cachedKey) {
            return cachedKey;
        }

        const publicKeyPem = await this.registryService.getPublicKey(subscriberId, uniqueKeyId);
        const parsedKey = await CryptoUtils.parseKey(publicKeyPem);

        this.cache.set(cacheKey, parsedKey);
        return parsedKey;
    }
}
