import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';

export async function GET(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const { searchParams } = new URL(req.url);
    const commessaId = searchParams.get('commessaId');
    const supplierId = searchParams.get('supplierId');
    const q = searchParams.get('q') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '10')));
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const responsabile = searchParams.get('responsabile');
    const onlyCompleted = searchParams.get('onlyCompleted') === 'true';
    const format = searchParams.get('format');

    const where: any = {};
    if (commessaId) where.commessaId = Number(commessaId);
    if (supplierId) where.supplierId = Number(supplierId);
    if (q) where.title = { contains: q, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      where.dateDue = {};
      if (dateFrom) where.dateDue.gte = new Date(dateFrom);
      if (dateTo) where.dateDue.lte = new Date(dateTo);
    }
    if (responsabile && responsabile !== 'all') where.responsabile = responsabile;
    if (onlyCompleted) where.dateCompleted = { not: null };

    if (format === 'csv') {
      const rows = await prisma.scadenza.findMany({ where, orderBy: { dateDue: 'asc' } });
      const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const lines = [
        ['id','commessaId','title','tipo','dateDue','dateCompleted','responsabile','importo'].map(esc).join(','),
        ...rows.map(r => [r.id, r.commessaId ?? '', r.title, r.tipo, r.dateDue.toISOString(), r.dateCompleted ? r.dateCompleted.toISOString() : '', r.responsabile ?? '', r.importo ?? ''].map(esc).join(','))
      ].join('\n');
      return new NextResponse(lines, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="scadenze.csv"' } });
    }

    const [items, total] = await Promise.all([
      prisma.scadenza.findMany({ where, orderBy: { dateDue: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.scadenza.count({ where }),
    ]);

    // Enrich with supplier and document info to avoid N+1 calls from client
    const supplierIds = Array.from(new Set(items.map((i) => i.supplierId).filter((v): v is number => !!v)));
    const docIds = Array.from(new Set(items.map((i) => i.documentRefId).filter((v): v is number => !!v)));
    const [suppliers, documents] = await Promise.all([
      supplierIds.length ? prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, ragioneSociale: true } }) : Promise.resolve([] as any[]),
      docIds.length ? prisma.document.findMany({ where: { id: { in: docIds } }, select: { id: true, s3Key: true, filenameOriginal: true, mimetype: true } }) : Promise.resolve([] as any[]),
    ]);
    const supplierById = new Map(suppliers.map((s) => [s.id, s] as const));
    const documentById = new Map(documents.map((d) => [d.id, d] as const));
    const enriched = items.map((r) => ({
      ...r,
      supplier: r.supplierId ? supplierById.get(r.supplierId) || null : null,
      document: r.documentRefId ? (() => {
        const d = documentById.get(r.documentRefId!);
        return d ? { ...d, url: `/api/files/${encodeURIComponent(d.s3Key)}` } : null;
      })() : null,
    }));
    return NextResponse.json({ items: enriched, total, page, pageSize });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function POST(req: Request) {
  const g = await guard(['ADMIN', 'MANAGER', 'CONTABILE']);
  if ('error' in g) return g.error;
  try {
    const body = await req.json();
    const created = await prisma.scadenza.create({ data: {
      commessaId: Number(body.commessaId || 0),
      title: String(body.title || ''),
      tipo: String(body.tipo || 'generica'),
      dateDue: new Date(body.dateDue),
      responsabile: body.responsabile || null,
      importo: body.importo != null ? Number(body.importo) : null,
      supplierId: body.supplierId != null ? Number(body.supplierId) : null,
      invoiceId: body.invoiceId != null ? Number(body.invoiceId) : null,
      alertEmail: body.alertEmail != null ? Boolean(body.alertEmail) : true,
      alertDaysBefore: body.alertDaysBefore || '[30,15,7]',
    } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function PUT(req: Request) {
  const g = await guard(['ADMIN', 'MANAGER', 'CONTABILE']);
  if ('error' in g) return g.error;
  try {
    const body = await req.json();
    const id = Number(body.id);
    const updated = await prisma.scadenza.update({ where: { id }, data: {
      title: body.title,
      tipo: body.tipo,
      dateDue: body.dateDue ? new Date(body.dateDue) : undefined,
      responsabile: body.responsabile,
      importo: body.importo != null ? Number(body.importo) : undefined,
      alertEmail: body.alertEmail,
      alertDaysBefore: body.alertDaysBefore,
    } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const g = await guard(['ADMIN', 'MANAGER', 'CONTABILE']);
  if ('error' in g) return g.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    await prisma.scadenza.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
