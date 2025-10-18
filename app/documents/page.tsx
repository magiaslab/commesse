
'use client';

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/documents?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}&includeDeleted=${showDeleted}`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) {
          setDocs([]);
          setTotal(0);
          return;
        }
        const json = await res.json();
        setDocs(json.items || []);
        setTotal(json.total || 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [q, page, pageSize, showDeleted]);

  return (
    <main className="p-6">
      <TableToolbar
        query={q}
        onQueryChange={(v) => { setPage(1); setQ(v); }}
        pageSize={pageSize}
        onPageSizeChange={(n) => { setPage(1); setPageSize(n); }}
        exportHref={`/api/documents?q=${encodeURIComponent(q)}&includeDeleted=${showDeleted}&format=csv`}
        info={docs.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : '0 risultati'}
        rightSlot={<label className="flex items-center gap-2 text-sm"><Checkbox checked={showDeleted} onCheckedChange={(v)=> setShowDeleted(Boolean(v))} /> Mostra eliminati</label>}
        placeholder="Cerca per tipo/nome..."
      />
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome file</TableHead>
                <TableHead>Commessa</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id} className={d.notes === 'DELETED' ? 'bg-muted/30 text-muted-foreground' : undefined}>
                  <TableCell>{d.tipo}</TableCell>
                  <TableCell>{d.filenameOriginal}</TableCell>
                  <TableCell>{d.commessa ? `${d.commessa.codice} – ${d.commessa.titolo}` : '-'}</TableCell>
                  <TableCell>{new Date(d.uploadedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {d.notes === 'DELETED' ? <Badge variant="secondary">Eliminato</Badge> : null}
                      {d.s3Key ? (
                        <a className="text-primary hover:underline" href={`/api/files/${encodeURIComponent(d.s3Key)}`} target="_blank" rel="noreferrer">
                          Apri
                        </a>
                      ) : null}
                      <DeleteDocButton id={d.id} onDeleted={() => setDocs((arr)=> arr.filter((x)=> x.id!==d.id))} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
            <div className="text-sm text-muted-foreground">
              {docs.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : 'Nessun documento'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">Pagina {page}</div>
              <Button variant="outline" size="sm" onClick={() => setPage(page*pageSize < total ? page+1 : page)} disabled={page*pageSize >= total}>
                <ChevronRight className="h-4 w-4" />
              </Button>
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
        </div>
      )}
    </main>
  );
}

function DeleteDocButton({ id, onDeleted }: { id: number; onDeleted: () => void }) {
  const handleDelete = async () => {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      onDeleted();
      toast.success('Documento eliminato', {
        action: {
          label: 'Annulla',
          onClick: async () => { await fetch(`/api/documents/${id}/restore`, { method: 'POST' }); },
        },
      });
    } else {
      toast.error('Errore eliminazione');
    }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">Elimina</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il documento?</AlertDialogTitle>
          <AlertDialogDescription>Soft delete: il record viene nascosto ma il file può restare su S3.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Annulla</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={handleDelete}>Conferma</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
