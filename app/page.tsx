import { SectionCards } from '@/components/section-cards';
import { InvoicesChartClient } from '@/components/charts/InvoicesChartClient';
import { RevenueVsApproved } from '@/components/charts/RevenueVsApproved';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkline } from '@/components/charts/Sparkline';
import { TrendingUp, FileText, CalendarCheck, ListChecks, Receipt } from 'lucide-react';

export default async function DashboardPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
  const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [
    scadenzeSettimana,
    fattureAperteCount,
    fattureAperteSumAgg,
    fatturatoMeseAgg,
    fatturatoMesePrevAgg,
    approvedThisMonth,
    activeBudgetsAgg,
    invoicesOnActiveAgg,
    documentiDaValidareCount,
    ddtMeseCount,
  ] = await Promise.all([
    prisma.scadenza.count({ where: { dateDue: { gte: startOfToday, lte: in7 } } }),
    prisma.invoice.count({ where: { statoPagamento: { not: 'pagata' } } }),
    prisma.invoice.aggregate({ _sum: { importoTotale: true }, where: { statoPagamento: { not: 'pagata' } } }),
    prisma.invoice.aggregate({ _sum: { importoTotale: true }, where: { dataFattura: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.invoice.aggregate({ _sum: { importoTotale: true }, where: { dataFattura: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
    prisma.preventivoVersion.count({ where: { status: 'APPROVED', approvedAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.commessa.aggregate({ _sum: { budget: true }, where: { OR: [ { dataFinePrev: null }, { dataFinePrev: { gte: startOfToday } } ] } }),
    prisma.invoice.aggregate({ _sum: { importoTotale: true }, where: {
      NOT: { statoPagamento: 'DELETED' },
      OR: [
        { commessa: { OR: [ { dataFinePrev: null }, { dataFinePrev: { gte: startOfToday } } ] } },
        { commesse: { some: { commessa: { OR: [ { dataFinePrev: null }, { dataFinePrev: { gte: startOfToday } } ] } } } },
      ]
    } }),
    prisma.document.count({ where: { verified: false } }),
    prisma.dDT.count({ where: { data: { gte: startOfMonth, lte: endOfMonth } } }),
  ]);

  const fatturatoMese = Number(fatturatoMeseAgg._sum.importoTotale || 0);
  const fatturatoMesePrev = Number(fatturatoMesePrevAgg._sum.importoTotale || 0);
  const deltaFatturato = fatturatoMesePrev ? (((fatturatoMese - fatturatoMesePrev) / fatturatoMesePrev) * 100) : 0;
  const fattureAperteSum = Number(fattureAperteSumAgg._sum.importoTotale || 0);
  const activeBudgets = Number(activeBudgetsAgg._sum.budget || 0);
  const invoicesOnActive = Number(invoicesOnActiveAgg._sum.importoTotale || 0);
  const budgetUtilizzatoPct = activeBudgets > 0 ? Math.min(100, (invoicesOnActive / activeBudgets) * 100) : 0;

  // Serie ultimi 6 mesi per il grafico
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({ label: d.toLocaleDateString('it-IT', { month: 'short' }), start, end });
  }
  const totals = await Promise.all(
    months.map((m) => prisma.invoice.aggregate({ _sum: { importoTotale: true }, where: { dataFattura: { gte: m.start, lte: m.end } } }))
  );
  const invoicesMonthly = months.map((m, idx) => ({ label: m.label, total: Number(totals[idx]._sum.importoTotale || 0) }));
  const approvedPerMonth = await Promise.all(
    months.map((m) => prisma.preventivoVersion.count({ where: { status: 'APPROVED', approvedAt: { gte: m.start, lte: m.end } } }))
  );
  const revVsApp = months.map((m, idx) => ({ label: m.label, revenue: invoicesMonthly[idx].total, approved: approvedPerMonth[idx] }));

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="relative">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <CardTitle className="text-sm">Fatturato mese</CardTitle>
            </div>
            <div className="absolute right-4 top-4 text-xs text-muted-foreground">{`${deltaFatturato >= 0 ? '+' : ''}${deltaFatturato.toFixed(1)}% vs mese prec.`}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{fatturatoMese.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</div>
            <div className="mt-1 text-xs text-muted-foreground">{`Dal ${startOfMonth.toLocaleDateString('it-IT')} al ${endOfMonth.toLocaleDateString('it-IT')}`}</div>
            <div className="mt-2"><Sparkline data={invoicesMonthly.map(p=>p.total)} /></div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/invoices">Vai alle fatture</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/documents">Documenti</Link></Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <CardTitle className="text-sm">Preventivi approvati (mese)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{approvedThisMonth}</div>
            <div className="mt-1 text-xs text-muted-foreground">Versioni approvate nel mese corrente</div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/commesse">Vai alle commesse</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/documents">PDF preventivi</Link></Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt className="h-4 w-4" />
              <CardTitle className="text-sm">Fatture aperte</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{fattureAperteCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Importo aperto: {fattureAperteSum.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</div>
            <div className="mt-2"><Sparkline data={invoicesMonthly.map(p=>p.total/1000)} /></div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/invoices?q=&statoPagamento=in_attesa">Vedi aperte</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/invoices">Tutte le fatture</Link></Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Budget utilizzato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{`${budgetUtilizzatoPct.toFixed(0)}%`}</div>
            <div className="mt-1 text-xs text-muted-foreground">Su budget attivo: {activeBudgets.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/commesse">Vai alle commesse</Link></Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarCheck className="h-4 w-4" />
              <CardTitle className="text-sm">Scadenze (7 gg)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{scadenzeSettimana}</div>
            <div className="mt-1 text-xs text-muted-foreground">Eventi in scadenza nella settimana</div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/scadenze">Vai a Scadenze</Link></Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ListChecks className="h-4 w-4" />
              <CardTitle className="text-sm">DDT del mese</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{ddtMeseCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Generati nel mese corrente</div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/ddt">Vai ai DDT</Link></Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Fatturato vs Preventivi approvati (ultimi 6 mesi)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueVsApproved data={revVsApp} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Fatturato mensile (ultimi 6 mesi)</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesChartClient data={invoicesMonthly} />
        </CardContent>
      </Card>
    </div>
  );
}
