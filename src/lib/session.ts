// Web Crypto API implementation - works in both Edge Runtime and Node.js

// Get or generate a session secret
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    console.warn('WARNING: Using default session secret. Set SESSION_SECRET env var for production.');
    return 'dev-only-secret-change-in-production-a1b2c3d4e5f6';
  }
  return secret;
}

/**
 * Create a signed session token from a user ID
 * Format: userId.signature
 * Uses Web Crypto API (works in Edge Runtime and Node.js)
 */
export async function createSessionToken(userId: string): Promise<string> {
  const secret = getSessionSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(userId)
  );
  const sigHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${userId}.${sigHex}`;
}

/**
 * Verify and extract user ID from a signed session token
 * Returns null if the token is invalid or tampered with
 * Uses Web Crypto API (works in Edge Runtime and Node.js)
 */
export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const dotIndex = token.indexOf('.');
    if (dotIndex === -1) return null;

    const userId = token.substring(0, dotIndex);
    const signature = token.substring(dotIndex + 1);

    if (!userId || !signature) return null;

    const secret = getSessionSecret();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedSig = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(userId)
    );
    const expectedHex = Array.from(new Uint8Array(expectedSig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedHex.length) return null;
    
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    return userId;
  } catch {
    return null;
  }
}

/**
 * Get user ID from session cookie value
 * Verifies the signature and returns the user ID if valid
 */
export async function getUserIdFromSession(cookieValue: string | undefined): Promise<string | null> {
  if (!cookieValue) return null;
  return verifySessionToken(cookieValue);
}
