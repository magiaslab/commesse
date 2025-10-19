'use client';

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CustomerInvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const load = async () => {
    const res = await fetch(`/api/customer-invoices?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`, { cache: 'no-store' });
    const json = await res.json();
    setRows(json.items || json);
    setTotal(json.total || (Array.isArray(json) ? json.length : 0));
  };
  useEffect(() => { load(); }, [q, page, pageSize]);

  return (
    <main className="p-6">
      <TableToolbar
        query={q}
        onQueryChange={(v) => { setPage(1); setQ(v); }}
        pageSize={pageSize}
        onPageSizeChange={(n) => { setPage(1); setPageSize(n); }}
        exportHref={`/api/customer-invoices?q=${encodeURIComponent(q)}&format=csv`}
        info={rows.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : '0 risultati'}
        placeholder="Cerca per numero..."
      />
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numero</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Importo</TableHead>
              <TableHead>Incasso</TableHead>
              <TableHead>Commessa</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.numero}</TableCell>
                <TableCell>{new Date(r.dataFattura).toLocaleDateString()}</TableCell>
                <TableCell>{Number(r.importoTotale).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</TableCell>
                <TableCell>{r.dataIncasso ? new Date(r.dataIncasso).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{r.commessa ? `${r.commessa.codice} – ${r.commessa.titolo}` : '-'}</TableCell>
                <TableCell>
                  {r.documento?.s3Key ? (
                    <a className="text-primary hover:underline" href={`/api/files/${encodeURIComponent(r.documento.s3Key)}`} target="_blank" rel="noreferrer">Apri</a>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page-1))} disabled={page===1}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-sm">Pagina {page}</div>
          <Button variant="outline" size="sm" onClick={() => setPage(page*pageSize < total ? page+1 : page)} disabled={page*pageSize >= total}><ChevronRight className="h-4 w-4" /></Button>
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
    </main>
  );
}


