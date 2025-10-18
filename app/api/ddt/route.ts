import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function GET(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const { searchParams } = new URL(req.url);
    const commessaId = searchParams.get('commessaId');
    const supplierId = searchParams.get('supplierId');
    const unlinked = searchParams.get('unlinked') === 'true';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true';
    const format = searchParams.get('format');

    const q = searchParams.get('q') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '10')));
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (commessaId) where.OR = [{ commessaId: Number(commessaId) }, { commesse: { some: { commessaId: Number(commessaId) } } }];
    if (supplierId) where.supplierId = Number(supplierId);
    if (unlinked) where.invoiceLinks = { none: {} };
    if (onlyDeleted) {
      where.descrizione = 'DELETED';
    } else if (!includeDeleted) {
      where.NOT = { descrizione: 'DELETED' };
    }
    if (q) {
      where.OR = [
        ...(where.OR || []),
        { numero: { contains: q, mode: 'insensitive' } },
        { supplier: { ragioneSociale: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.data = {};
      if (dateFrom) (where.data as any).gte = new Date(dateFrom);
      if (dateTo) (where.data as any).lte = new Date(dateTo);
    }

    if (format === 'csv') {
      const rows = await prisma.dDT.findMany({ where, orderBy: { createdAt: 'desc' }, include: { supplier: true } });
      const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const lines = [
        ['id', 'numero', 'data', 'supplier', 'importo', 'deleted'].map(esc).join(','),
        ...rows.map((r) => [r.id, r.numero, r.data.toISOString(), r.supplier?.ragioneSociale || '', r.importo ?? '', r.descrizione === 'DELETED' ? '1' : '0'].map(esc).join(',')),
      ].join('\n');
      return new NextResponse(lines, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="ddt.csv"' } });
    }

    const [items, total] = await Promise.all([
      prisma.dDT.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { supplier: true, documento: true, commesse: { include: { commessa: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dDT.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function POST(req: Request) {
  const g = await guard(['ADMIN', 'MANAGER', 'CONTABILE']);
  if ('error' in g) return g.error;
  try {
    const schema = z.object({
      commessaId: z.number().int().optional().nullable(),
      commessaIds: z.array(z.number().int()).optional(),
      supplierId: z.number().int(),
      numero: z.string().min(1),
      data: z.string().or(z.date()),
      descrizione: z.string().optional().nullable(),
      importo: z.number().optional().nullable(),
      documentoId: z.number().int().optional().nullable(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const { commessaId, commessaIds, supplierId, numero, data, descrizione, importo, documentoId } = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      const ddt = await tx.dDT.create({
        data: {
          commessaId: commessaId ?? null,
          supplierId: Number(supplierId),
          numero: String(numero),
          data: new Date(data as any),
          descrizione: descrizione ?? null,
          importo: importo != null ? Number(importo) : null,
          documentoId: documentoId ?? null,
        },
      });
      if (Array.isArray(commessaIds) && commessaIds.length > 0) {
        await tx.dDTCommessa.createMany({
          data: commessaIds.map((cid: number) => ({ ddtId: ddt.id, commessaId: Number(cid) })),
          skipDuplicates: true,
        });
      }
      return ddt;
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
