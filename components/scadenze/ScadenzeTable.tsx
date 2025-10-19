'use client';

import { useEffect, useMemo, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Skeleton } from '@/components/ui/skeleton';

type Scadenza = {
  id: number;
  title: string;
  dateDue: string;
  responsabile?: string | null;
  supplier?: { id: number; ragioneSociale: string } | null;
  document?: { id: number; s3Key: string; filenameOriginal: string; mimetype: string; url: string } | null;
};

export function ScadenzeTable({ commessaId }: { commessaId: number }) {
  const [rows, setRows] = useState<Scadenza[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scadenze?commessaId=${commessaId}&page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      const json = await res.json();
      setRows(json.items || json); // retrocompatibilità
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [commessaId, page, pageSize, q]);

  const save = async (id: number, patch: Partial<Scadenza>) => {
    await fetch(`/api/scadenze/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const columns = useMemo<ColumnDef<Scadenza>[]>(
    () => [
      {
        header: 'Titolo',
        cell: ({ row }) => (
          <Input
            defaultValue={row.original.title}
            onBlur={(e) => save(row.original.id, { title: e.target.value })}
          />
        ),
      },
      {
        header: 'Scadenza',
        cell: ({ row }) => (
          <Input
            type="date"
            defaultValue={row.original.dateDue?.slice(0, 10)}
            onBlur={(e) => save(row.original.id, { dateDue: new Date(e.target.value).toISOString() as any })}
          />
        ),
      },
      {
        header: 'Giorni',
        cell: ({ row }) => {
          const d = new Date(row.original.dateDue);
          const today = new Date();
          const diff = Math.ceil((d.getTime() - new Date(today.toDateString()).getTime()) / (1000 * 60 * 60 * 24));
          return <span className={diff < 0 ? 'text-red-600' : diff <= 7 ? 'text-amber-600' : undefined}>{diff}</span>;
        },
      },
      {
        header: 'Fornitore',
        cell: ({ row }) => <span>{row.original.supplier?.ragioneSociale || '-'}</span>,
      },
      {
        header: 'Documento',
        cell: ({ row }) => row.original.document ? (
          <a className="text-primary hover:underline" href={row.original.document.url} target="_blank" rel="noreferrer">Apri</a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      },
      {
        header: 'Responsabile',
        cell: ({ row }) => (
          <Input
            defaultValue={row.original.responsabile || ''}
            onBlur={(e) => save(row.original.id, { responsabile: e.target.value })}
          />
        ),
      },
    ],
    []
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="p-3">
        <TableToolbar
          query={q}
          onQueryChange={(v) => { setPage(1); setQ(v); }}
          pageSize={pageSize}
          onPageSizeChange={(n) => { setPage(1); setPageSize(n); }}
        />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const fd = new FormData(form);
            const payload = {
              commessaId,
              title: String(fd.get('title') || ''),
              tipo: String(fd.get('tipo') || 'generica'),
              dateDue: String(fd.get('dateDue') || new Date().toISOString().slice(0,10)),
              responsabile: String(fd.get('responsabile') || ''),
            };
            const res = await fetch('/api/scadenze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
            if (res.ok) { (form.reset(), setPage(1)); await load(); }
          }}
          className="mt-3 grid gap-2 md:grid-cols-4"
        >
          <Input name="title" placeholder="Nuova scadenza - titolo" />
          <Input name="dateDue" type="date" />
          <Input name="responsabile" placeholder="Responsabile" />
          <Button type="submit" className="md:col-span-1">Aggiungi</Button>
        </form>
      </div>
      {loading ? (
        <div className="space-y-2 px-3 pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
            <div className="text-sm text-muted-foreground">{rows.length ? `${(page-1)*pageSize + 1}–${(page-1)*pageSize + rows.length}` : 'Nessuna scadenza'}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">Pagina {page}</div>
              <Button variant="outline" size="sm" onClick={() => setPage(page+1)} disabled={rows.length < pageSize}>
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
        </>
      )}
    </div>
  );
}

