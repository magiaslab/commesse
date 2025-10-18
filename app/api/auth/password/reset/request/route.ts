import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

const RequestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = RequestSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Rispondiamo sempre 200 per non rivelare esistenza utente
    if (!user) return NextResponse.json({ ok: true });

    const ttlMin = Number(process.env.RESET_TOKEN_TTL_MINUTES || '60');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    try {
      await sendPasswordResetEmail({ to: user.email, token });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', issues: e.issues }, { status: 400 });
    }
    return new NextResponse('Errore', { status: 500 });
  }
}





