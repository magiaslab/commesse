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
import { CommessaCustomerInvoicesTable } from '@/components/commesse/CommessaCustomerInvoicesTable';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

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
  const totaleFornitori = invoices.reduce((sum: number, i: any) => sum + (i.importoTotale || 0), 0);
  const oggi = new Date();
  const totaleScaduto = invoices
    .filter((i: any) => i.statoPagamento !== 'pagata' && new Date(i.dataScadenza) < oggi)
    .reduce((sum: number, i: any) => sum + (i.importoTotale || 0), 0);

  // KPI cliente (placeholder tramite API customer-invoices)
  const customerRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/customer-invoices?commessaId=${params.id}`, { cache: 'no-store' });
  const customerJson = customerRes.ok ? await customerRes.json() : { items: [] };
  const customerInvoices = Array.isArray(customerJson) ? customerJson : (customerJson.items || []);
  const totaleCliente = customerInvoices.reduce((s: number, r: any) => s + (r.importoTotale || 0), 0);
  const incassato = customerInvoices.filter((r: any) => r.dataIncasso).reduce((s: number, r: any) => s + (r.importoTotale || 0), 0);
  const daIncassare = totaleCliente - incassato;

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
            style={{ width: `${Math.min(100, budget ? (totaleFornitori / budget) * 100 : 0)}%` }}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Budget" value={budget.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} />
        <KPICard title="Totale fatture fornitore" value={totaleFornitori.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} />
        <KPICard
          title="Totale scaduto (fornitori)"
          value={totaleScaduto.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
        />
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Totale fatture cliente" value={totaleCliente.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} />
        <KPICard title="Incassato" value={incassato.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} color="green" />
        <KPICard title="Da incassare" value={daIncassare.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} color="amber" />
      </section>

      <Tabs defaultValue="documenti">
        <TabsList>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
          <TabsTrigger value="edit">Modifica</TabsTrigger>
          <TabsTrigger value="scadenze">Scadenze</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="note">Note</TabsTrigger>
          <TabsTrigger value="preventivi">Preventivi</TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          <form
            action={async (formData) => {
              'use server';
              const h = headers();
              const host = h.get('host') || 'localhost:3000';
              const proto = h.get('x-forwarded-proto') || 'http';
              const base = `${proto}://${host}`;
              const cookie = h.get('cookie') || '';
              const payload = {
                titolo: String(formData.get('titolo') || commessa.titolo),
                clientId: Number(formData.get('clientId') || commessa.clientId),
                budget: formData.get('budget') ? Number(formData.get('budget')) : null,
                descrizione: String(formData.get('descrizione') || ''),
                dataInizio: String(formData.get('dataInizio') || '') || null,
                dataFinePrev: String(formData.get('dataFinePrev') || '') || null,
              };
              await fetch(`${base}/api/commesse/${params.id}`, { method: 'PUT', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' });
              redirect(`/commesse/${params.id}`);
            }}
            className="grid gap-3 md:grid-cols-2"
          >
            <div>
              <label className="text-sm">Titolo</label>
              <Input name="titolo" defaultValue={commessa.titolo} />
            </div>
            <div>
              <label className="text-sm">Budget (€)</label>
              <Input name="budget" type="number" step="0.01" defaultValue={commessa.budget ?? ''} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Descrizione</label>
              <Textarea name="descrizione" defaultValue={commessa.descrizione || ''} />
            </div>
            <div>
              <label className="text-sm">Data inizio</label>
              <Input name="dataInizio" type="date" defaultValue={commessa.dataInizio ? String(commessa.dataInizio).slice(0,10) : ''} />
            </div>
            <div>
              <label className="text-sm">Scadenza consegna</label>
              <Input name="dataFinePrev" type="date" defaultValue={commessa.dataFinePrev ? String(commessa.dataFinePrev).slice(0,10) : ''} />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button type="submit">Salva</Button>
            </div>
          </form>
        </TabsContent>
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
              <h2 className="mb-2 text-lg font-semibold">Fatture emesse (clienti)</h2>
              <CommessaCustomerInvoicesTable commessaId={Number(params.id)} />
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
