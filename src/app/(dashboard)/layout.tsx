import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NavLayoutShell from './NavLayoutShell';
import { hasTrustedDevice } from '@/lib/trustedDevice';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // If logged in AND OTP/MFA is verified, enforce onboarding completeness
  const mfaVerified = (session as any)?.mfaVerified;
  const trusted = session?.user?.id ? await hasTrustedDevice(session.user.id) : false;
  // If OTP not verified and device is not trusted, force MFA screen first
  if (session?.user?.id && !trusted && mfaVerified === false) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/mfa');
  }

  if (session?.user?.id && (mfaVerified === true || trusted)) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const u = user as any;
    const complete = !!(
      u &&
      u.firstName &&
      u.lastName &&
      u.companyName &&
      u.level &&
      u.industry &&
      Array.isArray(u.leadershipStyles) && u.leadershipStyles.length > 0
    );

    if (!complete) {
      // Server redirect at the layout level
      const { redirect } = await import('next/navigation');
      redirect('/onboarding');
    }
  }

  return (
    <NavLayoutShell>
      {children}
    </NavLayoutShell>
  );
}