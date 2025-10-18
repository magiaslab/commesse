'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormClient } from '@/components/forms/FormClient';

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/clients/${id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setInitial(json);
    })();
  }, [id]);

  if (!initial) return <main className="p-6">Caricamento…</main>;

  return (
    <main className="p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Modifica cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <FormClient clientId={Number(id)} initial={initial} onSubmitted={() => router.push(`/clients/${id}`)} submitLabel="Aggiorna cliente" />
        </CardContent>
      </Card>
    </main>
  );
}


