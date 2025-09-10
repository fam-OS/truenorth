import 'server-only';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Trusted device cookie utilities
// We sign a token: base64(userId).timestamp.signature
// signature = HMAC-SHA256(`${userId}.${timestamp}`, secret)

const COOKIE_PREFIX = 'tn_td_';
const DEFAULT_WINDOW_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '';
  if (!secret) {
    throw new Error('Missing NEXTAUTH_SECRET for trusted device signing');
  }
  return secret;
}

function sign(userId: string, timestamp: number): string {
  const secret = getSecret();
  const h = crypto.createHmac('sha256', secret);
  h.update(`${userId}.${timestamp}`);
  return h.digest('hex');
}

function buildToken(userId: string, timestamp: number): string {
  const id = Buffer.from(userId).toString('base64url');
  const sig = sign(userId, timestamp);
  return `${id}.${timestamp}.${sig}`;
}

function parseToken(token: string | undefined): { userId: string; timestamp: number; sig: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const userId = Buffer.from(parts[0], 'base64url').toString('utf8');
    const timestamp = Number(parts[1]);
    const sig = parts[2];
    if (!userId || !Number.isFinite(timestamp) || !sig) return null;
    return { userId, timestamp, sig };
  } catch {
    return null;
  }
}

export async function hasTrustedDevice(userId: string, windowMs = DEFAULT_WINDOW_MS): Promise<boolean> {
  try {
    const c = await cookies();
    const token = c.get(`${COOKIE_PREFIX}${userId}`)?.value;
    const parsed = parseToken(token);
    if (!parsed) return false;
    if (parsed.userId !== userId) return false;
    const expected = sign(parsed.userId, parsed.timestamp);
    if (!crypto.timingSafeEqual(Buffer.from(parsed.sig), Buffer.from(expected))) return false;
    const now = Date.now();
    return now - parsed.timestamp < windowMs;
  } catch {
    return false;
  }
}

export async function setTrustedDevice(userId: string, windowMs = DEFAULT_WINDOW_MS) {
  const c = await cookies();
  const now = Date.now();
  const token = buildToken(userId, now);
  const expires = new Date(now + windowMs);
  c.set(`${COOKIE_PREFIX}${userId}`, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
  });
}

export async function clearTrustedDevice(userId: string) {
  const c = await cookies();
  c.delete(`${COOKIE_PREFIX}${userId}`);
}
