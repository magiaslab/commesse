import { KPICard } from '@/components/kpi/KPICard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScadenzeTable } from '@/components/scadenze/ScadenzeTable';
import { notFound } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { headers } from 'next/headers';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';
import { CommessaKanban } from '@/components/commesse/CommessaKanban';
import { UploadCommessaDocument } from '@/components/commesse/UploadCommessaDocument';
import { CommessaNotes } from '@/components/commesse/CommessaNotes';
import { PreventiviSection } from '@/components/commesse/PreventiviSection';
import { CommessaDDTTable } from '@/components/commesse/CommessaDDTTable';
import { CommessaInvoicesTable } from '@/components/commesse/CommessaInvoicesTable';

async function getCommessa(id: string) {
  const h = headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookie = h.get('cookie') || '';
  const [commessaRes, invoicesRes, ddtRes, docsRes] = await Promise.all([
    fetch(`${base}/api/commesse/${id}`, { cache: 'no-store', headers: { cookie } }),
    fetch(`${base}/api/invoices?commessaId=${id}`, { cache: 'no-store', headers: { cookie } }),
    fetch(`${base}/api/ddt?commessaId=${id}`, { cache: 'no-store', headers: { cookie } }),
    fetch(`${base}/api/documents?commessaId=${id}`, { cache: 'no-store', headers: { cookie } }),
  ]);
  const commessa = commessaRes.ok ? await commessaRes.json() : null;
  const invoicesRaw = invoicesRes.ok ? await invoicesRes.json() : [];
  const ddtRaw = ddtRes.ok ? await ddtRes.json() : [];
  const documents = docsRes.ok ? await docsRes.json() : { items: [] };
  const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : (invoicesRaw.items || []);
  const ddt = Array.isArray(ddtRaw) ? ddtRaw : (ddtRaw.items || []);
  return { commessa, invoices, ddt, documents };
}

