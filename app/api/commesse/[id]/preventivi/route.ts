import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const commessaId = Number(params.id);
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
  const sortBy = (searchParams.get('sortBy') || 'stato') as 'stato' | 'createdAt' | 'id';
  const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

  const where: any = { commessaId };
  if (q) {
    where.OR = [
      { note: { contains: q, mode: 'insensitive' } },
      { versions: { some: { changeNote: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  // Ordinamento
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'id') orderBy = { id: sortDir };
  if (sortBy === 'createdAt') orderBy = { createdAt: sortDir };

  // Caso speciale: stato approvazione prima
  // Prisma non supporta direttamente ORDER BY CASE; usiamo sort manuale lato app dopo fetch limitato.
  // Per minimizzare, manteniamo orderBy base e poi riordiniamo se richiesto.

  const [total, rawItems] = await Promise.all([
    prisma.preventivo.count({ where }),
    prisma.preventivo.findMany({
      where,
      include: {
        currentApprovedVersion: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  let items = rawItems;
  if (sortBy === 'stato') {
    const weight = (p: any) => (p.currentApprovedVersion ? 1 : 0);
    items = [...rawItems].sort((a, b) => (weight(b) - weight(a)) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }
  return NextResponse.json({ items, page, pageSize, total });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  const commessaId = Number(params.id);
  let body: any = {};
  try {
    // Consenti chiamate senza body
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const created = await prisma.preventivo.create({
    data: {
      commessaId,
      currency: body.currency || 'EUR',
      note: body.note || null,
      versions: { create: { versionNumber: 1 } },
    },
    include: { versions: true },
  });
  return NextResponse.json(created, { status: 201 });
}


