import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Optional: rudimentary rate limit by not issuing a new code if an unexpired one exists
    if (user.otpCode && user.otpExpiresAt && user.otpExpiresAt > new Date()) {
      return NextResponse.json({ ok: true, resent: false });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpiresAt: expires },
    });

    await sendEmail({
      to: session.user.email,
      subject: 'Your TrueNorth verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`,
    });

    return NextResponse.json({ ok: true, resent: true });
  } catch (e) {
    console.error('[OTP][request] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
