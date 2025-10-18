import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const ddt = await prisma.dDT.findUnique({ where: { id }, include: { supplier: true, documento: true, commesse: { include: { commessa: true } } } });
    if (!ddt) return new NextResponse('Not found', { status: 404 });
    return NextResponse.json(ddt);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    // Soft delete: segna descrizione come DELETED
    const updated = await prisma.dDT.update({ where: { id }, data: { descrizione: 'DELETED' } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return new NextResponse('Not found', { status: 404 });
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  // restore
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const updated = await prisma.dDT.update({ where: { id }, data: { descrizione: null } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return new NextResponse('Not found', { status: 404 });
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}


