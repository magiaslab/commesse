'use client';

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ScadenzePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [responsabile, setResponsabile] = useState('all');
  const [responsabili, setResponsabili] = useState<string[]>([]);
  const [commessaId, setCommessaId] = useState<string>('all');
  const [commesse, setCommesse] = useState<Array<{ id: number; codice?: string; titolo?: string }>>([]);
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (responsabile && responsabile !== 'all') params.set('responsabile', responsabile);
      if (commessaId && commessaId !== 'all') params.set('commessaId', commessaId);
      if (onlyCompleted) params.set('onlyCompleted', 'true');
      const res = await fetch(`/api/scadenze?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      setRows(json.items || json);
      setTotal(json.total || 0);
      // estraggo responsabili per il filtro
      const rs = new Set<string>();
      (json.items || json || []).forEach((x: any) => { if (x.responsabile) rs.add(x.responsabile); });
      setResponsabili(Array.from(rs));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [q, page, pageSize, dateFrom, dateTo]);

  // Carico lista commesse per filtro (prime 100)
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/commesse?page=1&pageSize=100', { cache: 'no-store' });
      const j = await r.json();
      const items = j.items || j || [];
      setCommesse(items.map((c: any) => ({ id: c.id, codice: c.codice, titolo: c.titolo })));
    })();
  }, []);

  const createEmpty = () => setRows((r) => [{ __new: true, title: '', tipo: 'generica', dateDue: new Date().toISOString().slice(0,10), responsabile: '', importo: '', alertDaysBefore: '[30,15,7]' }, ...r]);

  const save = async (row: any, index: number) => {
    const payload = { ...row, dateDue: row.dateDue?.slice(0,10) };
    const isNew = row.__new;
    const res = await fetch('/api/scadenze' + (isNew ? '' : ''), { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(isNew ? payload : { ...payload, id: row.id }) });
    if (!res.ok) return toast.error('Errore salvataggio');
    toast.success('Salvato');
    load();
  };

  const remove = async (id: number) => {
    const res = await fetch(`/api/scadenze?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return toast.error('Errore eliminazione');
    toast.success('Eliminato');
    load();
  };

  return (
    <main className="p-6">
      <TableToolbar
        query={q}
        onQueryChange={(v)=> { setPage(1); setQ(v); }}
        pageSize={pageSize}
        onPageSizeChange={(n)=> { setPage(1); setPageSize(n); }}
        info={rows.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : '0 risultati'}
        rightSlot={
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={(e)=> { setPage(1); setDateFrom(e.target.value); }} className="h-9 w-[150px]" />
            <span className="text-sm text-muted-foreground">→</span>
            <Input type="date" value={dateTo} onChange={(e)=> { setPage(1); setDateTo(e.target.value); }} className="h-9 w-[150px]" />
            <Select value={responsabile} onValueChange={(v)=> { setPage(1); setResponsabile(v); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Responsabile" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {responsabili.map((r)=> (<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={commessaId} onValueChange={(v)=> { setPage(1); setCommessaId(v); }}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Commessa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le commesse</SelectItem>
                {commesse.map((c)=> (
                  <SelectItem key={c.id} value={String(c.id)}>{c.codice ? `${c.codice} — ${c.titolo || ''}` : `#${c.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="ml-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyCompleted} onChange={(e)=> { setPage(1); setOnlyCompleted(e.target.checked); }} /> Solo completate</label>
            <Button asChild variant="outline"><a href={`/api/scadenze?format=csv&q=${encodeURIComponent(q)}${dateFrom?`&dateFrom=${dateFrom}`:''}${dateTo?`&dateTo=${dateTo}`:''}${responsabile&&responsabile!=='all'?`&responsabile=${encodeURIComponent(responsabile)}`:''}${commessaId&&commessaId!=='all'?`&commessaId=${commessaId}`:''}${onlyCompleted?`&onlyCompleted=true`:''}`} target="_blank" rel="noreferrer">Esporta CSV</a></Button>
            <Button onClick={createEmpty}>Nuova scadenza</Button>
          </div>
        }
        placeholder="Cerca per titolo…"
      />
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Resp.</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={r.id ?? `new-${idx}`}>
                  <TableCell><Input value={r.title || ''} onChange={(e)=>{ const cp=[...rows]; cp[idx]={...cp[idx], title:e.target.value}; setRows(cp); }} /></TableCell>
                  <TableCell><Input value={r.tipo || ''} onChange={(e)=>{ const cp=[...rows]; cp[idx]={...cp[idx], tipo:e.target.value}; setRows(cp); }} /></TableCell>
                  <TableCell><Input type="date" value={(r.dateDue || '').slice(0,10)} onChange={(e)=>{ const cp=[...rows]; cp[idx]={...cp[idx], dateDue:e.target.value}; setRows(cp); }} /></TableCell>
                  <TableCell><Input value={r.responsabile || ''} onChange={(e)=>{ const cp=[...rows]; cp[idx]={...cp[idx], responsabile:e.target.value}; setRows(cp); }} /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={r.importo ?? ''} onChange={(e)=>{ const cp=[...rows]; cp[idx]={...cp[idx], importo:e.target.value}; setRows(cp); }} /></TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={()=> save(r, idx)}>Salva</Button>
                    {!r.__new && <Button size="sm" variant="destructive" onClick={()=> remove(r.id)}>Elimina</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
            <div className="text-sm text-muted-foreground">{rows.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : 'Nessuna scadenza'}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="text-sm">Pagina {page}</div>
              <Button variant="outline" size="sm" onClick={() => setPage(page*pageSize < total ? page+1 : page)} disabled={page*pageSize >= total}><ChevronRight className="h-4 w-4" /></Button>
              <Select value={`${pageSize}`} onValueChange={(v)=> { setPage(1); setPageSize(Number(v)); }}>
                <SelectTrigger className="w-[100px]"><SelectValue placeholder="Per pagina" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
