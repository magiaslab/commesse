import { headers } from 'next/headers';
import { DocumentsClient } from '@/components/documents/DocumentsClient';

export default async function DocumentsPage() {
  const h = headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookie = h.get('cookie') || '';
  const res = await fetch(`${base}/api/documents?page=1&pageSize=10`, { headers: { cookie }, cache: 'no-store' });
  const initial = res.ok ? await res.json() : { items: [], total: 0, page: 1, pageSize: 10 };
  return <DocumentsClient initial={initial} />;
}
