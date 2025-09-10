import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { QueryClientProvider } from "@/providers/QueryClientProvider";
import { AuthSessionProvider } from "@/providers/SessionProvider";
import Footer from "@/components/Footer";
import ClientRefShim from "@/components/ClientRefShim";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "TrueNorth - Executive Dashboard",
    template: "%s | TrueNorth",
  },
  description: "Manage tasks, goals, and business metrics efficiently",
  applicationName: "TrueNorth",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: 'website',
    url: baseUrl,
    siteName: 'TrueNorth',
    title: 'TrueNorth - Executive Dashboard',
    description: 'Manage tasks, goals, and business metrics efficiently',
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'TrueNorth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrueNorth - Executive Dashboard',
    description: 'Manage tasks, goals, and business metrics efficiently',
    images: ['/og.svg'],
  },
  themeColor: '#0A5FFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-gray-100 text-gray-900 min-h-screen flex flex-col`}>
        <AuthSessionProvider>
          <QueryClientProvider>
            <ToastProvider>
              <OrganizationProvider>
                <div className="flex-1">
                  <ClientRefShim />
                  {children}
                </div>
                <Footer />
              </OrganizationProvider>
            </ToastProvider>
          </QueryClientProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}