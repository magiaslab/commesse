import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PUT(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const { currentPassword, newPassword } = parsed.data;
    const userId = g.session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return new NextResponse('Utente non trovato', { status: 404 });
    if (!user.password) return new NextResponse('Account senza password locale', { status: 400 });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return new NextResponse('Password corrente errata', { status: 401 });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}






