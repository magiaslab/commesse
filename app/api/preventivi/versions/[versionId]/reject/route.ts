import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

export async function POST(req: Request, { params }: { params: { versionId: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  const id = Number(params.versionId);
  const { reason } = await req.json().catch(() => ({ reason: null }));
  const v = await prisma.preventivoVersion.findUnique({ where: { id } });
  if (!v) return new NextResponse('Not found', { status: 404 });
  if (v.status !== 'IN_REVIEW') return new NextResponse('Locked', { status: 409 });
  await prisma.preventivoVersion.update({ where: { id }, data: { status: 'REJECTED', changeNote: reason || undefined } });
  return new NextResponse(null, { status: 204 });
}


