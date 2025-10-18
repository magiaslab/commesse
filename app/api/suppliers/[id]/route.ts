import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return new NextResponse('Not found', { status: 404 });
    return NextResponse.json(supplier);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER', 'CONTABILE']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const schema = z.object({
      ragioneSociale: z.string().min(1).optional(),
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
    const updated = await prisma.supplier.update({ where: { id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    await prisma.supplier.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
