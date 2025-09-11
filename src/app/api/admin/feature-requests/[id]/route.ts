import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

function isAdminEmail(email?: string | null): boolean {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const message: string | undefined = body?.message;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }
    const fr = await prisma.featureRequest.findUnique({
      where: { id },
      include: { User: { select: { email: true, name: true } } },
    });
    if (!fr) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const to = fr.User?.email;
    if (!to) {
      return NextResponse.json({ error: 'Submitter has no email' }, { status: 400 });
    }
    const subject = `Re: Feature Request — ${fr.title}`;
    const html = `<p>Hi ${fr.User?.name || ''},</p><p>${message.replace(/\n/g, '<br/>')}</p><hr/><p>Regarding your feature request: <strong>${fr.title}</strong></p>`;
    const replyTo = process.env.EMAIL_FROM || 'sonja@true-north.app';
    await sendEmail({ to, subject, html, replyTo, headers: { 'X-Admin-Responder': session.user.email || 'admin' } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[Admin][FeatureRequest] POST error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const fr = await prisma.featureRequest.findUnique({
      where: { id },
      include: { User: { select: { id: true, email: true, name: true } } },
    });
    if (!fr) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(fr);
  } catch (e) {
    console.error('[Admin][FeatureRequest] GET error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
