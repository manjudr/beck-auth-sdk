import { RegistryConfig } from '../utils/authUtils';
export interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
export declare class RegistryService {
    private config;
    private logger;
    private axiosInstance;
    constructor(config: RegistryConfig, logger?: Logger);
    getPublicKey(subscriberId: string, uniqueKeyId: string): Promise<string>;
    private fetchRegistryData;
    private validateKeyState;
    private extractPublicKey;
    private formatToPem;
    private handleError;
}
