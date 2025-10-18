"use client";

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CONTABILE' | 'OPERATORE';
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  phone?: string | null;
  alertEmail?: string | null;
};

export function UsersAdmin() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'CONTABILE' | 'OPERATORE'>('OPERATORE');
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<null | (UserRow & { address?: string | null })>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'email' | 'role'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = async () => {
    const params = new URLSearchParams({
      q,
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortDir,
    });
    const res = await fetch(`/api/users?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    setRows(json.items || []);
    setTotal(json.total || 0);
  };

  useEffect(() => { load(); }, [page, pageSize, sortBy, sortDir]);
  // live search con debounce
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label>Cerca</Label>
          <Input placeholder="Nome o email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={load}>Cerca</Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[72px]">ID</TableHead>
              <TableHead className="w-[30%] cursor-pointer select-none" onClick={() => { setSortBy('name'); setSortDir(sortBy === 'name' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                <span className="inline-flex items-center">Nome {sortBy === 'name' ? (sortDir === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />) : <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />}</span>
              </TableHead>
              <TableHead className="w-[40%] cursor-pointer select-none" onClick={() => { setSortBy('email'); setSortDir(sortBy === 'email' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                <span className="inline-flex items-center">Email {sortBy === 'email' ? (sortDir === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />) : <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />}</span>
              </TableHead>
              <TableHead className="w-[180px] cursor-pointer select-none" onClick={() => { setSortBy('role'); setSortDir(sortBy === 'role' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                <span className="inline-flex items-center">Ruolo {sortBy === 'role' ? (sortDir === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />) : <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />}</span>
              </TableHead>
              <TableHead className="text-right w-[320px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs">#{u.id}</TableCell>
                <TableCell>{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '-'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    onValueChange={async (val) => {
                      const newRole = val as UserRow['role'];
                      const prev = u.role;
                      setRows((rs) => rs.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
                      try {
                        const r = await fetch(`/api/users/${u.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ role: newRole }),
                        });
                        if (!r.ok) throw new Error(await r.text());
                        toast.success('Ruolo aggiornato');
                      } catch (err: any) {
                        toast.error(err.message || 'Errore aggiornamento ruolo');
                        setRows((rs) => rs.map((x) => (x.id === u.id ? { ...x, role: prev } : x)));
                      }
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Ruolo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATORE">OPERATORE</SelectItem>
                      <SelectItem value="CONTABILE">CONTABILE</SelectItem>
                      <SelectItem value="MANAGER">MANAGER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(u as any)}
                    >
                      Modifica
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Inviare una password temporanea a ${u.email}?`)) return;
                        try {
                          const r = await fetch(`/api/users/${u.id}/password`, { method: 'POST' });
                          if (!r.ok) throw new Error(await r.text());
                          toast.success('Password reimpostata e inviata via email');
                        } catch (err: any) {
                          toast.error(err.message || 'Errore reset password');
                        }
                      }}
                    >
                      Reset password
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Eliminare l'utente ${u.email}?`)) return;
                        try {
                          const r = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
                          if (!r.ok) throw new Error(await r.text());
                          toast.success('Utente eliminato');
                          setRows((rs) => rs.filter((x) => x.id !== u.id));
                        } catch (err: any) {
                          toast.error(err.message || 'Errore eliminazione');
                        }
                      }}
                    >
                      Elimina
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
          <div className="text-sm text-muted-foreground">{rows.length ? `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, total)} di ${total}` : 'Nessun utente'}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}>Precedente</Button>
            <div className="text-sm">Pagina {page}</div>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => (p*pageSize < total ? p+1 : p))} disabled={page*pageSize >= total}>Successiva</Button>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
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

      {/* Editor utente */}
      <Sheet open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Modifica utente</SheetTitle>
          </SheetHeader>
          {editing && (
            <div className="mt-4 space-y-3">
              <div>
                <Label>Nome visualizzato</Label>
                <Input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Nome</Label>
                  <Input value={editing.firstName || ''} onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} />
                </div>
                <div>
                  <Label>Cognome</Label>
                  <Input value={editing.lastName || ''} onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Nickname</Label>
                <Input value={editing.nickname || ''} onChange={(e) => setEditing({ ...editing, nickname: e.target.value })} />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <Label>Indirizzo</Label>
                <Input value={(editing as any).address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value } as any)} />
              </div>
              <div>
                <Label>Email alert</Label>
                <Input type="email" value={editing.alertEmail || ''} onChange={(e) => setEditing({ ...editing, alertEmail: e.target.value })} />
              </div>
              <div>
                <Label>Ruolo</Label>
                <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v as any })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleziona ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATORE">OPERATORE</SelectItem>
                    <SelectItem value="CONTABILE">CONTABILE</SelectItem>
                    <SelectItem value="MANAGER">MANAGER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Annulla
                </Button>
                <Button
                  onClick={async () => {
                    if (!editing) return;
                    setSavingEdit(true);
                    try {
                      const r = await fetch(`/api/users/${editing.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: editing.name || undefined,
                          firstName: editing.firstName || undefined,
                          lastName: editing.lastName || undefined,
                          nickname: editing.nickname || undefined,
                          phone: editing.phone || undefined,
                          address: (editing as any).address || undefined,
                          alertEmail: editing.alertEmail || undefined,
                          role: editing.role,
                        }),
                      });
                      if (!r.ok) throw new Error(await r.text());
                      toast.success('Utente aggiornato');
                      // refresh lista
                      const updated = await r.json();
                      setRows((rs) => rs.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
                      setEditing(null);
                    } catch (err: any) {
                      toast.error(err.message || 'Errore salvataggio');
                    } finally {
                      setSavingEdit(false);
                    }
                  }}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Salvataggio…' : 'Salva'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="space-y-2">
        <div className="text-sm font-medium">Invita/crea utente</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.it" />
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome visualizzato" />
          </div>
          <div>
            <Label>Ruolo</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona ruolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPERATORE">OPERATORE</SelectItem>
                <SelectItem value="CONTABILE">CONTABILE</SelectItem>
                <SelectItem value="MANAGER">MANAGER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={async () => {
            setInviting(true);
            try {
              const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, role, invite: true }),
              });
              if (!res.ok) throw new Error(await res.text());
              toast.success('Utente creato/invitato');
              setEmail(''); setName(''); setRole('OPERATORE');
              await load();
            } catch (e: any) {
              toast.error(e.message || 'Errore invito');
            } finally {
              setInviting(false);
            }
          }}
          disabled={inviting || !email}
        >
          {inviting ? 'Invio…' : 'Invita/crea'}
        </Button>
      </div>
    </div>
  );
}


