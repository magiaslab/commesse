'use client';

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

export type ClientPayload = {
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
};

export function FormClient({
  initial,
  onSubmitted,
  submitLabel = 'Salva',
  clientId,
}: {
  initial?: Partial<ClientPayload>;
  onSubmitted?: () => void;
  submitLabel?: string;
  clientId?: number;
}) {
  const [data, setData] = useState<ClientPayload>({
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof ClientPayload) => (e: any) => {
    setData((s) => ({ ...s, [key]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(clientId ? `/api/clients/${clientId}` : '/api/clients', {
        method: clientId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      onSubmitted?.();
    } catch (err: any) {
      setError(err?.message || 'Errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Ragione sociale</Label>
        <Input value={data.ragioneSociale} onChange={handleChange('ragioneSociale')} required />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Nome commerciale</Label>
          <Input value={data.nomeCommerciale} onChange={handleChange('nomeCommerciale')} />
        </div>
        <div>
          <Label>Partita IVA</Label>
          <Input value={data.partitaIva} onChange={handleChange('partitaIva')} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Codice Fiscale</Label>
          <Input value={data.codiceFiscale} onChange={handleChange('codiceFiscale')} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={data.email} onChange={handleChange('email')} />
        </div>
      </div>
      <div>
        <Label>Indirizzo</Label>
        <Textarea value={data.indirizzo} onChange={handleChange('indirizzo')} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <Label>CAP</Label>
          <Input value={data.cap} onChange={handleChange('cap')} />
        </div>
        <div>
          <Label>Comune</Label>
          <Input value={data.comune} onChange={handleChange('comune')} />
        </div>
        <div>
          <Label>Provincia</Label>
          <Input value={data.provincia} onChange={handleChange('provincia')} />
        </div>
        <div>
          <Label>Telefono</Label>
          <Input value={data.telefono} onChange={handleChange('telefono')} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>PEC</Label>
          <Input value={data.pec} onChange={handleChange('pec')} />
        </div>
        <div>
          <Label>Codice Destinatario</Label>
          <Input value={data.codiceDestinatario} onChange={handleChange('codiceDestinatario')} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Salvataggio…' : submitLabel}
      </Button>
    </form>
  );
}

