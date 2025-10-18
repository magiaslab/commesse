import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return new NextResponse('Not found', { status: 404 });
    return NextResponse.json(doc);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const body = await req.json();
    // Permettiamo update di metadati non critici
    const { tipo, documentDate, documentNumber, expiryDate, notes, verified } = body || {};
    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(tipo != null ? { tipo: String(tipo) } : {}),
        ...(documentDate != null ? { documentDate: new Date(documentDate) } : {}),
        ...(documentNumber != null ? { documentNumber: String(documentNumber) } : {}),
        ...(expiryDate != null ? { expiryDate: new Date(expiryDate) } : {}),
        ...(notes != null ? { notes: String(notes) } : {}),
        ...(verified != null ? { verified: Boolean(verified) } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return new NextResponse('Not found', { status: 404 });
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    // Soft delete: impostiamo verified=false e notes con marker, non rimuoviamo l'oggetto S3 qui
    const updated = await prisma.document.update({ where: { id }, data: { verified: false, notes: 'DELETED' } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return new NextResponse('Not found', { status: 404 });
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}