export default async function CommessaPage({ params }: { params: { id: string } }) {
  const { commessa, invoices, ddt, documents } = await getCommessa(params.id);
  if (!commessa) return notFound();

  const budget = commessa.budget ?? 0;
  const totaleFatture = invoices.reduce((sum: number, i: any) => sum + (i.importoTotale || 0), 0);
  const oggi = new Date();
  const totaleScaduto = invoices
    .filter((i: any) => i.statoPagamento !== 'pagata' && new Date(i.dataScadenza) < oggi)
    .reduce((sum: number, i: any) => sum + (i.importoTotale || 0), 0);

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{commessa.codice} – {commessa.titolo}</h1>
        <div className="text-sm text-gray-600">
          Cliente: <span className="font-medium">{commessa.cliente?.ragioneSociale || '-'}</span>
        </div>
        <div className="h-2 w-full rounded bg-gray-100">
          <div
            className="h-2 rounded bg-primary"
            style={{ width: `${Math.min(100, budget ? (totaleFatture / budget) * 100 : 0)}%` }}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Budget" value={budget.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} />
        <KPICard
          title="Totale fatture"
          value={totaleFatture.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
        />
        <KPICard
          title="Totale scaduto"
          value={totaleScaduto.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
        />
      </section>

      <Tabs defaultValue="documenti">
        <TabsList>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
          <TabsTrigger value="scadenze">Scadenze</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="note">Note</TabsTrigger>
          <TabsTrigger value="preventivi">Preventivi</TabsTrigger>
        </TabsList>
        <TabsContent value="documenti">
          <div className="space-y-8">
            <section className="w-full">
              <h2 className="mb-2 text-lg font-semibold">Carica documento</h2>
              <UploadCommessaDocument commessaId={Number(params.id)} />
            </section>

            {/* Documenti generici raggruppati per tipologia */}
            <section className="w-full">
              <h2 className="mb-2 text-lg font-semibold">Documenti</h2>
              {(() => {
                const list: any[] = Array.isArray(documents) ? (documents as any[]) : (documents.items || []);
                const byType: Record<string, any[]> = {};
                for (const doc of list) {
                  const key = doc.tipo || 'Altro';
                  if (!byType[key]) byType[key] = [];
                  byType[key].push(doc);
                }
                const types = Object.keys(byType);
                if (types.length === 0) return <div className="rounded-md border p-3 text-sm text-muted-foreground">Nessun documento</div>;
                return (
                  <div className="space-y-6">
                    {types.sort().map((t) => (
                      <div key={t} className="rounded-md border">
                        <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">{t}</div>
                        <ul className="divide-y">
                          {byType[t].map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between px-3 py-2 text-sm">
                              <span>{doc.filenameOriginal}</span>
                              <div className="flex items-center gap-2">
                                <a className="text-red-600 hover:underline" href={`/api/files/${encodeURIComponent(doc.s3Key)}`} target="_blank" rel="noreferrer">Apri</a>
                                <DeleteDocButton id={doc.id} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>

            <section className="w-full">
              <h2 className="mb-2 text-lg font-semibold">Fatture</h2>
              <CommessaInvoicesTable commessaId={Number(params.id)} />
            </section>

            <section className="w-full">
              <h2 className="mb-2 text-lg font-semibold">DDT</h2>
              <CommessaDDTTable commessaId={Number(params.id)} />
            </section>
          </div>
        </TabsContent>
        <TabsContent value="scadenze">
          <ScadenzeTable commessaId={Number(params.id)} />
        </TabsContent>
        <TabsContent value="kanban">
          <CommessaKanban commessaId={Number(params.id)} />
        </TabsContent>
        <TabsContent value="note">
          <CommessaNotes commessaId={Number(params.id)} />
        </TabsContent>
        <TabsContent value="preventivi">
          <PreventiviSection commessaId={Number(params.id)} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function DeleteDocButton({ id }: { id: number }) {
  async function action() {
    'use server';
    const h = headers();
    const host = h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || 'http';
    const base = `${proto}://${host}`;
    const cookie = h.get('cookie') || '';
    await fetch(`${base}/api/documents/${id}`, { method: 'DELETE', headers: { cookie }, cache: 'no-store' });
  }
  return (
    <form action={async () => { await action(); toast.success('Documento eliminato', { action: { label: 'Annulla', onClick: async () => {
      const h = headers();
      const host = h.get('host') || 'localhost:3000';
      const proto = h.get('x-forwarded-proto') || 'http';
      const base = `${proto}://${host}`;
      const cookie = h.get('cookie') || '';
      await fetch(`${base}/api/documents/${id}/restore`, { method: 'POST', headers: { cookie }, cache: 'no-store' });
    } } }); }}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Elimina</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il documento?</AlertDialogTitle>
            <AlertDialogDescription>Soft delete: il file resta su S3, ma il record è nascosto.</AlertDialogDescription>
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

function DeleteInvoiceButton({ id }: { id: number }) {
  async function action() {
    'use server';
    const h = headers();
    const host = h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || 'http';
    const base = `${proto}://${host}`;
    const cookie = h.get('cookie') || '';
    await fetch(`${base}/api/invoices/${id}`, { method: 'DELETE', headers: { cookie }, cache: 'no-store' });
  }
  return (
    <form action={async () => { await action(); toast.success('Fattura eliminata', { action: { label: 'Annulla', onClick: async () => {
      const h = headers();
      const host = h.get('host') || 'localhost:3000';
      const proto = h.get('x-forwarded-proto') || 'http';
      const base = `${proto}://${host}`;
      const cookie = h.get('cookie') || '';
      await fetch(`${base}/api/invoices/${id}`, { method: 'POST', headers: { cookie }, cache: 'no-store' });
    } } }); }}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Elimina</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la fattura?</AlertDialogTitle>
            <AlertDialogDescription>Verranno rimosse anche scadenze e link a DDT/commesse.</AlertDialogDescription>
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

function DeleteDDTButton({ id }: { id: number }) {
  async function action() {
    'use server';
    const h = headers();
    const host = h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || 'http';
    const base = `${proto}://${host}`;
    const cookie = h.get('cookie') || '';
    await fetch(`${base}/api/ddt/${id}`, { method: 'DELETE', headers: { cookie }, cache: 'no-store' });
  }
  return (
    <form action={async () => { await action(); toast.success('DDT eliminato', { action: { label: 'Annulla', onClick: async () => {
      const h = headers();
      const host = h.get('host') || 'localhost:3000';
      const proto = h.get('x-forwarded-proto') || 'http';
      const base = `${proto}://${host}`;
      const cookie = h.get('cookie') || '';
      await fetch(`${base}/api/ddt/${id}`, { method: 'POST', headers: { cookie }, cache: 'no-store' });
    } } }); }}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Elimina</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il DDT?</AlertDialogTitle>
            <AlertDialogDescription>Verranno rimossi anche i collegamenti a commesse e fatture.</AlertDialogDescription>
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
