import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER', 'CONTABILE']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const schema = z.object({
      title: z.string().optional(),
      tipo: z.string().optional(),
      dateDue: z.string().or(z.date()).optional(),
      dateCompleted: z.string().or(z.date()).nullable().optional(),
      responsabile: z.string().nullable().optional(),
      importo: z.number().nullable().optional(),
      alertEmail: z.boolean().optional(),
      alertDaysBefore: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const d = parsed.data;
    const updated = await prisma.scadenza.update({
      where: { id },
      data: {
        ...('title' in d ? { title: d.title } : {}),
        ...('tipo' in d ? { tipo: d.tipo } : {}),
        ...('dateDue' in d ? { dateDue: d.dateDue ? new Date(d.dateDue as any) : undefined } : {}),
        ...('dateCompleted' in d ? { dateCompleted: d.dateCompleted ? new Date(d.dateCompleted as any) : null } : {}),
        ...('responsabile' in d ? { responsabile: d.responsabile ?? null } : {}),
        ...('importo' in d ? { importo: d.importo ?? null } : {}),
        ...('alertEmail' in d ? { alertEmail: d.alertEmail } : {}),
        ...('alertDaysBefore' in d ? { alertDaysBefore: d.alertDaysBefore ?? null } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}
