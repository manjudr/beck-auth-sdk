import crypto from 'crypto';

export class CryptoUtils {
    private static hashAlgorithm = 'blake2b512';
    private static RAW_ED25519_KEY_LENGTH = 32;

    static generateHash(payload: string): string {
        const hash = crypto.createHash(this.hashAlgorithm);
        hash.update(payload);
        return hash.digest('base64');
    }

    static createSigningString(created: number, expires: number, digest: string): string {
        return `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digest}`;
    }

    static async parseKey(publicKeyPem: string): Promise<CryptoKey | crypto.KeyObject> {
        const keyContent = publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----/g, '').replace(/-----END PUBLIC KEY-----/g, '').replace(/\s/g, '');
        const keyBytes = Buffer.from(keyContent, 'base64');

        if (keyBytes.length === this.RAW_ED25519_KEY_LENGTH) {
            return crypto.webcrypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, false, ['verify']);
        }

        return crypto.createPublicKey(publicKeyPem);
    }

    static async verifySignature(signingString: string, signature: string, parsedKey: CryptoKey | crypto.KeyObject): Promise<boolean> {
        try {
            if (parsedKey instanceof CryptoKey) {
                return crypto.webcrypto.subtle.verify('Ed25519', parsedKey, Buffer.from(signature, 'base64'), Buffer.from(signingString, 'utf8'));
            }
            return crypto.verify(null, Buffer.from(signingString, 'utf8'), parsedKey as crypto.KeyObject, Buffer.from(signature, 'base64'));
        } catch (error) {
            return false;
        }
    }
}
