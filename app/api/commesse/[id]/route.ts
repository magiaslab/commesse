import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const commessa = await prisma.commessa.findUnique({ where: { id }, include: { cliente: true } });
    if (!commessa) return new NextResponse('Not found', { status: 404 });
    return NextResponse.json(commessa);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const schema = z.object({
      codice: z.string().min(1).optional(),
      titolo: z.string().min(1).optional(),
      descrizione: z.string().optional().nullable(),
      clientId: z.number().int().optional(),
      responsabileId: z.number().int().optional().nullable(),
      budget: z.number().optional().nullable(),
      dataInizio: z.string().or(z.date()).optional().nullable(),
      dataFinePrev: z.string().or(z.date()).optional().nullable(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const d = parsed.data;
    const updated = await prisma.commessa.update({
      where: { id },
      data: {
        ...('codice' in d ? { codice: d.codice } : {}),
        ...('titolo' in d ? { titolo: d.titolo } : {}),
        ...('descrizione' in d ? { descrizione: d.descrizione ?? null } : {}),
        ...('clientId' in d ? { clientId: d.clientId } : {}),
        ...('responsabileId' in d ? { responsabileId: d.responsabileId ?? null } : {}),
        ...('budget' in d ? { budget: d.budget ?? null } : {}),
        ...('dataInizio' in d ? { dataInizio: d.dataInizio ? new Date(d.dataInizio as any) : null } : {}),
        ...('dataFinePrev' in d ? { dataFinePrev: d.dataFinePrev ? new Date(d.dataFinePrev as any) : null } : {}),
      },
    });
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
    await prisma.commessa.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
