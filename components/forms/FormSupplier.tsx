'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export type SupplierPayload = {
  ragioneSociale: string;
  nomeCommerciale?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  cap?: string;
  comune?: string;
  provincia?: string;
  pec?: string;
  codiceDestinatario?: string;
  referente?: string;
  telefono?: string;
  email?: string;
  iban?: string;
  bic?: string;
  codiceAteco?: string;
  modalitaPagamento?: string;
  giorniPagamento?: number | '';
  note?: string;
};

export function FormSupplier({ initial, supplierId, onSubmitted }: { initial?: Partial<SupplierPayload>; supplierId?: number; onSubmitted?: () => void }) {
  const [data, setData] = useState<SupplierPayload>({
    ragioneSociale: initial?.ragioneSociale ?? '',
    nomeCommerciale: initial?.nomeCommerciale ?? '',
    partitaIva: initial?.partitaIva ?? '',
    codiceFiscale: initial?.codiceFiscale ?? '',
    indirizzo: initial?.indirizzo ?? '',
    cap: initial?.cap ?? '',
    comune: initial?.comune ?? '',
    provincia: initial?.provincia ?? '',
    pec: initial?.pec ?? '',
    codiceDestinatario: initial?.codiceDestinatario ?? '',
    referente: initial?.referente ?? '',
    telefono: initial?.telefono ?? '',
    email: initial?.email ?? '',
    iban: initial?.iban ?? '',
    bic: initial?.bic ?? '',
    codiceAteco: initial?.codiceAteco ?? '',
    modalitaPagamento: initial?.modalitaPagamento ?? '',
    giorniPagamento: initial?.giorniPagamento ?? '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const handle = (k: keyof SupplierPayload) => (e: any) => setData((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...data, giorniPagamento: data.giorniPagamento === '' ? null : Number(data.giorniPagamento) } as any;
    const res = await fetch(supplierId ? `/api/suppliers/${supplierId}` : '/api/suppliers', {
      method: supplierId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) onSubmitted?.();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Ragione sociale</Label>
        <Input required value={data.ragioneSociale} onChange={handle('ragioneSociale')} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Nome commerciale</Label>
          <Input value={data.nomeCommerciale} onChange={handle('nomeCommerciale')} />
        </div>
        <div>
          <Label>Partita IVA</Label>
          <Input value={data.partitaIva} onChange={handle('partitaIva')} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Codice Fiscale</Label>
          <Input value={data.codiceFiscale} onChange={handle('codiceFiscale')} />
        </div>
        <div>
          <Label>PEC</Label>
          <Input value={data.pec} onChange={handle('pec')} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label>CAP</Label>
          <Input value={data.cap} onChange={handle('cap')} />
        </div>
        <div>
          <Label>Comune</Label>
          <Input value={data.comune} onChange={handle('comune')} />
        </div>
        <div>
          <Label>Provincia</Label>
          <Input value={data.provincia} onChange={handle('provincia')} />
        </div>
      </div>
      <div>
        <Label>Indirizzo</Label>
        <Textarea value={data.indirizzo} onChange={handle('indirizzo')} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>IBAN</Label>
          <Input value={data.iban} onChange={handle('iban')} />
        </div>
        <div>
          <Label>BIC</Label>
          <Input value={data.bic} onChange={handle('bic')} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Codice ATECO</Label>
          <Input value={data.codiceAteco} onChange={handle('codiceAteco')} />
        </div>
        <div>
          <Label>Modalità pagamento</Label>
          <Input value={data.modalitaPagamento} onChange={handle('modalitaPagamento')} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Giorni pagamento</Label>
          <Input type="number" value={data.giorniPagamento} onChange={handle('giorniPagamento')} />
        </div>
        <div>
          <Label>Telefono</Label>
          <Input value={data.telefono} onChange={handle('telefono')} />
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={data.email} onChange={handle('email')} />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Salvataggio…' : (supplierId ? 'Aggiorna fornitore' : 'Crea fornitore')}</Button>
    </form>
  );
}
