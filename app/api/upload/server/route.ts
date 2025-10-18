import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { S3_BUCKET, s3 } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: Request) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    if (!S3_BUCKET) return NextResponse.json({ error: 'Missing S3_BUCKET' }, { status: 500 });
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const key = String(form.get('key') || '');
    const contentType = String(form.get('contentType') || (file ? file.type : '') || 'application/octet-stream');
    if (!file || !key) return NextResponse.json({ error: 'file and key required' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
    return NextResponse.json({ key }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Errore' }, { status: 500 });
  }
}


