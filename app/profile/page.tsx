'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' });
        if (res.status === 401) {
          router.push('/signin?callbackUrl=/profile');
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setProfile(json);
        setName(json?.name || '');
        setFirstName(json?.firstName || '');
        setLastName(json?.lastName || '');
        setNickname(json?.nickname || '');
        setAddress(json?.address || '');
        setPhone(json?.phone || '');
        setAlertEmail(json?.alertEmail || json?.email || '');
      } catch (e) {
        // opzionale: mostrare messaggio
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const uploadAvatar = async () => {
    if (!file) return;
    const key = `avatars/${profile.id}-${Date.now()}-${file.name}`;
    // Fallback server-side upload (evita CORS)
    const form = new FormData();
    form.append('file', file);
    form.append('key', key);
    form.append('contentType', file.type);
    const res = await fetch('/api/upload/server', { method: 'POST', body: form });
    if (!res.ok) throw new Error(await res.text());
    return key;
  };

  const onSave = async () => {
    setSaving(true);
    try {
      let imageKey = profile?.image || null;
      if (file) imageKey = await uploadAvatar();
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: imageKey, firstName, lastName, nickname, address, phone, alertEmail }),
      });
      if (res.status === 401) {
        router.push('/signin?callbackUrl=/profile');
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const updated = await fetch('/api/profile', { cache: 'no-store' }).then((r) => r.json());
      setProfile(updated);
      setFile(null);
      setAvatarVersion(Date.now());
      toast.success('Profilo aggiornato');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-6">Caricamento…</main>;
  if (!profile) return <main className="p-6">Non autorizzato. Reindirizzamento…</main>;

  return (
    <main className="p-6">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Profilo utente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.image ? `/api/files/${profile.image}?v=${avatarVersion}` : ''} alt={profile.email} />
              <AvatarFallback>{profile.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Label>Avatar</Label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Nome proprio</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Cognome</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Nickname</Label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Indirizzo</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>Email per alert</Label>
            <Input type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} />
          </div>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
        </CardContent>
      </Card>

      <Card className="mx-auto mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Cambio password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Password corrente</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label>Nuova password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button
            onClick={async () => {
              setChangingPwd(true);
              try {
                const r = await fetch('/api/profile/password', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentPassword, newPassword }),
                });
                if (!r.ok) throw new Error(await r.text());
                toast.success('Password aggiornata');
                setCurrentPassword('');
                setNewPassword('');
              } catch (e: any) {
                toast.error(e.message || 'Errore cambio password');
              } finally {
                setChangingPwd(false);
              }
            }}
            disabled={changingPwd || !currentPassword || newPassword.length < 8}
          >
            {changingPwd ? 'Aggiornamento…' : 'Aggiorna password'}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
