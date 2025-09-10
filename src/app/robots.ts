import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/terms'],
        disallow: [
          '/api/',
          '/auth/',
          '/onboarding',
          '/organizations',
          '/teams',
          '/team-members',
          '/ops-reviews',
          '/goals',
          '/kpis',
          '/reports',
          '/(dashboard)/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
