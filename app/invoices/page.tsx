"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function InvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);
  const [onlyDeleted, setOnlyDeleted] = useState(false);
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
      if (showDeleted) params.set('includeDeleted', 'true');
      if (onlyDeleted) params.set('onlyDeleted', 'true');
      if (status && status !== 'all') params.set('statoPagamento', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/invoices?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      setRows(json.items || []);
      setTotal(json.total || 0);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [q, page, pageSize, showDeleted, onlyDeleted, status, dateFrom, dateTo]);

  const exportHref = (() => {
    const params = new URLSearchParams({ q, format: 'csv' });
    if (showDeleted) params.set('includeDeleted', 'true');
    if (onlyDeleted) params.set('onlyDeleted', 'true');
    if (status && status !== 'all') params.set('statoPagamento', status);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return `/api/invoices?${params.toString()}`;
  })();

  return (
    <main className="p-6">
      <TableToolbar
        query={q}
        onQueryChange={(v)=> { setPage(1); setQ(v); }}
        pageSize={pageSize}
        onPageSizeChange={(n)=> { setPage(1); setPageSize(n); }}
        exportHref={exportHref}
        info={rows.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : '0 risultati'}
        rightSlot={
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v)=> { setPage(1); setStatus(v); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stato pagamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="pagata">Pagata</SelectItem>
                <SelectItem value="in_attesa">In attesa</SelectItem>
                <SelectItem value="scaduta">Scaduta</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e)=> { setPage(1); setDateFrom(e.target.value); }} className="h-9 w-[150px]" />
            <span className="text-sm text-muted-foreground">→</span>
            <Input type="date" value={dateTo} onChange={(e)=> { setPage(1); setDateTo(e.target.value); }} className="h-9 w-[150px]" />
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={showDeleted} onCheckedChange={(v)=> { setPage(1); setShowDeleted(Boolean(v)); }} /> Mostra eliminati</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={onlyDeleted} onCheckedChange={(v)=> { setPage(1); setOnlyDeleted(Boolean(v)); }} /> Solo eliminati</label>
          </div>
        }
        placeholder="Cerca fatture per numero o fornitore..."
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
                <TableHead>Numero</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((f) => (
                <TableRow key={f.id} className={f.statoPagamento === 'DELETED' ? 'bg-muted/30 text-muted-foreground' : undefined}>
                  <TableCell>#{f.numero}</TableCell>
                  <TableCell>{new Date(f.dataFattura).toLocaleDateString()}</TableCell>
                  <TableCell>{(f.importoTotale || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</TableCell>
                  <TableCell>{f.statoPagamento}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {f.statoPagamento === 'DELETED' ? <Badge variant="secondary">Eliminata</Badge> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
            <div className="text-sm text-muted-foreground">{rows.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : 'Nessuna fattura'}</div>
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
