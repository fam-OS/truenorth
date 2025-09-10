import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasTrustedDevice } from '@/lib/trustedDevice';

export default async function DashboardTemplate({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // If not logged in, let the existing client pages handle auth redirects
  if (!session?.user?.id) {
    return <>{children}</>;
  }

  // Do not redirect when already on onboarding path
  // Note: template.tsx does not have access to pathname directly. We will rely on a header hint for now.
  // As a safeguard, the onboarding page itself should not redirect.

  // Enforce onboarding only after OTP is verified (or device is trusted)
  const mfaVerified = (session as any)?.mfaVerified;
  const trusted = await hasTrustedDevice(session.user.id);
  if (mfaVerified === true || trusted) {
    // Load the current user and determine onboarding completeness
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
      redirect('/onboarding');
    }
  }

  return <>{children}</>;
}
