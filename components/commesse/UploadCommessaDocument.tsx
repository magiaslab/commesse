"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';

export function UploadCommessaDocument({ commessaId }: { commessaId: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState('CONTRATTO');
  const [createScad, setCreateScad] = useState(false);
  const [kind, setKind] = useState<'ECONOMICA'|'CONSEGNA'>('ECONOMICA');
  const [dateDue, setDateDue] = useState('');
  const [importo, setImporto] = useState('');
  const [supplierId, setSupplierId] = useState('');

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
    } else if (tipo === 'DDT') {
      setCreateScad(true);
      setKind('CONSEGNA');
      setDateDue(toYmd(new Date()));
      setImporto('');
      setSupplierId('');
    } else {
      // Altri tipi: disattivo preset, l'utente può abilitarlo manualmente
      setCreateScad(false);
      setImporto('');
      setSupplierId('');
      setDateDue('');
    }
  }, [tipo]);

  const upload = async () => {
    if (!file) return;
    try {
      const key = `documents/${Date.now()}-${encodeURIComponent(file.name)}`;
      const presRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: file.type || 'application/octet-stream' }),
      });
      const pres = await presRes.json();
      if (!presRes.ok) throw new Error(pres.error || 'Presign error');

      const putRes = await fetch(pres.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      if (!putRes.ok) throw new Error('Upload fallito');
      const save = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (!save.ok) throw new Error('Salvataggio documento fallito');
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
                  <label className="text-sm">ID Fornitore</label>
                  <Input className="w-full" placeholder="Supplier ID" value={supplierId} onChange={(e)=> setSupplierId(e.target.value)} />
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


