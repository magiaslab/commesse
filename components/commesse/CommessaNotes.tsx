'use client';

import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CommessaNotes({ commessaId }: { commessaId: number }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const r = await fetch(`/api/commesse/${commessaId}`);
      if (!r.ok) return;
      const c = await r.json();
      setNotes(c.descrizione || '');
    };
    load();
  }, [commessaId]);

  const save = async () => {
    setLoading(true);
    const r = await fetch(`/api/commesse/${commessaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descrizione: notes }),
    });
    setLoading(false);
    if (!r.ok) return toast.error('Errore salvataggio note');
    toast.success('Note salvate');
  };

  return (
    <div className="space-y-2">
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note della commessa" rows={5} />
      <Button type="button" onClick={save} disabled={loading}>{loading ? 'Salvataggio...' : 'Salva note'}</Button>
    </div>
  );
}


