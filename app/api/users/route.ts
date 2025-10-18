import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import { z } from 'zod';
import { sendEmailViaResend } from '@/lib/email';

export async function GET(req: Request) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'name' | 'email' | 'role';
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortDir } as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          firstName: true,
          lastName: true,
          nickname: true,
          phone: true,
          alertEmail: true,
          createdAt: true,
        },
      }),
    ]);
    return NextResponse.json({ items, page, pageSize, total, sortBy, sortDir });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function POST(req: Request) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  try {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().optional(),
      role: z.enum(['ADMIN', 'MANAGER', 'CONTABILE', 'OPERATORE']).optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      nickname: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      alertEmail: z.string().email().optional(),
      invite: z.boolean().optional(),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    const { invite, ...data } = parsed.data as any;
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { ...data },
      create: { ...data, role: (data.role as any) || 'OPERATORE' },
    });

    if (invite) {
      try {
        const html = `
          <div style="font-family:system-ui,sans-serif">
            <h2>Invito di accesso</h2>
            <p>Ciao ${user.firstName || user.name || ''}, sei stato invitato sulla piattaforma.</p>
            <p>Accedi con l'email ${user.email} dalla pagina di login.</p>
          </div>`;
        await sendEmailViaResend({ to: user.email, subject: 'Invito piattaforma', html });
      } catch (e) {
        // ignora errori email ma restituisci comunque il 201
      }
    }

    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}


