import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function POST(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const schema = z.object({
      tipo: z.string().min(1),
      filenameOriginal: z.string().min(1),
      s3Key: z.string().min(1),
      mimetype: z.string().min(1),
      sizeBytes: z.number().int().positive(),
      commessaId: z.number().int().optional().nullable(),
      clientId: z.number().int().optional().nullable(),
      supplierId: z.number().int().optional().nullable(),
      createScadenza: z
        .object({
          kind: z.enum(['ECONOMICA', 'CONSEGNA']),
          dateDue: z.string().min(1),
          importo: z.number().optional(),
          supplierId: z.number().optional(),
          title: z.string().optional(),
        })
        .optional(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const { tipo, filenameOriginal, s3Key, mimetype, sizeBytes, commessaId, clientId, supplierId, createScadenza } = parsed.data as any;
    const created = await prisma.document.create({
      data: {
        tipo,
        filenameOriginal,
        s3Key,
        mimetype,
        sizeBytes,
        commessaId: commessaId ?? null,
        clientId: clientId ?? null,
        supplierId: supplierId ?? null,
      },
    });
    if (createScadenza && commessaId) {
      const dateDue = new Date(createScadenza.dateDue);
      await prisma.scadenza.create({
        data: {
          commessaId: commessaId,
          title: createScadenza.title || (createScadenza.kind === 'ECONOMICA' ? `Scadenza economica` : `Consegna`),
          tipo: createScadenza.kind,
          dateDue,
          importo: createScadenza.importo ?? null,
          supplierId: createScadenza.supplierId ?? supplierId ?? null,
          documentRefId: created.id,
        },
      });
    }
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function GET(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const { searchParams } = new URL(req.url);
    const commessaId = searchParams.get('commessaId');
    const supplierId = searchParams.get('supplierId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true';
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const format = searchParams.get('format');

    const where: any = {};
    if (commessaId) where.commessaId = Number(commessaId);
    if (supplierId) where.supplierId = Number(supplierId);
    if (onlyDeleted) {
      where.notes = 'DELETED';
    } else if (!includeDeleted) {
      where.NOT = { notes: 'DELETED' };
    }
    if (q) {
      where.OR = [
        { tipo: { contains: q, mode: 'insensitive' } },
        { filenameOriginal: { contains: q, mode: 'insensitive' } },
        { s3Key: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (format === 'csv') {
      const items = await prisma.document.findMany({
        where,
        include: { commessa: { select: { codice: true, titolo: true } } },
        orderBy: { uploadedAt: 'desc' },
      });
      const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const lines = [
        ['id', 'tipo', 'filename', 'commessa', 'uploadedAt', 'deleted'].map(esc).join(','),
        ...items.map((d) => [
          d.id,
          d.tipo,
          d.filenameOriginal,
          d.commessa ? `${d.commessa.codice} - ${d.commessa.titolo}` : '',
          d.uploadedAt.toISOString(),
          d.notes === 'DELETED' ? '1' : '0',
        ].map(esc).join(',')),
      ].join('\n');
      return new NextResponse(lines, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="documents.csv"',
          'Cache-Control': 'no-store',
        },
      });
    }

    const [total, items] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        include: { commessa: { select: { codice: true, titolo: true } } },
        orderBy: { uploadedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return NextResponse.json({ items, page, pageSize, total }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
