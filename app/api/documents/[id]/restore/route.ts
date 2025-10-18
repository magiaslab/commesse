import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const updated = await prisma.document.update({ where: { id }, data: { notes: null, verified: true } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return new NextResponse('Not found', { status: 404 });
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}


