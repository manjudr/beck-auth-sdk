import { Request, Response, NextFunction } from 'express';
import { Logger } from './services/registryService';
import { RegistryConfig } from './utils/authUtils';
export interface Cache {
    get(key: string): any;
    set(key: string, value: any): void;
}
export interface AuthSDKConfig extends RegistryConfig {
    logger?: Logger;
    cache?: Cache;
}
export declare class AuthSDK {
    private registryService;
    private cache;
    private logger?;
    constructor(config: AuthSDKConfig);
    /**
     * Express middleware for Beckn Authorization
     */
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Core authorization logic
     */
    authorize(req: Request): Promise<void>;
    private verifySignature;
    private getPublicKeyWithCache;
}
