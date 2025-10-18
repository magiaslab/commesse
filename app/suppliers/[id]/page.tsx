import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const h = headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookie = h.get('cookie') || '';
  const [supplier, ddt, invoices, docs, scadenze] = await Promise.all([
    fetchJSON(`${base}/api/suppliers/${params.id}`),
    fetchJSON(`${base}/api/ddt?supplierId=${params.id}`),
    fetchJSON(`${base}/api/invoices?supplierId=${params.id}`),
    fetchJSON(`${base}/api/documents?supplierId=${params.id}`),
    fetchJSON(`${base}/api/scadenze?supplierId=${params.id}`),
  ]);
  if (!supplier) {
    return (
      <main className="p-6">
        <p className="text-sm text-gray-500">Fornitore non trovato.</p>
      </main>
    );
  }
  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{supplier.ragioneSociale}</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link className="rounded-md border px-3 py-1.5 hover:shadow" href={`/suppliers/${params.id}/edit`}>Modifica</Link>
          <DeleteButton id={params.id} />
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Email</div>
            <div className="text-sm font-medium">{supplier.email || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">PEC</div>
            <div className="text-sm font-medium">{supplier.pec || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Partita IVA</div>
            <div className="text-sm font-medium">{supplier.partitaIva || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">IBAN</div>
            <div className="text-sm font-medium">{supplier.iban || '-'}</div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="documenti">
        <TabsList>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
          <TabsTrigger value="ddt">DDT</TabsTrigger>
          <TabsTrigger value="fatture">Fatture</TabsTrigger>
          <TabsTrigger value="scadenze">Scadenze</TabsTrigger>
        </TabsList>
        <TabsContent value="documenti">
          <ul className="divide-y rounded-md border">
            {(docs?.items || docs || []).map((d: any) => (
              <li key={d.id} className="flex items-center justify-between p-3 text-sm">
                <span>{d.tipo} – {d.filenameOriginal}</span>
                {d.s3Key ? <a className="text-primary hover:underline" href={`/api/files/${encodeURIComponent(d.s3Key)}`} target="_blank" rel="noreferrer">Apri</a> : null}
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="ddt">
          <ul className="divide-y rounded-md border">
            {(ddt || []).map((x: any) => (
              <li key={x.id} className="flex items-center justify-between p-3 text-sm">
                <span>{x.numero} – {new Date(x.data).toLocaleDateString()}</span>
                    {x.documento?.s3Key ? <a className="text-primary hover:underline" href={`/api/files/${encodeURIComponent(x.documento.s3Key)}`} target="_blank" rel="noreferrer">Apri PDF</a> : null}
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="fatture">
          <ul className="divide-y rounded-md border">
            {(invoices || []).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between p-3 text-sm">
                <span>{f.numero} – {new Date(f.dataFattura).toLocaleDateString()} – {f.importoTotale?.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="scadenze">
          <ul className="divide-y rounded-md border">
            {(scadenze || []).map((s: any) => (
              <li key={s.id} className="flex items-center justify-between p-3 text-sm">
                <span>{s.title}</span>
                <span>{new Date(s.dateDue).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function DeleteButton({ id }: { id: string }) {
  async function action() {
    'use server';
    const h = headers();
    const host = h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || 'http';
    const base = `${proto}://${host}`;
    const cookie = h.get('cookie') || '';
    await fetch(`${base}/api/suppliers/${id}`, { method: 'DELETE', headers: { cookie }, cache: 'no-store' });
    redirect('/suppliers');
  }
  return (
    <form action={action}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Elimina</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il fornitore?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione è definitiva e rimuove i dati del fornitore.</AlertDialogDescription>
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

