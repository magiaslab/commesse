'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function ResetPasswordInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) return toast.error('Token mancante');
    if (password.length < 8) return toast.error('Minimo 8 caratteri');
    if (password !== confirm) return toast.error('Le password non coincidono');
    setLoading(true);
    const r = await fetch('/api/auth/password/reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!r.ok) {
      const t = await r.text();
      try { const j = JSON.parse(t); toast.error(j.error || 'Errore'); } catch { toast.error('Errore'); }
      return;
    }
    toast.success('Password aggiornata. Effettua l’accesso.');
    router.replace('/signin');
  };

  return (
    <div className="w-full max-w-sm space-y-3">
      <h1 className="text-xl font-semibold">Reimposta password</h1>
      <div className="space-y-2">
        <label className="text-sm">Nuova password</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Conferma password</label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <Button className="w-full" onClick={submit} disabled={loading}>Imposta password</Button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Caricamento…</div>}>
        <ResetPasswordInner />
      </Suspense>
    </main>
  );
}





