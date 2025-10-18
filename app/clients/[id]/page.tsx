import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

async function getClient(id: string) {
  const h = headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookie = h.get('cookie') || '';
  const res = await fetch(`${base}/api/clients/${id}`, {
    cache: 'no-store',
    headers: { cookie },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id);
  if (!client) {
    return (
      <main className="p-6">
        <p className="text-sm text-gray-500">Cliente non trovato.</p>
      </main>
    );
  }
  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cliente #{client.id}</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link className="rounded-md border px-3 py-1.5 hover:shadow" href={`/clients/${client.id}/edit`}>Modifica</Link>
          <DeleteClientButton id={client.id} />
        </div>
      </div>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Dati cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-gray-500">Ragione Sociale</div>
              <div className="text-sm font-medium">{client.ragioneSociale}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-medium">{client.email || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Partita IVA</div>
              <div className="text-sm font-medium">{client.partitaIva || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">PEC</div>
              <div className="text-sm font-medium">{client.pec || '-'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function DeleteClientButton({ id }: { id: number }) {
  async function action() {
    'use server';
    const h = headers();
    const host = h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || 'http';
    const base = `${proto}://${host}`;
    const cookie = h.get('cookie') || '';
    await fetch(`${base}/api/clients/${id}`, { method: 'DELETE', headers: { cookie }, cache: 'no-store' });
    redirect('/clients');
  }
  return (
    <form action={action}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Elimina</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il cliente?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione è definitiva e rimuove i dati del cliente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Annulla</AlertDialogCancel>
            <AlertDialogAction type="submit">Conferma</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

