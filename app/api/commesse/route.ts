import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function GET(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const clientId = searchParams.get('clientId');

    const where: any = {};
    if (clientId) where.clientId = Number(clientId);
    if (q) {
      where.OR = [
        { codice: { contains: q, mode: 'insensitive' } },
        { titolo: { contains: q, mode: 'insensitive' } },
        { cliente: { ragioneSociale: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.commessa.count({ where }),
      prisma.commessa.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { cliente: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ items, page, pageSize, total });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function POST(req: Request) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const schema = z.object({
      codice: z.string().min(1),
      titolo: z.string().min(1),
      descrizione: z.string().optional().nullable(),
      clientId: z.number().int(),
      responsabileId: z.number().int().optional().nullable(),
      budget: z.number().optional().nullable(),
      dataInizio: z.string().or(z.date()).optional().nullable(),
      dataFinePrev: z.string().or(z.date()).optional().nullable(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const d = parsed.data;
    const created = await prisma.commessa.create({
      data: {
        codice: d.codice,
        titolo: d.titolo,
        descrizione: d.descrizione ?? null,
        clientId: d.clientId,
        responsabileId: d.responsabileId ?? null,
        budget: d.budget ?? null,
        dataInizio: d.dataInizio ? new Date(d.dataInizio as any) : null,
        dataFinePrev: d.dataFinePrev ? new Date(d.dataFinePrev as any) : null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
