'use client';

import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { LoginForm } from '@/components/login-form';
import { useRouter, useSearchParams } from 'next/navigation';

function SignInInner() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') || '/';

  return (
    <>
      <LoginForm
        onSubmit={async (values: { email: string; password: string }) => {
          setError(null);
          const res = await signIn('credentials', {
            email: values.email,
            password: values.password,
            redirect: false,
            callbackUrl,
          });
          if ((res as any)?.error) {
            setError('Credenziali non valide');
            return;
          }
          router.replace(callbackUrl);
        }}
      />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 text-center">
        <a href="/forgot-password" className="text-sm text-muted-foreground hover:underline">Password dimenticata?</a>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Caricamento…</div>}>
          <SignInInner />
        </Suspense>
      </div>
    </main>
  );
}
