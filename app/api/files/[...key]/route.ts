import { GetObjectCommand } from '@aws-sdk/client-s3';
import { S3_BUCKET, s3 } from '@/lib/s3';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { guard } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { key: string[] } }) {
  try {
    const g = await guard();
    if ('error' in g) return g.error;
    if (!S3_BUCKET) return NextResponse.json({ error: 'Missing S3_BUCKET' }, { status: 500 });
    const key = decodeURIComponent((params.key || []).join('/'));
    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    // Se è un avatar (salvato su User.image) non esiste un record in Document: consenti
    if (!key.startsWith('avatars/')) {
      // Per altri file richiedi presenza nel catalogo Document
      const doc = await prisma.document.findFirst({ where: { s3Key: key } });
      if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    const obj = await s3.send(cmd);
    const body = obj.Body as unknown as Readable;
    const webStream = (Readable as any).toWeb ? (Readable as any).toWeb(body) : (body as any);

    const headers = new Headers();
    headers.set('Content-Type', obj.ContentType || 'application/octet-stream');
    if (obj.ContentLength != null) headers.set('Content-Length', String(obj.ContentLength));
    if (obj.ETag) headers.set('ETag', obj.ETag);
    headers.set('Cache-Control', 'private, max-age=0, must-revalidate');

    return new Response(webStream as any, { status: 200, headers });
  } catch (e: any) {
    if (e?.$metadata?.httpStatusCode === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: e?.message || 'Errore' }, { status: 500 });
  }
}

