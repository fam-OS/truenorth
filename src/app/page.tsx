import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Executive Dashboard for Leaders — Team Planning, Team Management, 1:1 Management',
  description: 'TrueNorth helps leaders with team planning, team management, and 1:1 management — alongside initiatives, KPIs, and financials — all in one place.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'TrueNorth — Team Planning, Team Management, and 1:1 Management',
    description: 'Plan teams, run effective 1:1s, and manage initiatives, KPIs, and financials in one place.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrueNorth — Team Planning, Team Management, 1:1 Management',
    description: 'Plan teams, run effective 1:1s, and manage initiatives, KPIs, and financials in one place.',
    images: ['/og.png'],
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const mfaVerified = (session as any)?.mfaVerified;
    if (mfaVerified === false) {
      redirect('/auth/mfa');
    }
    // If authenticated and MFA is verified (or not required), enforce onboarding completeness here
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
    redirect('/organizations');
  }

  // Marketing landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header (marketing) */}
        <header className="flex justify-between items-center py-6">
          <div aria-hidden className="flex items-center min-w-[1rem]" />
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/signin"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'TrueNorth',
              url: (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, ''),
              logo: '/truenorth-logo.png',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'TrueNorth',
              url: (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, ''),
              potentialAction: {
                '@type': 'SearchAction',
                target: '{baseUrl}/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* Hero Section */}
        <div className="text-center py-20">
          <div className="flex justify-center mb-8">
            <Image 
              src="/truenorth-logo.png" 
              alt="TrueNorth Logo" 
              width={1600}
              height={480}
              className="h-96 w-auto"
            />
          </div>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Team Planning, Team Management, and 1:1 Management for leaders at all levels
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Streamline people leadership and operations with comprehensive tools for team planning, 1:1s, initiatives, KPIs, and financial tracking. Make data-driven decisions that drive growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-lg text-lg font-medium border border-gray-300"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to make your team better operators
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed for leaders who want to track performance, 
              manage teams, and drive results.
            </p>
          </div>

          {/* Key People Leadership Capabilities */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">Team Planning</span>
            <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">Team Management</span>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm">1:1 Management</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Initiatives & KPIs</h3>
              <p className="text-gray-600">Track strategic initiatives and measure success with comprehensive KPI management.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Planning & Management</h3>
              <p className="text-gray-600">Plan headcount and roles, manage performance with integrated org charts, and streamline 1:1s and development conversations.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Tracking</h3>
              <p className="text-gray-600">Monitor costs, forecasts, and budget performance across all business units.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1:1 Management</h3>
              <p className="text-gray-600">Run effective 1:1s with structured notes, follow-ups, and goals to support continuous growth.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ops Reviews</h3>
              <p className="text-gray-600">Conduct quarterly operational reviews with structured reporting and tracking.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics & Reporting</h3>
              <p className="text-gray-600">Generate insights with comprehensive dashboards and custom reports.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join leaders who trust TrueNorth to manage their teams and track their success.
          </p>
          <Link
            href="/auth/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium inline-block"
          >
            Get Started
          </Link>
        </div>

        {/* Footer intentionally omitted here; global Footer renders from layout.tsx */}
      </div>
    </div>
  );
}