import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const schema = z.object({
      name: z.string().optional(),
      role: z.enum(['ADMIN', 'MANAGER', 'CONTABILE', 'OPERATORE']).optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      nickname: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      alertEmail: z.string().email().optional(),
      image: z.string().optional(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const updated = await prisma.user.update({ where: { id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    await prisma.user.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}






