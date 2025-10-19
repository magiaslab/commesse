import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function GET(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  const { searchParams } = new URL(req.url);
  const commessaId = searchParams.get('commessaId');
  const q = searchParams.get('q') || '';
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '10')));
  const includeDeleted = searchParams.get('includeDeleted') === 'true';
  const onlyDeleted = searchParams.get('onlyDeleted') === 'true';

  const where: any = {};
  if (commessaId) where.commessaId = Number(commessaId);
  if (onlyDeleted) where.statoIncasso = 'DELETED';
  else if (!includeDeleted) where.NOT = { statoIncasso: 'DELETED' };
  if (q) {
    where.OR = [
      { numero: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.customerInvoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize }),
    prisma.customerInvoice.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: Request) {
  const g = await guard(['ADMIN','MANAGER','CONTABILE']);
  if ('error' in g) return g.error;
  const schema = z.object({
    commessaId: z.number().int().optional().nullable(),
    numero: z.string().min(1),
    dataFattura: z.string().or(z.date()),
    importoTotale: z.number(),
    dataIncasso: z.string().or(z.date()).optional().nullable(),
    documentoId: z.number().int().optional().nullable(),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  const created = await prisma.customerInvoice.create({
    data: {
      commessaId: d.commessaId ?? null,
      numero: d.numero,
      dataFattura: new Date(d.dataFattura as any),
      importoTotale: d.importoTotale,
      dataIncasso: d.dataIncasso ? new Date(d.dataIncasso as any) : null,
      documentoId: d.documentoId ?? null,
    }
  });
  return NextResponse.json(created, { status: 201 });
}

