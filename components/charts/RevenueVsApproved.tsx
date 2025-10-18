'use client';

import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid, Bar, Line } from 'recharts';

export type RevenueVsApprovedPoint = { label: string; revenue: number; approved: number };

export function RevenueVsApproved({ data }: { data: RevenueVsApprovedPoint[] }) {
  return (
    <div className="h-72 w-full rounded-md border p-2">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="fillPrimaryBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="left" tickFormatter={(v)=> Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v))} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value: any, name: any) => name === 'revenue' ? Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value)) : value} />
          <Bar yAxisId="left" dataKey="revenue" fill="url(#fillPrimaryBar)" />
          <Line yAxisId="right" type="monotone" dataKey="approved" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}


