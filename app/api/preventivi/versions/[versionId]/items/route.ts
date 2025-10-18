import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import { calculateLineTotal, recalcVersionTotals } from '@/lib/preventivi';

export async function GET(_: Request, { params }: { params: { versionId: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const versionId = Number(params.versionId);
  const items = await prisma.preventivoItem.findMany({ where: { preventivoVersionId: versionId }, orderBy: { orderIndex: 'asc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: { versionId: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  const versionId = Number(params.versionId);
  const body = await req.json();
  const v = await prisma.preventivoVersion.findUnique({ where: { id: versionId } });
  if (!v) return new NextResponse('Not found', { status: 404 });
  if (v.status !== 'DRAFT') return new NextResponse('Locked', { status: 409 });
  const lineTotal = calculateLineTotal(body);
  const created = await prisma.preventivoItem.create({ data: { ...body, preventivoVersionId: versionId, lineTotal } });
  await recalcVersionTotals(prisma, versionId);
  return NextResponse.json(created);
}

export async function PUT(req: Request, { params }: { params: { versionId: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  const versionId = Number(params.versionId);
  const body = await req.json();
  const { id, ...rest } = body;
  const item = await prisma.preventivoItem.findUnique({ where: { id } });
  if (!item || item.preventivoVersionId !== versionId) return new NextResponse('Not found', { status: 404 });
  const v = await prisma.preventivoVersion.findUnique({ where: { id: versionId } });
  if (!v || v.status !== 'DRAFT') return new NextResponse('Locked', { status: 409 });
  const lineTotal = calculateLineTotal({ ...item, ...rest });
  const updated = await prisma.preventivoItem.update({ where: { id }, data: { ...rest, lineTotal } });
  await recalcVersionTotals(prisma, versionId);
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { versionId: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  const versionId = Number(params.versionId);
  const { id } = await req.json();
  const item = await prisma.preventivoItem.findUnique({ where: { id } });
  if (!item || item.preventivoVersionId !== versionId) return new NextResponse('Not found', { status: 404 });
  const v = await prisma.preventivoVersion.findUnique({ where: { id: versionId } });
  if (!v || v.status !== 'DRAFT') return new NextResponse('Locked', { status: 409 });
  await prisma.preventivoItem.delete({ where: { id } });
  await recalcVersionTotals(prisma, versionId);
  return new NextResponse(null, { status: 204 });
}


