'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function clientsCommesse(ddtList: any[]): Array<{ id: number; titolo?: string | null; codice?: string | null }> {
  const unique = new Map<number, { id: number; titolo?: string | null; codice?: string | null }>();
  for (const d of ddtList || []) {
    const links = d?.commesse || [];
    for (const l of links) {
      const c = l?.commessa || l?.commesa || null;
      if (c && typeof c.id === 'number' && !unique.has(c.id)) {
        unique.set(c.id, { id: c.id, titolo: c.titolo ?? null, codice: c.codice ?? null });
      }
    }
  }
  return Array.from(unique.values());
}

export default function CommessaInvoicesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [ddt, setDDT] = useState<any[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [numero, setNumero] = useState('');
  const [dataFattura, setDataFattura] = useState('');
  const [dataScadenza, setDataScadenza] = useState('');
  const [importoTotale, setImportoTotale] = useState('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [extraCommesse, setExtraCommesse] = useState<number[]>([]);
  const [payments, setPayments] = useState<{ dateDue: string; importo: string }[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/ddt?commessaId=${id}&unlinked=true`, { cache: 'no-store' });
      const json = await res.json();
      setDDT(json.items || json);
      const invRes = await fetch(`/api/invoices?commessaId=${id}&includeDeleted=${showDeleted}`, { cache: 'no-store' });
      const inv = await invRes.json();
      setInvoices(inv.items || inv);
    })();
  }, [id, showDeleted]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commessaId: Number(id),
        commessaIds: extraCommesse,
        supplierId: Number(supplierId || (ddt[0]?.supplierId ?? 1)),
        numero,
        dataFattura,
        importoTotale: Number(importoTotale),
        dataScadenza,
        ddtIds: selected,
        payments: payments.map((p) => ({ dateDue: p.dateDue, importo: Number(p.importo) })),
      }),
    });
    if (!res.ok) {
      toast.error('Errore creazione fattura');
      return;
    }
    toast.success('Fattura creata');
    router.push(`/commesse/${id}`);
  };

  const markPaid = async (invoiceId: number) => {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statoPagamento: 'pagata' }),
    });
    if (!res.ok) return toast.error('Errore aggiornamento');
    toast.success('Segnata come pagata');
    const r = await fetch(`/api/invoices?commessaId=${id}`, { cache: 'no-store' });
    const j = await r.json();
    setInvoices(j.items || j);
  };

  return (
    <main className="p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Nuova fattura</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Numero</Label>
                <Input required value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div>
                <Label>Fornitore (opzionale)</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                >
                  <option value="">Auto da DDT</option>
                  {[...new Map(ddt.map((x) => [x.supplierId, x.supplier?.ragioneSociale || x.supplierId]))].map(
                    ([id, name]) => (
                      <option key={id as number} value={id as number}>
                        {name as string}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Data fattura</Label>
                <Input type="date" required value={dataFattura} onChange={(e) => setDataFattura(e.target.value)} />
              </div>
              <div>
                <Label>Data scadenza</Label>
                <Input type="date" required value={dataScadenza} onChange={(e) => setDataScadenza(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Importo totale</Label>
              <Input type="number" step="0.01" required value={importoTotale} onChange={(e) => setImportoTotale(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium">Aggiungi commesse</div>
              <select
                multiple
                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={extraCommesse.map(String)}
                onChange={(e) => setExtraCommesse(Array.from(e.target.selectedOptions).map((o) => Number(o.value)))}
              >
                {clientsCommesse(ddt).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.titolo || c.codice || c.id}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Piani di pagamento (rate)</div>
              {payments.map((p, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input type="date" value={p.dateDue} onChange={(e) => { const cp = [...payments]; cp[idx] = { ...cp[idx], dateDue: e.target.value }; setPayments(cp); }} />
                  <Input type="number" step="0.01" value={p.importo} onChange={(e) => { const cp = [...payments]; cp[idx] = { ...cp[idx], importo: e.target.value }; setPayments(cp); }} />
                </div>
              ))}
              <button type="button" className="text-sm text-primary" onClick={() => setPayments((p) => [...p, { dateDue: '', importo: '' }])}>+ Aggiungi rata</button>
            </div>
            <div>
              <Label>DDT da collegare</Label>
              <select
                multiple
                className="min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={selected.map(String)}
                onChange={(e) => setSelected(Array.from(e.target.selectedOptions).map((o) => Number(o.value)))}
              >
                {ddt.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.numero} – {new Date(d.data).toLocaleDateString()} – {d.supplier?.ragioneSociale || '-'}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Crea fattura</Button>
          </form>
        </CardContent>
      </Card>
      <div className="mx-auto mt-6 max-w-3xl space-y-2">
        <div className="text-sm font-medium">Fatture esistenti</div>
        <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={showDeleted} onChange={(e)=> setShowDeleted(e.target.checked)} /> Mostra eliminati</label>
        <a className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted" href={`/api/invoices?commessaId=${id}&includeDeleted=${showDeleted}&format=csv`} target="_blank" rel="noreferrer">Esporta CSV</a>
        {invoices.map((f) => (
          <div key={f.id} className={`flex items-center justify-between rounded-md border p-3 ${f.statoPagamento === 'DELETED' ? 'bg-muted/30 text-muted-foreground' : ''}`}>
            <div>
              <div className="font-medium">{f.numero} — {new Date(f.dataFattura).toLocaleDateString()}</div>
              <div className="text-sm text-muted-foreground">{f.importoTotale?.toFixed(2)} EUR — Stato: {f.statoPagamento}</div>
            </div>
            <div className="flex items-center gap-2">
              {f.statoPagamento !== 'pagata' && (
                <Button variant="secondary" onClick={() => markPaid(f.id)}>Segna come pagata</Button>
              )}
              <DeleteInvoiceButton id={f.id} onDeleted={async ()=>{ const r = await fetch(`/api/invoices?commessaId=${id}`, { cache: 'no-store' }); setInvoices(await r.json()); }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function DeleteInvoiceButton({ id, onDeleted }: { id: number; onDeleted: () => void }) {
  const handleDelete = async () => {
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (res.ok) { onDeleted(); toast.success('Fattura eliminata'); } else { toast.error('Errore eliminazione'); }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">Elimina</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare la fattura?</AlertDialogTitle>
          <AlertDialogDescription>Verranno rimosse scadenze e collegamenti a DDT/commesse.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Annulla</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={handleDelete}>Conferma</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
