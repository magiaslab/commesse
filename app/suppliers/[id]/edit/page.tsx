'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormSupplier } from '@/components/forms/FormSupplier';

export default function EditSupplierPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/suppliers/${id}`, { cache: 'no-store' });
      const json = await res.json();
      setInitial(json);
    })();
  }, [id]);

  if (!initial) return <main className="p-6">Caricamento…</main>;

  return (
    <main className="p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Modifica fornitore</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSupplier supplierId={Number(id)} initial={initial} onSubmitted={() => router.push(`/suppliers/${id}`)} />
        </CardContent>
      </Card>
    </main>
  );
}
