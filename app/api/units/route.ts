import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function GET() {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const units = await prisma.unit.findMany({ where: { active: true }, orderBy: { code: 'asc' } });
    return NextResponse.json(units);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Errore lettura unità (verifica migrazione DB)' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  try {
    const schema = z.object({ code: z.string().min(1), label: z.string().min(1), category: z.enum(['MATERIALI','MANODOPERA','GESTIONE']).optional(), active: z.boolean().optional() });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const data = parsed.data;
    data.code = data.code.trim().toUpperCase();
    const created = await prisma.unit.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const msg = String(e?.message || 'Errore creazione');
    const status = msg.includes('Unique constraint') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PUT(req: Request) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  try {
    const schema = z.object({ id: z.number(), code: z.string().min(1).optional(), label: z.string().min(1).optional(), category: z.enum(['MATERIALI','MANODOPERA','GESTIONE']).optional(), active: z.boolean().optional() });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const { id, ...data } = parsed.data as any;
    if (data.code) data.code = data.code.trim().toUpperCase();
    const updated = await prisma.unit.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Errore aggiornamento' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return new NextResponse('Missing id', { status: 400 });
    await prisma.unit.update({ where: { id }, data: { active: false } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Errore eliminazione' }, { status: 500 });
  }
}


