import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function KPICard({ title, value, color = 'red' }: { title: string; value: string | number; color?: 'red' | 'blue' | 'green' | 'amber' }) {
  const ring = {
    red: 'ring-red-200',
    blue: 'ring-blue-200',
    green: 'ring-green-200',
    amber: 'ring-amber-200',
  }[color];
  return (
    <Card className={`ring-1 ${ring} rounded-2xl`}>
      <CardHeader>
        <CardTitle className="text-sm text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
