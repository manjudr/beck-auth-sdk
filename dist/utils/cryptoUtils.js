"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtils = void 0;
const crypto_1 = __importDefault(require("crypto"));
class CryptoUtils {
    static generateHash(payload) {
        const hash = crypto_1.default.createHash(this.hashAlgorithm);
        hash.update(payload);
        return hash.digest('base64');
    }
    static createSigningString(created, expires, digest) {
        return `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digest}`;
    }
    static async parseKey(publicKeyPem) {
        const keyContent = publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----/g, '').replace(/-----END PUBLIC KEY-----/g, '').replace(/\s/g, '');
        const keyBytes = Buffer.from(keyContent, 'base64');
        if (keyBytes.length === this.RAW_ED25519_KEY_LENGTH) {
            return crypto_1.default.webcrypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, false, ['verify']);
        }
        return crypto_1.default.createPublicKey(publicKeyPem);
    }
    static async verifySignature(signingString, signature, parsedKey) {
        try {
            if (parsedKey instanceof CryptoKey) {
                return crypto_1.default.webcrypto.subtle.verify('Ed25519', parsedKey, Buffer.from(signature, 'base64'), Buffer.from(signingString, 'utf8'));
            }
            return crypto_1.default.verify(null, Buffer.from(signingString, 'utf8'), parsedKey, Buffer.from(signature, 'base64'));
        }
        catch (error) {
            return false;
        }
    }
}
exports.CryptoUtils = CryptoUtils;
CryptoUtils.hashAlgorithm = 'blake2b512';
CryptoUtils.RAW_ED25519_KEY_LENGTH = 32;
