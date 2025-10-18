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
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'id'|'ragioneSociale'|'email'|'createdAt';
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc'|'desc';

    const where: any = {};
    if (q) where.OR = [
      { ragioneSociale: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];

    const [total, items] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({ where, orderBy: { [sortBy]: sortDir }, skip: (page - 1) * pageSize, take: pageSize }),
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
      ragioneSociale: z.string().min(1),
      nomeCommerciale: z.string().optional().nullable(),
      partitaIva: z.string().optional().nullable(),
      codiceFiscale: z.string().optional().nullable(),
      indirizzo: z.string().optional().nullable(),
      cap: z.string().optional().nullable(),
      comune: z.string().optional().nullable(),
      provincia: z.string().optional().nullable(),
      pec: z.string().optional().nullable(),
      codiceDestinatario: z.string().optional().nullable(),
      referente: z.string().optional().nullable(),
      telefono: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      iban: z.string().optional().nullable(),
      bic: z.string().optional().nullable(),
      codiceAteco: z.string().optional().nullable(),
      modalitaPagamento: z.string().optional().nullable(),
      giorniPagamento: z.number().int().optional().nullable(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const created = await prisma.supplier.create({ data: parsed.data });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
