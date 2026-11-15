/**
 * Fixed-window in-memory rate limiter. Per server instance only, which is
 * enough to stop casual abuse of public endpoints on a small deployment.
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function isLimited(key: string, now: number = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      return false;
    }
    entry.count += 1;
    return entry.count > maxRequests;
  };
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'local';
}

/**
 * Stable, non-reversible identifier for an uploader: a salted SHA-256 of the
 * IP, so rate limits can be stored in the database without keeping IPs.
 */
export async function hashedClientKey(headers: Headers): Promise<string> {
  const salt = process.env.REPORTS_HASH_SALT ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'wavez';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${clientIp(headers)}`));
  return Buffer.from(digest).toString('base64url').slice(0, 32);
}
