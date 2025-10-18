import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard } from '@/lib/authz';

const ALLOWED_KEYS = new Set(['REMINDER_TO', 'ALERT_DEFAULT_DAYS']);

export async function GET() {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  const rows = await prisma.appSetting.findMany();
  const data: Record<string, string> = {};
  for (const r of rows) data[r.key] = r.value;
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const g = await guard(['ADMIN']);
  if ('error' in g) return g.error;
  const payload = await req.json();
  const entries = Object.entries(payload).filter(([k]) => ALLOWED_KEYS.has(k));
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } })
    )
  );
  return new NextResponse(null, { status: 204 });
}


