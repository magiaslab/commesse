import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const key = `kanban:commessa:${params.id}`;
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  let items: any[] = [];
  if (setting?.value) {
    try { items = JSON.parse(setting.value); } catch {}
  }
  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const key = `kanban:commessa:${params.id}`;
  const body = await req.json();
  const { title, descrizione, stato } = body || {};
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  let items: any[] = [];
  if (setting?.value) { try { items = JSON.parse(setting.value); } catch {} }
  const idNum = Date.now();
  items.push({ id: idNum, title: title || `Task ${idNum}`, descrizione: descrizione || null, stato: stato || 'todo' });
  await prisma.appSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(items) }, update: { value: JSON.stringify(items) } });
  return NextResponse.json({ id: idNum });
}
