'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormSupplier } from '@/components/forms/FormSupplier';

export default function NewSupplierPage() {
  const router = useRouter();
  return (
    <main className="p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Nuovo fornitore</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSupplier onSubmitted={() => router.push('/suppliers')} />
        </CardContent>
      </Card>
    </main>
  );
}

