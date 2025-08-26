import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { QueryClientProvider } from "@/providers/QueryClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrueNorth - Executive Dashboard",
  description: "Manage tasks, goals, and business metrics efficiently",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-gray-100 text-gray-900`}>
        <QueryClientProvider>
          <ToastProvider>
            <OrganizationProvider>
              {children}
            </OrganizationProvider>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}