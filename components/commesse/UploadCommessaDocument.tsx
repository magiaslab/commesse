"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { SupplierSearch } from '@/components/forms/SupplierSearch';

export function UploadCommessaDocument({ commessaId }: { commessaId: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState('CONTRATTO');
  const [createScad, setCreateScad] = useState(false);
  const [kind, setKind] = useState<'ECONOMICA'|'CONSEGNA'>('ECONOMICA');
  const [dateDue, setDateDue] = useState('');
  const [importo, setImporto] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const supplierIdNum = supplierId ? Number(supplierId) : undefined;
  const [numeroFattura, setNumeroFattura] = useState('');
  const [dataFattura, setDataFattura] = useState('');

  function toYmd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Preset automatico scadenza in base al tipo documento
  useEffect(() => {
    if (tipo === 'FATTURA') {
      setCreateScad(true);
      setKind('ECONOMICA');
      const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setDateDue(toYmd(d));
      setDataFattura(toYmd(new Date()));
    } else if (tipo === 'DDT') {
      setCreateScad(true);
      setKind('CONSEGNA');
      setDateDue(toYmd(new Date()));
      setImporto('');
      setSupplierId('');
      setNumeroFattura('');
      setDataFattura('');
    } else {
      // Altri tipi: disattivo preset, l'utente può abilitarlo manualmente
      setCreateScad(false);
      setImporto('');
      setSupplierId('');
      setDateDue('');
      setNumeroFattura('');
      setDataFattura('');
    }
  }, [tipo]);

  const upload = async () => {
    if (!file) return;
    try {
      const key = `documents/${Date.now()}-${encodeURIComponent(file.name)}`;
      const presRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, contentType: file.type || 'application/octet-stream' }),
      });
      const pres = await presRes.json();
      if (!presRes.ok) throw new Error(pres.error || 'Presign error');

      const putRes = await fetch(pres.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      if (!putRes.ok) throw new Error('Upload fallito');
      const save = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          commessaId,
          tipo,
          filenameOriginal: file.name,
          s3Key: key,
          mimetype: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          ...(createScad ? { createScadenza: { kind, dateDue, importo: importo ? Number(importo) : undefined, supplierId: supplierId ? Number(supplierId) : undefined } } : {}),
        }),
      });
      if (!save.ok) {
        const errText = await save.text();
        throw new Error(errText || 'Salvataggio documento fallito');
      }
      const createdDoc = await save.json();

      if (tipo === 'FATTURA') {
        try {
          if (!supplierId || !importo) {
            toast.message('Fattura non creata automaticamente: specifica fornitore e importo');
          } else {
            const invRes = await fetch('/api/invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                commessaId,
                supplierId: supplierIdNum ?? Number(supplierId),
                numero: numeroFattura || file.name,
                dataFattura: dataFattura || toYmd(new Date()),
                importoTotale: Number(importo),
                dataScadenza: dateDue || undefined,
                documentoId: createdDoc?.id,
              }),
            });
            if (!invRes.ok) {
              const msg = await invRes.text();
              toast.error(`Creazione fattura fallita: ${msg || 'errore'}`);
            } else {
              toast.success('Fattura creata');
            }
          }
        } catch (err: any) {
          toast.error(err?.message || 'Errore creazione fattura');
        }
      }

      // Se il documento è un DDT, creo automaticamente il DDT collegato
      if (tipo === 'DDT') {
        try {
          if (!supplierId) {
            toast.message('DDT non creato automaticamente: specifica fornitore');
          } else {
            const ddtRes = await fetch('/api/ddt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                commessaId,
                supplierId: supplierIdNum ?? Number(supplierId),
                numero: file.name,
                data: toYmd(new Date()),
                importo: importo ? Number(importo) : undefined,
                documentoId: createdDoc?.id,
              }),
            });
            if (!ddtRes.ok) {
              const msg = await ddtRes.text();
              toast.error(`Creazione DDT fallita: ${msg || 'errore'}`);
            } else {
              toast.success('DDT creato');
            }
          }
        } catch (err: any) {
          toast.error(err?.message || 'Errore creazione DDT');
        }
      }
      toast.success('Documento caricato');
      setFile(null);
      // Aggiorna i dati della pagina (server component) per mostrare subito l'allegato
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Errore upload');
    }
  };

  return (
    <div className="rounded-md border">
      <div className="border-b bg-muted/60 p-3 text-sm font-medium">Carica documento</div>
      <div className="grid gap-3 p-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm">Tipologia</label>
          <select className="h-9 w-full rounded-md border px-3 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="CONTRATTO">Contratto</option>
            <option value="DDT">DDT</option>
            <option value="FATTURA">Fattura</option>
            <option value="ALTRO">Altro</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm">File</label>
          <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        {tipo === 'FATTURA' && (
          <>
            <div className="space-y-2">
              <label className="text-sm">Numero fattura</label>
              <Input value={numeroFattura} onChange={(e)=> setNumeroFattura(e.target.value)} placeholder="Es. 123/2025" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Data fattura</label>
              <DatePicker value={dataFattura} onChange={setDataFattura} />
            </div>
          </>
        )}
      </div>
      <div className="border-t p-3">
        <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={createScad} onChange={(e)=> setCreateScad(e.target.checked)} /> Crea scadenza</label>
        {createScad && (
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm">Tipo</label>
              <select className="h-9 w-full rounded-md border px-3 text-sm" value={kind} onChange={(e)=> setKind(e.target.value as any)}>
                <option value="ECONOMICA">Economica</option>
                <option value="CONSEGNA">Consegna</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Scadenza</label>
              <DatePicker value={dateDue} onChange={setDateDue} />
            </div>
            {kind==='ECONOMICA' && (
              <>
                <div>
                  <label className="text-sm">Importo</label>
                  <Input className="w-full" type="number" step="0.01" placeholder="Importo" value={importo} onChange={(e)=> setImporto(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm">Fornitore</label>
                  <SupplierSearch value={supplierId ? Number(supplierId) : undefined as any} onChange={(id)=> setSupplierId(String(id))} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t bg-muted/30 p-3">
        <Button variant="outline" type="button" onClick={()=> { setFile(null); }}>Annulla</Button>
        <Button type="button" onClick={upload} disabled={!file}>Carica</Button>
      </div>
    </div>
  );
}


