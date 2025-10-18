import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

export async function POST(_: Request, { params }: { params: { versionId: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  const id = Number(params.versionId);
  const v = await prisma.preventivoVersion.findUnique({ where: { id }, include: { preventivo: true } });
  if (!v) return new NextResponse('Not found', { status: 404 });
  if (v.status !== 'IN_REVIEW') return new NextResponse('Locked', { status: 409 });
  await prisma.$transaction(async (tx) => {
    await tx.preventivoVersion.updateMany({ where: { preventivoId: v.preventivoId, status: 'APPROVED' }, data: { status: 'SUPERSEDED' } });
    const updated = await tx.preventivoVersion.update({ where: { id }, data: { status: 'APPROVED', approvedAt: new Date() } });
    await tx.preventivo.update({ where: { id: v.preventivoId }, data: { currentApprovedVersionId: id } });
    // Aggiorna budget commessa = totale imponibile (puoi cambiare in totalWithTax se preferisci)
    await tx.commessa.update({ where: { id: v.preventivo.commessaId }, data: { budget: updated.totalBeforeTax } });
  });
  return new NextResponse(null, { status: 204 });
}


