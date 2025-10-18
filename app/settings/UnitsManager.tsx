'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function UnitsManager() {
  const [units, setUnits] = useState<any[]>([]);
  const [code, setCode] = useState('PCS');
  const [label, setLabel] = useState('Pezzi');
  const [category, setCategory] = useState<'MATERIALI'|'MANODOPERA'|'GESTIONE'|''>('');

  const load = async () => {
    const r = await fetch('/api/units', { cache: 'no-store' });
    if (!r.ok) return;
    setUnits(await r.json());
  };
  useEffect(()=>{ load(); }, []);

  const add = async () => {
    const r = await fetch('/api/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim().toUpperCase(), label: label.trim(), category: category || undefined }) });
    if (!r.ok) {
      const txt = await r.text();
      try { const j = JSON.parse(txt); toast.error(j.error || 'Errore creazione'); } catch { toast.error('Errore creazione'); }
      return;
    }
    toast.success('Unità aggiunta');
    setCode(''); setLabel(''); setCategory('');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <div className="text-xs">Codice</div>
          <Input className="w-32" value={code} onChange={(e)=> setCode(e.target.value)} />
        </div>
        <div>
          <div className="text-xs">Etichetta</div>
          <Input className="w-56" value={label} onChange={(e)=> setLabel(e.target.value)} />
        </div>
        <div>
          <div className="text-xs">Categoria</div>
          <Select value={category} onValueChange={(v)=> setCategory(v as any)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="(opzionale)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MATERIALI">Materiali</SelectItem>
              <SelectItem value="MANODOPERA">Manodopera</SelectItem>
              <SelectItem value="GESTIONE">Gestione</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={add}>Aggiungi</Button>
      </div>
      <div className="text-sm">
        {units.length === 0 ? <div className="text-muted-foreground">Nessuna unità</div> : (
          <ul className="space-y-1">
            {units.map((u)=> (
              <li key={u.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm">{u.code}</span>
                  <span>{u.label}</span>
                  {u.category && <span className="text-muted-foreground text-xs">({u.category})</span>}
                </div>
                <Button size="sm" variant="outline" onClick={async()=>{ await fetch(`/api/units?id=${u.id}`, { method: 'DELETE' }); load(); }}>Disattiva</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


