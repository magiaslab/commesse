import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { ddtLinks: { include: { ddt: true } }, supplier: true, commesse: { include: { commessa: true } } } });
    if (!invoice) return new NextResponse('Not found', { status: 404 });
    return NextResponse.json(invoice);
  } catch (e: any) {
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    // Soft delete: marca statoPagamento=DELETED
    const updated = await prisma.invoice.update({ where: { id }, data: { statoPagamento: 'DELETED' } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return new NextResponse('Not found', { status: 404 });
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  // restore
  const g = await guard(['ADMIN', 'MANAGER']);
  if ('error' in g) return g.error;
  try {
    const id = Number(params.id);
    const updated = await prisma.invoice.update({ where: { id }, data: { statoPagamento: 'da_pagare' } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return new NextResponse('Not found', { status: 404 });
    return new NextResponse(e.message || 'Errore', { status: 500 });
  }
}




