import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    const s = session as any; // Explicit cast to satisfy strict CI type checking
    console.log('[OTP][verify] session user:', s?.user?.id, s?.user?.email);
    if (!s?.user?.id) {
      console.warn('[OTP][verify] Unauthorized: missing session.user.id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json().catch(() => ({ code: '' }));
    console.log('[OTP][verify] received code:', code);
    if (!code || typeof code !== 'string') {
      console.warn('[OTP][verify] Invalid code payload');
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: s.user.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = Boolean(
      user.otpCode &&
      user.otpExpiresAt &&
      user.otpCode === code.trim() &&
      user.otpExpiresAt > new Date()
    );

    if (!isValid) {
      console.warn('[OTP][verify] Invalid or expired code for user', user.id, {
        hasCode: Boolean(user.otpCode),
        hasExpiry: Boolean(user.otpExpiresAt),
        expiresAt: user.otpExpiresAt,
      });
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null },
    });
    console.log('[OTP][verify] Verification succeeded for user', user.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[OTP][verify] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
