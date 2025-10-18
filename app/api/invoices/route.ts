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
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true';
    const format = searchParams.get('format');

    const q = searchParams.get('q') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '10')));
    const statoPagamento = searchParams.get('statoPagamento') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (commessaId)
      where.OR = [
        { commessaId: Number(commessaId) },
        { commesse: { some: { commessaId: Number(commessaId) } } },
      ];
    if (supplierId) where.supplierId = Number(supplierId);
    if (onlyDeleted) {
      where.statoPagamento = 'DELETED';
    } else if (!includeDeleted) {
      where.NOT = { statoPagamento: 'DELETED' };
    }
    if (q) {
      where.OR = [
        ...(where.OR || []),
        { numero: { contains: q, mode: 'insensitive' } },
        { supplier: { ragioneSociale: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (statoPagamento) where.statoPagamento = statoPagamento;
    if (dateFrom || dateTo) {
      where.dataFattura = {};
      if (dateFrom) (where.dataFattura as any).gte = new Date(dateFrom);
      if (dateTo) (where.dataFattura as any).lte = new Date(dateTo);
    }

    if (format === 'csv') {
      const rows = await prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, include: { supplier: true } });
      const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const lines = [
        ['id', 'numero', 'dataFattura', 'fornitore', 'importoTotale', 'stato', 'deleted'].map(esc).join(','),
        ...rows.map((r) => [r.id, r.numero, r.dataFattura.toISOString(), r.supplier?.ragioneSociale || '', r.importoTotale, r.statoPagamento, r.statoPagamento === 'DELETED' ? '1' : '0'].map(esc).join(',')),
      ].join('\n');
      return new NextResponse(lines, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="invoices.csv"' } });
    }

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { ddtLinks: { include: { ddt: true } }, supplier: true, commesse: { include: { commessa: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
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
      dataFattura: z.string().or(z.date()),
      importoTotale: z.number(),
      dataScadenza: z.string().or(z.date()).optional(),
      documentoId: z.number().int().optional().nullable(),
      ddtIds: z.array(z.number().int()).optional(),
      payments: z
        .array(z.object({ dateDue: z.string().or(z.date()), importo: z.number() }))
        .optional(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    }
    const {
      commessaId,
      commessaIds,
      supplierId,
      numero,
      dataFattura,
      importoTotale,
      dataScadenza,
      documentoId,
      ddtIds,
      payments,
    } = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          commessaId: commessaId ?? null,
          supplierId: Number(supplierId),
          numero: String(numero),
          dataFattura: new Date(dataFattura as any),
          importoTotale: Number(importoTotale),
          dataScadenza: dataScadenza ? new Date(dataScadenza as any) : new Date(dataFattura as any),
          documentoId: documentoId ?? null,
        },
      });

      if (Array.isArray(ddtIds) && ddtIds.length > 0) {
        await tx.invoiceDDT.createMany({
          data: ddtIds.map((ddtId: number) => ({ invoiceId: invoice.id, ddtId: Number(ddtId) })),
          skipDuplicates: true,
        });
      }

      if (Array.isArray(commessaIds) && commessaIds.length > 0) {
        await tx.invoiceCommessa.createMany({
          data: commessaIds.map((cid: number) => ({ invoiceId: invoice.id, commessaId: Number(cid) })),
          skipDuplicates: true,
        });
      }

      if (Array.isArray(payments) && payments.length > 0) {
        await tx.scadenza.createMany({
          data: payments.map((p) => ({
            commessaId: invoice.commessaId ?? (Array.isArray(commessaIds) && commessaIds[0] ? Number(commessaIds[0]) : (commessaId ?? 0)),
            title: `Pagamento fattura ${invoice.numero}`,
            tipo: 'fattura',
            dateDue: new Date(p.dateDue as any),
            importo: Number(p.importo),
            supplierId: invoice.supplierId,
            invoiceId: invoice.id,
            alertEmail: true,
            alertDaysBefore: '[30,15,7]',
          })),
          skipDuplicates: true,
        });
      } else if (invoice.dataScadenza) {
        await tx.scadenza.create({
          data: {
            commessaId: invoice.commessaId ?? (commessaId ?? 0),
            title: `Pagamento fattura ${invoice.numero}`,
            tipo: 'fattura',
            dateDue: invoice.dataScadenza,
            importo: invoice.importoTotale,
            supplierId: invoice.supplierId,
            invoiceId: invoice.id,
            alertEmail: true,
            alertDaysBefore: '[30,15,7]',
          },
        });
      }

      return invoice;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
