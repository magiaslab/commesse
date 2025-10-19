'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Skeleton } from '@/components/ui/skeleton';

type Commessa = {
  id: number;
  codice: string;
  titolo: string;
  cliente?: { ragioneSociale: string } | null;
  createdAt: string;
};

export default function CommessePage() {
  const [data, setData] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/commesse?q=${encodeURIComponent(query)}&page=1&pageSize=100`, { cache: 'no-store' });
        const json = await res.json();
        if (mounted) setData(json.items || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [query]);

  const columns = useMemo<ColumnDef<Commessa>[]>(
    () => [
      { header: 'Codice', accessorKey: 'codice' },
      { header: 'Titolo', accessorKey: 'titolo' },
      {
        header: 'Cliente',
        cell: ({ row }) => row.original.cliente?.ragioneSociale || '-',
      },
      {
        header: 'Azioni',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link href={`/commesse/${row.original.id}`} className="text-primary hover:underline">
              Dettaglio
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-gray-600 hover:text-primary">Elimina</button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminare questa commessa?</AlertDialogTitle>
                  <AlertDialogDescription>Questa azione è definitiva.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/commesse/${row.original.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        toast.success('Commessa eliminata');
                        // Aggiorna lista locale
                        // Non abbiamo setData qui: usiamo una forzatura via window.location o gestore sollevato
                        window.location.reload();
                      } else {
                        toast.error('Errore eliminazione commessa');
                      }
                    }}
                  >
                    Conferma
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
  });

  return (
    <main className="p-6">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        pageSize={100}
        onPageSizeChange={() => {}}
        rightSlot={<Button asChild><Link href="/commesse/new">Nuova commessa</Link></Button>}
        placeholder="Cerca per codice, titolo o cliente..."
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
        </div>
      )}
    </main>
  );
}
