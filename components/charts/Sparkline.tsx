'use client';

import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export function Sparkline({ data, height = 36 }: { data: number[]; height?: number }) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="url(#spark)" fillOpacity={1} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


