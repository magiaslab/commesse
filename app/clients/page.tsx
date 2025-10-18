'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { ChevronsLeft, ChevronsRight, ChevronsUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Client = {
  id: number;
  ragioneSociale: string;
  nomeCommerciale?: string | null;
  email?: string | null;
  createdAt: string;
};

export default function ClientsPage() {
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const sort = sorting[0];

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: globalFilter, page: String(page), pageSize: String(pageSize), sortBy: sort?.id || 'createdAt', sortDir: sort?.desc ? 'desc' : 'asc' });
        const res = await fetch(`/api/clients?${params.toString()}`, { cache: 'no-store' });
        const json = await res.json();
        if (mounted) {
          setData(json.items || json);
          setTotal(json.total || (json.length ?? 0));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [globalFilter, page, pageSize, sort?.id, sort?.desc]);

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      { header: () => (
          <div className="inline-flex items-center gap-1">ID</div>
        ), accessorKey: 'id' },
      { header: () => (
          <div className="inline-flex items-center gap-1">Ragione Sociale</div>
        ), accessorKey: 'ragioneSociale' },
      { header: () => (
          <div className="inline-flex items-center gap-1">Email</div>
        ), accessorKey: 'email' },
      {
        header: 'Azioni',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link href={`/clients/${row.original.id}`} className="text-primary hover:underline">
              Dettaglio
            </Link>
            <Link href={`/clients/${row.original.id}/edit`} className="text-gray-600 hover:underline">
              Modifica
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize) || 0,
  });

  useEffect(() => { table.setPageIndex(page - 1); }, [page]);
  useEffect(() => { table.setPageSize(pageSize); }, [pageSize]);

  return (
    <main className="p-6">
      <TableToolbar
        query={globalFilter}
        onQueryChange={(q) => { setPage(1); setGlobalFilter(q); }}
        pageSize={pageSize}
        onPageSizeChange={(n) => { setPage(1); setPageSize(n); }}
        exportHref={`/api/clients?format=csv&q=${encodeURIComponent(globalFilter)}`}
        info={data.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : '0 risultati'}
        rightSlot={<Button asChild><Link href="/clients/new">Nuovo cliente</Link></Button>}
        placeholder="Cerca per ragione sociale o email…"
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
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort?.() ?? true;
                    const sorted = header.column.getIsSorted?.();
                    return (
                      <TableHead
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler?.() : undefined}
                        className={canSort ? 'cursor-pointer select-none' : ''}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="inline-flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort ? (
                              sorted === 'asc' ? <ChevronUp className="h-3 w-3" /> : sorted === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-50" />
                            ) : null}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
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
            <div className="text-sm text-muted-foreground">
              {data.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : 'Nessun cliente'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">Pagina {page}</div>
              <Button variant="outline" size="sm" onClick={() => setPage((page*pageSize < total) ? page + 1 : page)} disabled={page*pageSize >= total}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.ceil(total / pageSize))} disabled={page*pageSize >= total}>
                <ChevronsRight className="h-4 w-4" />
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

