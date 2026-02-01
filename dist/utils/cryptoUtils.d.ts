import crypto from 'crypto';
export declare class CryptoUtils {
    private static hashAlgorithm;
    private static RAW_ED25519_KEY_LENGTH;
    static generateHash(payload: string): string;
    static createSigningString(created: number, expires: number, digest: string): string;
    static parseKey(publicKeyPem: string): Promise<CryptoKey | crypto.KeyObject>;
    static verifySignature(signingString: string, signature: string, parsedKey: CryptoKey | crypto.KeyObject): Promise<boolean>;
}
