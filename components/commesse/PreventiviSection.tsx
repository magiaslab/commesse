'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Printer } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Skeleton } from '@/components/ui/skeleton';

export function PreventiviSection({ commessaId }: { commessaId: number }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'stato' | 'createdAt' | 'id'>('stato');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize), sortBy, sortDir });
    const r = await fetch(`/api/commesse/${commessaId}/preventivi?${params.toString()}`, { cache: 'no-store' });
    if (r.ok) {
      const json = await r.json();
      setRows(json.items || json);
      setTotal(json.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [commessaId, q, page, pageSize, sortBy, sortDir]);

  const createPreventivo = async () => {
    const r = await fetch(`/api/commesse/${commessaId}/preventivi`, { method: 'POST' });
    if (!r.ok) return toast.error('Errore creazione preventivo');
    const created = await r.json();
    const firstVersion = created?.versions?.[0];
    if (firstVersion?.id) {
      router.push(`/preventivi/versions/${firstVersion.id}/edit`);
      return;
    }
    toast.success('Preventivo creato');
    load();
  };

  const action = async (path: string) => {
    const r = await fetch(path, { method: 'POST' });
    if (!r.ok && r.status !== 204) return toast.error('Azione non riuscita');
    load();
  };

  const openEditor = async (preventivoId: number) => {
    const res = await fetch(`/api/preventivi/${preventivoId}/versions`, { method: 'POST' });
    if (!res.ok) return toast.error('Errore creazione versione');
    const v = await res.json();
    if (v?.id) router.push(`/preventivi/versions/${v.id}/edit`);
  };

  return (
    <div className="space-y-3">
      <TableToolbar
        query={q}
        onQueryChange={(v) => { setPage(1); setQ(v); }}
        pageSize={pageSize}
        onPageSizeChange={(n) => { setPage(1); setPageSize(n); }}
        rightSlot={
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v)=>{ setPage(1); setSortBy(v as any); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ordina per" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stato">Approvati prima</SelectItem>
                <SelectItem value="createdAt">Data creazione</SelectItem>
                <SelectItem value="id">ID</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={()=> setSortDir((d)=> d==='asc'?'desc':'asc')} title="Inverti direzione">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={createPreventivo} disabled={loading}>Nuovo preventivo</Button>
          </div>
        }
        placeholder="Cerca note/versioni…"
      />

      <div className="rounded-md border overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Ultima versione</TableHead>
                  <TableHead>Approvata</TableHead>
                  <TableHead>Totale approvata</TableHead>
                  <TableHead>Azione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const last = p.versions?.[0];
                  const approved = p.currentApprovedVersion || null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">#{p.id}</TableCell>
                      <TableCell>
                        {last ? (
                          <div className="flex items-center gap-2">
                            <span>v{last.versionNumber}</span>
                            <Badge variant="secondary">{last.status}</Badge>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {approved ? (
                          <div className="flex items-center gap-2">
                            <span>v{approved.versionNumber}</span>
                            <Badge variant="default">APPROVED</Badge>
                            <Link href={`/preventivi/versions/${approved.id}/print`} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted">
                              <Printer className="h-3.5 w-3.5" /> Stampa
                            </Link>
                            <Link href={`/api/preventivi/versions/${approved.id}/pdf`} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted" target="_blank">
                              <Printer className="h-3.5 w-3.5" /> Scarica PDF
                            </Link>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {approved ? approved.totalWithTax?.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditor(p.id)}>Modifica (nuova versione)</Button>
                          {last?.status === 'DRAFT' && (
                            <Button size="sm" variant="outline" onClick={() => action(`/api/preventivi/versions/${last.id}/submit`)}>Invia in revisione</Button>
                          )}
                          {last?.status === 'IN_REVIEW' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => action(`/api/preventivi/versions/${last.id}/approve`)}>Approva</Button>
                              <Button size="sm" variant="destructive" onClick={() => action(`/api/preventivi/versions/${last.id}/reject`)}>Rifiuta</Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
              <div className="text-sm text-muted-foreground">{rows.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : 'Nessun preventivo'}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1}>Precedente</Button>
                <div className="text-sm">Pagina {page}</div>
                <Button variant="outline" size="sm" onClick={() => setPage(page*pageSize < total ? page+1 : page)} disabled={page*pageSize >= total}>Successiva</Button>
                <Select value={`${pageSize}`} onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}>
                  <SelectTrigger className="w-[100px]"><SelectValue placeholder="Per pagina" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>
      {/* L'editing avviene ora su pagina dedicata */}
    </div>
  );
}
