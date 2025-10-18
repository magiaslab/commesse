import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import { z } from 'zod';

export async function GET() {
  const g = await guard();
  if ('error' in g) return g.error;
  const userId = g.session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, image: true, role: true, firstName: true, lastName: true, nickname: true, address: true, phone: true, alertEmail: true, theme: true, accentColor: true } });
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  const userId = g.session.user.id;
  const schema = z.object({
    name: z.string().min(1).optional(),
    image: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    nickname: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    alertEmail: z.string().email().optional(),
    theme: z.enum(['light','dark','system']).optional(),
    accentColor: z.enum(['red','blue','green','orange','violet']).optional(),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
  const { name, image, firstName, lastName, nickname, address, phone, alertEmail, theme, accentColor } = parsed.data as any;
  const updated = await prisma.user.update({ where: { id: userId }, data: { name: name ?? undefined, image: image ?? undefined, firstName, lastName, nickname, address, phone, alertEmail, theme: theme ?? undefined, accentColor: accentColor ?? undefined } });
  return NextResponse.json({ id: updated.id, name: updated.name, image: updated.image, firstName: updated.firstName, lastName: updated.lastName, nickname: updated.nickname, address: updated.address, phone: updated.phone, alertEmail: updated.alertEmail, theme: updated.theme, accentColor: updated.accentColor });
}

