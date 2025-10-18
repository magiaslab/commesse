import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

function startOfDay(date: Date) {
  const d = new Date(date); d.setHours(0,0,0,0); return d;
}
function endOfDay(date: Date) {
  const d = new Date(date); d.setHours(23,59,59,999); return d;
}

export async function GET(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const { searchParams } = new URL(req.url);
    const monthsParam = parseInt(searchParams.get('months') || '6', 10);
    const monthsCount = Math.max(1, Math.min(24, monthsParam));

    const today = new Date();
    const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [commesseAttive, scadenzeSettimana, fattureDaPagare, documentiDaValidare] = await Promise.all([
      prisma.commessa.count(),
      prisma.scadenza.count({ where: { dateDue: { gte: startOfDay(today), lte: endOfDay(in7) } } }),
      prisma.invoice.count({ where: { statoPagamento: { not: 'pagata' } } }),
      prisma.document.count({ where: { verified: false } }),
    ]);

    const periods: { label: string; start: Date; end: Date }[] = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      periods.push({ label: d.toLocaleDateString('it-IT', { month: 'short' }), start, end });
    }
    const sums = await Promise.all(
      periods.map((p) =>
        prisma.invoice.aggregate({ _sum: { importoTotale: true }, where: { dataFattura: { gte: p.start, lte: p.end } } })
      )
    );
    const invoicesMonthly = periods.map((p, idx) => ({ label: p.label, total: Number(sums[idx]._sum.importoTotale || 0) }));

    return NextResponse.json({
      metrics: {
        commesseAttive,
        scadenzeSettimana,
        fattureDaPagare,
        documentiDaValidare,
      },
      invoicesMonthly,
    });
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}




