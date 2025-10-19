'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function NewCommessaPage() {
  const router = useRouter();
  const [codice, setCodice] = useState('');
  const [titolo, setTitolo] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [clients, setClients] = useState<{ id: number; ragioneSociale: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const json = await res.json();
      setClients(Array.isArray(json) ? json : (json.items || []));
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/commesse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codice, titolo, clientId: Number(clientId) }),
    });
    setLoading(false);
    router.push('/commesse');
  };

  return (
    <main className="p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Nuova commessa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Codice</Label>
              <Input required value={codice} onChange={(e) => setCodice(e.target.value)} />
            </div>
            <div>
              <Label>Titolo</Label>
              <Input required value={titolo} onChange={(e) => setTitolo(e.target.value)} />
            </div>
            <div>
              <Label>Cliente</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                required
                value={clientId}
                onChange={(e) => setClientId(Number(e.target.value))}
              >
                <option value="" disabled>
                  Seleziona cliente
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ragioneSociale}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Salvataggio…' : 'Crea commessa'}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

