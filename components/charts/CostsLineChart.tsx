'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

const data = [
  { month: 'Gen', cost: 1200 },
  { month: 'Feb', cost: 980 },
  { month: 'Mar', cost: 1480 },
  { month: 'Apr', cost: 700 },
  { month: 'Mag', cost: 1660 },
  { month: 'Giu', cost: 1230 },
];

export function CostsLineChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

