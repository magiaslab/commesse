import "../styles/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Providers from './providers';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: "Commesse",
  description: "Gestione commesse v0.1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
