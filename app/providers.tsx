'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ClientPrefsSync />
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}

function ClientPrefsSync() {
  const { setTheme } = useTheme();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/profile', { cache: 'no-store' });
        if (!r.ok) return;
        const u = await r.json();
        if (cancelled) return;
        if (u?.theme) setTheme(u.theme);
        const html = document.documentElement;
        if (u?.accentColor) html.setAttribute('data-accent', u.accentColor);
        else html.removeAttribute('data-accent');
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [setTheme]);
  return null;
}
