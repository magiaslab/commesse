'use client';

import { useEffect, useMemo, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Row = { id: number; numero: string; dataFattura: string; importoTotale: number; dataIncasso?: string | null };

export function CommessaCustomerInvoicesTable({ commessaId }: { commessaId: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    const res = await fetch(`/api/customer-invoices?commessaId=${commessaId}&q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`, { cache: 'no-store' });
    const json = await res.json();
    setRows(json.items || json);
  };
  useEffect(() => { load(); }, [commessaId, q, page, pageSize]);

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { header: 'Numero', accessorKey: 'numero' },
    { header: 'Data', cell: ({ row }) => new Date(row.original.dataFattura).toLocaleDateString() },
    { header: 'Importo', cell: ({ row }) => row.original.importoTotale.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) },
    { header: 'Incasso', cell: ({ row }) => row.original.dataIncasso ? new Date(row.original.dataIncasso).toLocaleDateString() : '-' },
  ], []);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 p-3">
        <Input placeholder="Cerca…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        <Select value={`${pageSize}`} onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}>
          <SelectTrigger className="w-[100px]"><SelectValue placeholder="Per pagina" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((r) => (
            <TableRow key={r.id}>
              {r.getVisibleCells().map((c) => (<TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page-1))} disabled={page===1}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="text-sm">Pagina {page}</div>
        <Button variant="outline" size="sm" onClick={() => setPage(page+1)} disabled={rows.length < pageSize}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}


