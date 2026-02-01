# @manjunath-davanam/beckn-auth-sdk

A generic library for Beckn authorization and signature verification in Node.js/TypeScript projects.

## Installation

```bash
npm install @manjunath-davanam/beckn-auth-sdk
```

## Usage

### Express Middleware

```typescript
import express from 'express';
import { AuthSDK } from '@manjunath-davanam/beckn-auth-sdk';

const app = express();

// Important: Beckn verification requires the raw request body
// Make sure to use a middleware that preserves req.rawBody
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

const auth = new AuthSDK({
  baseUrl: 'https://registry.becknprotocol.io/subscribers',
  registryName: 'lookup',
  retryCount: 3
});

// Protect specific routes
app.post('/on_search', auth.middleware(), (req, res) => {
  res.json({ message: 'Verified' });
});
```

### Manual Verification

```typescript
const auth = new AuthSDK({ ... });

try {
  await auth.authorize(req); // throws error if invalid
  console.log('Valid signature');
} catch (err) {
  console.error('Invalid signature', err.message);
}
```

## Features

- **Standardized**: Implements Beckn HTTP Signature verification (Ed25519 + BLAKE-512).
- **Generic**: Works with any registry that follows the Beckn lookup pattern.
- **Performant**: Built-in caching for parsed public keys.
- **Reliable**: Automatic retries for registry lookups.
- **Configurable**: Pluggable caching and logging layers.
