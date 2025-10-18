'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function CommesaDDTPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/ddt?commessaId=${id}&includeDeleted=${showDeleted}`, { cache: 'no-store' });
    const json = await res.json();
    setData(json.items || json);
  };

  useEffect(() => {
    if (id) load();
  }, [id, showDeleted]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { header: 'Numero', accessorKey: 'numero', cell: ({ row }) => (
        <span className={row.original.descrizione === 'DELETED' ? 'text-muted-foreground' : undefined}>{row.original.numero}</span>
      ) },
      { header: 'Data', cell: ({ row }) => new Date(row.original.data).toLocaleDateString() },
      { header: 'Fornitore', cell: ({ row }) => (
        <span className={row.original.descrizione === 'DELETED' ? 'text-muted-foreground' : undefined}>{row.original.supplier?.ragioneSociale || '-'}</span>
      ) },
      { header: 'Importo', accessorKey: 'importo' },
      { header: 'Azioni', cell: ({ row }) => <DeleteDDTButton id={row.original.id} onDeleted={load} /> },
    ],
    []
  );

  const uploadDDT = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const key = `ddt/${Date.now()}-${file.name}`;
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: file.type }),
      });
      const presign = await presignRes.json();
      if (!presignRes.ok) throw new Error(presign.error || 'Presign error');
      await fetch(presign.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });

      const doc = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commessaId: Number(id),
          tipo: 'DDT',
          filenameOriginal: file.name,
          s3Key: key,
          mimetype: file.type,
          sizeBytes: file.size,
        }),
      }).then((r) => r.json());

      await fetch('/api/ddt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commessaId: Number(id), supplierId: data[0]?.supplierId || 1, numero: `DDT-${Date.now()}`, data: new Date().toISOString(), documentoId: doc.id }),
      });

      setFile(null);
      await load();
      toast.success('DDT caricato');
    } finally {
      setLoading(false);
    }
  };

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button onClick={uploadDDT} disabled={!file || loading}>{loading ? 'Upload…' : 'Upload PDF DDT'}</Button>
        <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={showDeleted} onChange={(e)=> setShowDeleted(e.target.checked)} /> Mostra eliminati</label>
        <a className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted" href={`/api/ddt?commessaId=${id}&includeDeleted=${showDeleted}&format=csv`} target="_blank" rel="noreferrer">Esporta CSV</a>
      </div>
      <div className="overflow-x-auto rounded-md border">
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
    </main>
  );
}

function DeleteDDTButton({ id, onDeleted }: { id: number; onDeleted: () => void }) {
  const handleDelete = async () => {
    const res = await fetch(`/api/ddt/${id}`, { method: 'DELETE' });
    if (res.ok) { onDeleted(); toast.success('DDT eliminato'); } else { toast.error('Errore eliminazione'); }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">Elimina</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il DDT?</AlertDialogTitle>
          <AlertDialogDescription>Verranno rimossi anche i collegamenti a fatture/commesse.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Annulla</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={handleDelete}>Conferma</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
