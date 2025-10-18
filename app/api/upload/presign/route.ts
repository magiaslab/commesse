import { S3_BUCKET, s3 } from '@/lib/s3';
import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: Request) {
  try {
    const { key, contentType } = await req.json();
    if (!S3_BUCKET) return NextResponse.json({ error: 'Missing S3_BUCKET' }, { status: 500 });
    if (!key || !contentType) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const command = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 min

    return NextResponse.json({ url, key });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Errore' }, { status: 500 });
  }
}
