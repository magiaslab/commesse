import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

export async function POST(_: Request, { params }: { params: { versionId: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  const id = Number(params.versionId);
  const v = await prisma.preventivoVersion.findUnique({ where: { id }, include: { items: true } });
  if (!v) return new NextResponse('Not found', { status: 404 });
  if (v.status !== 'DRAFT') return new NextResponse('Locked', { status: 409 });
  if (v.items.length === 0) return new NextResponse('Empty', { status: 400 });
  await prisma.preventivoVersion.update({ where: { id }, data: { status: 'IN_REVIEW', submittedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
}


