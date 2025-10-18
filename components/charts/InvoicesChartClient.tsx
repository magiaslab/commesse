'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';

export type InvoicesMonthlyPoint = { label: string; total: number };

export function InvoicesChartClient({ data }: { data: InvoicesMonthlyPoint[] }) {
  return (
    <div className="h-64 w-full rounded-md border p-2">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis tickFormatter={(v)=> Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v))} />
          <Tooltip formatter={(v: any) => Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(v))} />
          <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#fillPrimary)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}











