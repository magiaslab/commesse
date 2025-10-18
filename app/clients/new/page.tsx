'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormClient } from '@/components/forms/FormClient';

export default function NewClientPage() {
  const router = useRouter();
  return (
    <main className="p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Nuovo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <FormClient onSubmitted={() => router.push('/clients')} submitLabel="Crea cliente" />
        </CardContent>
      </Card>
    </main>
  );
}

