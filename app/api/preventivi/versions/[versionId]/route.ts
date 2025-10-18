import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import { recalcVersionTotals } from '@/lib/preventivi';
import { sanitizeHtml } from '@/lib/sanitize-html';

export async function GET(_: Request, { params }: { params: { versionId: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const id = Number(params.versionId);
  const v = await prisma.preventivoVersion.findUnique({ where: { id }, include: { items: true, preventivo: true } });
  if (!v) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json(v);
}

export async function PUT(req: Request, { params }: { params: { versionId: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  const id = Number(params.versionId);
  const body = await req.json();
  if (body?.note) body.note = sanitizeHtml(String(body.note));
  const v = await prisma.preventivoVersion.findUnique({ where: { id } });
  if (!v) return new NextResponse('Not found', { status: 404 });
  if (v.status !== 'DRAFT') return new NextResponse('Locked', { status: 409 });
  const updated = await prisma.preventivoVersion.update({ where: { id }, data: body });
  await recalcVersionTotals(prisma, id);
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { versionId: string } }) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  const id = Number(params.versionId);
  const v = await prisma.preventivoVersion.findUnique({ where: { id } });
  if (!v) return new NextResponse('Not found', { status: 404 });
  if (v.status !== 'DRAFT') return new NextResponse('Locked', { status: 409 });
  await prisma.preventivoItem.deleteMany({ where: { preventivoVersionId: id } });
  await prisma.preventivoVersion.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}


