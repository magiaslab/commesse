'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function PreventivoVersionEditPage() {
  const params = useParams();
  const router = useRouter();
  const versionId = Number(params?.versionId);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [vatRate, setVatRate] = useState('0');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [validTo, setValidTo] = useState('');
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [headerCategory, setHeaderCategory] = useState<'MATERIALI'|'MANODOPERA'|'GESTIONE'>('MATERIALI');

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/preventivi/versions/${versionId}`, { cache: 'no-store' });
    if (!r.ok) { setLoading(false); return; }
    const full = await r.json();
    setVersion(full);
    setItems(full.items || []);
    setVatRate(String(full.vatRate ?? 0));
    setDiscountPercent(String(full.discountPercent ?? 0));
    setIssueDate(full.issueDate ? String(full.issueDate).slice(0,10) : '');
    setDueDate(full.dueDate ? String(full.dueDate).slice(0,10) : '');
    setValidTo(full.validTo ? String(full.validTo).slice(0,10) : '');
    setNote(full.note || '');
    setTitle(full.changeNote || '');
    setLoading(false);
  };

  useEffect(() => { if (versionId) load(); }, [versionId]);
  useEffect(() => { (async()=>{ try { const r=await fetch('/api/units',{cache:'no-store'}); if(r.ok) setUnits(await r.json()); } catch {} })(); }, []);

  const addItem = () => setItems((s) => [...s, { id: undefined, category: 'MATERIALI', description: '', quantity: 1, unitCost: 0, hours: 0, hourlyRate: 0, lineTotal: 0 }]);
  const saveItem = async (idx: number) => {
    if (!version) return;
    const it = items[idx];
    const path = `/api/preventivi/versions/${version.id}/items`;
    const method = it.id ? 'PUT' : 'POST';
    const payload = it.id ? { id: it.id, ...it } : it;
    const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) return toast.error('Errore salvataggio riga');
    await load();
  };
  const deleteItem = async (id: number) => {
    if (!version) return;
    const r = await fetch(`/api/preventivi/versions/${version.id}/items`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (!r.ok) return toast.error('Errore eliminazione riga');
    await load();
  };
  const saveVat = async () => {
    if (!version) return;
    const r = await fetch(`/api/preventivi/versions/${version.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vatRate: Number(vatRate) }) });
    if (!r.ok) return toast.error('Errore salvataggio IVA');
    await load();
  };

  const saveHeader = async () => {
    if (!version) return;
    const payload: any = {
      discountPercent: Number(discountPercent || 0),
      issueDate: issueDate ? new Date(issueDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      validTo: validTo ? new Date(validTo) : null,
      note,
      changeNote: title,
    };
    const r = await fetch(`/api/preventivi/versions/${version.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) return toast.error('Errore salvataggio dati');
    await load();
  };

  return (
    <main className="mx-auto w-full max-w-6xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Preventivo versione</div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{version ? `v${version.versionNumber} – ${version.status}` : 'Caricamento…'}</h1>
            <Input className="max-w-md" placeholder="Titolo preventivo" value={title} onChange={(e)=> setTitle(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>Torna</Button>
          <Button variant="default" onClick={saveHeader}>Salva</Button>
          {version?.status === 'DRAFT' && (
            <Button variant="default" onClick={async ()=>{
              const r = await fetch(`/api/preventivi/versions/${version.id}/submit`, { method: 'POST' });
              if (!r.ok) return toast.error('Errore invio in revisione');
              toast.success('Inviato in revisione');
              await load();
            }}>Invia in revisione</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
        <div>
          <div className="text-xs font-medium">IVA (%)</div>
          <Input value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
        </div>
        <div>
          <div className="text-xs font-medium">Sconto complessivo (%)</div>
          <Input value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
        </div>
        <div>
          <div className="text-xs font-medium">Data</div>
          <DatePicker value={issueDate} onChange={setIssueDate} />
        </div>
        <div>
          <div className="text-xs font-medium">Scadenza</div>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </div>
        <div>
          <div className="text-xs font-medium">Valido fino al</div>
          <DatePicker value={validTo} onChange={setValidTo} />
        </div>
        <div className="flex items-end gap-2">
          <Button variant="secondary" onClick={saveVat}>Aggiorna IVA</Button>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium">Note</div>
        <RichTextEditor value={note} onChange={setNote} placeholder="Note del preventivo (rich text)" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Righe</div>
          <Button size="sm" onClick={addItem}>+ Aggiungi riga</Button>
        </div>
        {/* Header colonne dinamico (visibile da sm in su) */}
        <div className="hidden sm:grid sm:grid-cols-10 text-xs text-muted-foreground font-medium px-2">
          <div>Categoria</div>
          <div>Descrizione</div>
          {headerCategory !== 'MANODOPERA' ? (
            <>
              <div className="text-right">Unità</div>
              <div className="text-right">Q.tà</div>
              <div className="text-right">Costo unitario</div>
              <div></div>
              <div></div>
            </>
          ) : (
            <>
              <div></div>
              <div></div>
              <div></div>
              <div className="text-right">Ore</div>
              <div className="text-right">Tariffa oraria</div>
            </>
          )}
          <div className="text-right">Sconto %</div>
          <div className="text-right">Totale</div>
          <div></div>
        </div>
        {items.map((it, idx) => (
          <div key={it.id ?? `new-${idx}`} className="grid grid-cols-1 gap-2 sm:grid-cols-10 border rounded-md p-2 items-center">
            <Select value={it.category} onValueChange={(v) => setItems((s) => { const c=[...s]; c[idx] = { ...c[idx], category: v }; setHeaderCategory(v as any); return c; })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MATERIALI">Materiali</SelectItem>
                <SelectItem value="MANODOPERA">Manodopera</SelectItem>
                <SelectItem value="GESTIONE">Gestione</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Descrizione" className="min-h-10" value={it.description || ''} onChange={(e) => setItems((s)=>{ const c=[...s]; c[idx]={...c[idx], description:e.target.value}; return c; })} />
            {it.category !== 'MANODOPERA' ? (
              <>
                {units.length>0 ? (
                  <>
                    <Input list="units-datalist" placeholder="Unità" value={it.unit || ''} onChange={(e)=> setItems((s)=>{ const c=[...s]; c[idx]={...c[idx], unit:e.target.value}; return c; })} />
                  </>
                ) : (
                  <Input placeholder="Unità" value={it.unit || ''} onChange={(e)=> setItems((s)=>{ const c=[...s]; c[idx]={...c[idx], unit:e.target.value}; return c; })} />
                )}
                <Input type="number" step="0.01" placeholder="Quantità" value={it.quantity ?? ''} onChange={(e) => setItems((s)=>{ const c=[...s]; c[idx]={...c[idx], quantity: Number(e.target.value) }; return c; })} />
                <Input type="number" step="0.01" placeholder="Costo unitario" value={it.unitCost ?? ''} onChange={(e) => setItems((s)=>{ const c=[...s]; c[idx]={...c[idx], unitCost: Number(e.target.value) }; return c; })} />
                <div />
                <div />
              </>
            ) : (
              <>
                <div />
                <div />
                <div />
                <Input type="number" step="0.01" placeholder="Ore" value={it.hours ?? ''} onChange={(e) => setItems((s)=>{ const c=[...s]; c[idx]={...c[idx], hours: Number(e.target.value) }; return c; })} />
                <Input type="number" step="0.01" placeholder="Tariffa oraria" value={it.hourlyRate ?? ''} onChange={(e) => setItems((s)=>{ const c=[...s]; c[idx]={...c[idx], hourlyRate: Number(e.target.value) }; return c; })} />
              </>
            )}
            <Input className="min-w-0" type="number" step="0.01" placeholder="Sconto %" value={it.discountPercent ?? 0} onChange={(e)=> setItems((s)=>{ const c=[...s]; c[idx]={...c[idx], discountPercent: Number(e.target.value) }; return c; })} />
            <div className="text-right text-sm text-muted-foreground">{Number((()=>{ const q=Number(it.quantity||0), uc=Number(it.unitCost||0), h=Number(it.hours||0), hr=Number(it.hourlyRate||0), d=Math.max(0,Math.min(100,Number(it.discountPercent||0))); const base = it.category==='MANODOPERA' ? ((h>0&&hr>0)?h*hr:q*uc) : q*uc; return Math.round((base*(1-d/100)+Number.EPSILON)*100)/100; })()).toFixed(2)}</div>
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => saveItem(idx)}>Salva</Button>
              {it.id && (<Button size="sm" variant="destructive" onClick={() => deleteItem(it.id)}>Elimina</Button>)}
            </div>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-end gap-6 text-sm">
          {/* Totali live semplici: ricalcolo sul client (coerente con server al salvataggio) */}
          {(() => { 
            let materials=0,labor=0,over=0; 
            for (const it of items){
              const q=Number(it.quantity||0), uc=Number(it.unitCost||0), h=Number(it.hours||0), hr=Number(it.hourlyRate||0), d=Math.max(0,Math.min(100,Number(it.discountPercent||0)));
              const base = it.category==='MANODOPERA' ? ((h>0&&hr>0)?h*hr:q*uc) : q*uc;
              const line = Math.round((base*(1-d/100)+Number.EPSILON)*100)/100;
              if (it.category==='MATERIALI') materials+=line; else if (it.category==='MANODOPERA') labor+=line; else over+=line;
            }
            const gDisc=Math.max(0,Math.min(100,Number(discountPercent||0)));
            const beforeTax=Math.round(((materials+labor+over)*(1-gDisc/100)+Number.EPSILON)*100)/100;
            const vat=Math.round(((beforeTax*Number(vatRate||0))+Number.EPSILON)*100)/100;
            const withTax=Math.round(((beforeTax+vat)+Number.EPSILON)*100)/100;
            return (
              <>
                <div>Totale imponibile: <strong>{beforeTax.toFixed(2)} EUR</strong></div>
                <div>IVA: <strong>{vat.toFixed(2)} EUR</strong></div>
                <div>Totale: <strong>{withTax.toFixed(2)} EUR</strong></div>
              </>
            );
          })()}
        </div>
        {units.length>0 && (
          <datalist id="units-datalist">
            {units.map((u:any)=> (<option key={u.id} value={u.code}>{u.label}</option>))}
          </datalist>
        )}
      </div>
    </main>
  );
}


