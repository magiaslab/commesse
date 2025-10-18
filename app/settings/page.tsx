'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';
import { UsersAdmin } from './users';
import { UnitsManager } from './UnitsManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SettingsInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const tabFromUrl = sp.get('tab') || undefined;
  const [tab, setTab] = useState<string>(tabFromUrl || 'resend');
  const [resendKey, setResendKey] = useState('');
  const [resendFrom, setResendFrom] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [bucket, setBucket] = useState('');
  const [roleExample, setRoleExample] = useState('OPERATORE');
  const [reminderTo, setReminderTo] = useState('');
  const [alertDays, setAlertDays] = useState('30,15,7');
  const [theme, setTheme] = useState<'system'|'light'|'dark'>('system');
  const [accent, setAccent] = useState<'red'|'blue'|'green'|'orange'|'violet'>('red');

  const load = async () => {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setReminderTo(data.REMINDER_TO || '');
    setAlertDays(data.ALERT_DEFAULT_DAYS || '30,15,7');
  };

  if (typeof window !== 'undefined' && !reminderTo && !alertDays) {
    load();
  }

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== tab) setTab(tabFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  return (
    <Tabs value={tab} onValueChange={(v) => { setTab(v); router.replace(`/settings?tab=${v}`); }}>
      <TabsList>
        <TabsTrigger value="resend">Resend</TabsTrigger>
        <TabsTrigger value="storage">Storage R2</TabsTrigger>
        <TabsTrigger value="roles">Ruoli/Permessi</TabsTrigger>
        <TabsTrigger value="dictionaries">Parametri</TabsTrigger>
        <TabsTrigger value="users">Utenti</TabsTrigger>
        <TabsTrigger value="app">Applicazione</TabsTrigger>
        <TabsTrigger value="personalize">Personalizzazione</TabsTrigger>
      </TabsList>
      <TabsContent value="resend">
        <section className="w-full space-y-4">
          <h2 className="text-lg font-medium">Configurazione Resend</h2>
          <div className="grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>RESEND_API_KEY</Label>
              <Input value={resendKey} onChange={(e) => setResendKey(e.target.value)} placeholder="re_..." />
            </div>
            <div>
              <Label>RESEND_FROM</Label>
              <Input value={resendFrom} onChange={(e) => setResendFrom(e.target.value)} placeholder="no-reply@dominio.it" />
            </div>
          </div>
          <Button disabled>Salva (stub)</Button>
        </section>
      </TabsContent>
      <TabsContent value="storage">
        <section className="w-full space-y-4">
          <h2 className="text-lg font-medium">Storage Cloudflare R2</h2>
          <div className="grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Endpoint pubblico (CDN)</Label>
              <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://cdn.dominiostorage.com" />
            </div>
            <div>
              <Label>Bucket</Label>
              <Input value={bucket} onChange={(e) => setBucket(e.target.value)} placeholder="commesse" />
            </div>
          </div>
          <Button disabled>Salva (stub)</Button>
        </section>
      </TabsContent>
      <TabsContent value="roles">
        <section className="w-full space-y-4">
          <h2 className="text-lg font-medium">Ruoli e permessi</h2>
          <div className="max-w-sm">
            <Label>Ruolo di esempio</Label>
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={roleExample} onChange={(e) => setRoleExample(e.target.value)}>
              <option>ADMIN</option>
              <option>MANAGER</option>
              <option>CONTABILE</option>
              <option>OPERATORE</option>
            </select>
          </div>
          <Button disabled>Salva (stub)</Button>
        </section>
      </TabsContent>
      <TabsContent value="app">
        <section className="w-full space-y-4">
          <h2 className="text-lg font-medium">Impostazioni applicative</h2>
          <div className="grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>REMINDER_TO</Label>
              <Input value={reminderTo} onChange={(e) => setReminderTo(e.target.value)} placeholder="contabilita@azienda.it" />
            </div>
            <div>
              <Label>ALERT_DEFAULT_DAYS</Label>
              <Input value={alertDays} onChange={(e) => setAlertDays(e.target.value)} placeholder="30,15,7" />
            </div>
          </div>
          <Button
            type="button"
            onClick={async () => {
              const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ REMINDER_TO: reminderTo, ALERT_DEFAULT_DAYS: alertDays }),
              });
              if (res.ok) toast.success('Impostazioni salvate'); else toast.error('Errore salvataggio');
            }}
          >
            Salva
          </Button>
        </section>
      </TabsContent>
      <TabsContent value="users">
        <section className="w-full">
          <h2 className="mb-4 text-lg font-medium">Gestione utenti (solo admin)</h2>
          <UsersAdmin />
        </section>
      </TabsContent>
      <TabsContent value="dictionaries">
        <section className="w-full">
          <h2 className="mb-4 text-lg font-medium">Unità di misura</h2>
          <UnitsManager />
        </section>
      </TabsContent>
      <TabsContent value="personalize">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Personalizzazione interfaccia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Tema</Label>
                <Select value={theme} onValueChange={(v)=> setTheme(v as any)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Tema" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="light">Chiaro</SelectItem>
                    <SelectItem value="dark">Scuro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Colore accento</Label>
                <Select value={accent} onValueChange={(v)=> setAccent(v as any)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Accento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red">Rosso</SelectItem>
                    <SelectItem value="blue">Blu</SelectItem>
                    <SelectItem value="green">Verde</SelectItem>
                    <SelectItem value="orange">Arancione</SelectItem>
                    <SelectItem value="violet">Viola</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={async ()=>{
                const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme, accentColor: accent }) });
                if (res.ok) {
                  toast.success('Preferenze salvate');
                  const html = document.documentElement;
                  html.setAttribute('data-accent', accent);
                  if (theme === 'light') document.documentElement.classList.remove('dark');
                  if (theme === 'dark') document.documentElement.classList.add('dark');
                  if (theme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', prefersDark);
                  }
                } else toast.error('Errore salvataggio');
              }}>Salva</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default function SettingsPage() {
  return (
    <main className="p-6">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Caricamento…</div>}>
        <SettingsInner />
      </Suspense>
    </main>
  );
}

