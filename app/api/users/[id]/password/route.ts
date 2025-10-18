import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';
import bcrypt from 'bcryptjs';
import { sendEmailViaResend } from '@/lib/email';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return new NextResponse('Utente non trovato', { status: 404 });

    const temp = Math.random().toString(36).slice(-10);
    const hashed = await bcrypt.hash(temp, 10);
    await prisma.user.update({ where: { id }, data: { password: hashed } });

    try {
      const html = `
        <div style="font-family:system-ui,sans-serif">
          <h2>Password reimpostata</h2>
          <p>Ciao ${user.firstName || user.name || ''}, la tua password è stata reimpostata da un amministratore.</p>
          <p>Password temporanea: <strong>${temp}</strong></p>
          <p>Accedi e cambiala dalla sezione Profilo.</p>
        </div>`;
      await sendEmailViaResend({ to: user.email, subject: 'Password temporanea', html });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}






