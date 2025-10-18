import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string; taskId: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const key = `kanban:commessa:${params.id}`;
  const body = await req.json();
  const { stato, title, descrizione, move } = body || {};
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  let items: any[] = [];
  if (setting?.value) {
    try { items = JSON.parse(setting.value); } catch {}
  }
  const idNum = Number(params.taskId);
  const idx = items.findIndex((i) => Number(i.id) === idNum);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...(stato ? { stato } : {}), ...(title ? { title } : {}), ...(descrizione ? { descrizione } : {}) };
    // Reorder within same stato
    if (move === 'up' || move === 'down') {
      const current = items[idx];
      // get indexes of same-state items
      const same = items.map((it, pos) => ({ it, pos })).filter((x) => x.it.stato === current.stato);
      const positionInSame = same.findIndex((x) => x.pos === idx);
      const swapWith = move === 'up' ? positionInSame - 1 : positionInSame + 1;
      if (swapWith >= 0 && swapWith < same.length) {
        const a = idx;
        const b = same[swapWith].pos;
        const tmp = items[a]; items[a] = items[b]; items[b] = tmp;
      }
    }
  } else {
    items.push({ id: idNum, stato: stato || 'todo', title: title || `Task ${idNum}`, descrizione: descrizione || null });
  }
  await prisma.appSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(items) }, update: { value: JSON.stringify(items) } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; taskId: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const key = `kanban:commessa:${params.id}`;
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  let items: any[] = [];
  if (setting?.value) { try { items = JSON.parse(setting.value); } catch {} }
  const idNum = Number(params.taskId);
  items = items.filter((i) => Number(i.id) !== idNum);
  await prisma.appSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(items) }, update: { value: JSON.stringify(items) } });
  return NextResponse.json({ ok: true });
}
