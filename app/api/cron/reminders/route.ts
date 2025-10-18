import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmailViaResend, renderScadenzaReminderEmail } from '@/lib/email';

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 giorni

    const scadenze = await prisma.scadenza.findMany({
      where: {
        alertEmail: true,
        dateCompleted: null,
        dateDue: { lte: soon, gte: now },
      },
      include: { commessa: true },
    });

    let sent = 0;
    for (const s of scadenze) {
      const html = renderScadenzaReminderEmail({
        title: s.title,
        commessaCodice: s.commessa?.codice,
        commessaTitolo: s.commessa?.titolo,
        dateDue: s.dateDue,
        importo: s.importo ?? undefined,
      });
      // preferisci valore da AppSetting se presente
      const appSetting = await prisma.appSetting.findUnique({ where: { key: 'REMINDER_TO' } });
      const to = appSetting?.value || process.env.REMINDER_TO || process.env.RESEND_FROM || '';
      if (!to) continue;
      await sendEmailViaResend({ to, subject: `Promemoria scadenza: ${s.title}`, html });
      sent++;
    }
    return NextResponse.json({ processed: scadenze.length, sent });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}


