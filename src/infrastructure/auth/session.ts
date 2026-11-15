/**
 * Stateless signed session for the private access gate.
 *
 * The cookie value is `<expiresAtMs>.<hmac>` where the HMAC (SHA-256) is keyed
 * with SESSION_SECRET (or the passkey itself). A forged or tampered cookie
 * fails verification, unlike the previous constant "authenticated" value
 * that anyone could set by hand. Uses Web Crypto so it works in any runtime.
 */
export const SESSION_COOKIE = 'wavez_session';
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

const DEV_PASSKEY = 'grancanariasurf';
const encoder = new TextEncoder();

/** Configured passkey; the development default is never accepted in production. */
export function getExpectedPasskey(): string | null {
  const configured = process.env.APP_PASSKEY?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? null : DEV_PASSKEY;
}

function getSecret(): string | null {
  return process.env.SESSION_SECRET?.trim() || getExpectedPasskey();
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Buffer.from(signature).toString('base64url');
}

/** Constant-time comparison that does not leak length or prefix matches. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const salt = 'wavez-compare';
  const [ha, hb] = await Promise.all([hmac(salt, a), hmac(salt, b)]);
  let diff = ha.length ^ hb.length;
  for (let i = 0; i < Math.min(ha.length, hb.length); i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(now: number = Date.now()): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const expiresAt = String(now + SESSION_MAX_AGE_S * 1000);
  return `${expiresAt}.${await hmac(secret, expiresAt)}`;
}

export async function verifySessionToken(token: string | undefined, now: number = Date.now()): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;
  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt) || Number(expiresAt) < now) return false;
  return safeEqual(signature, await hmac(secret, expiresAt));
}
