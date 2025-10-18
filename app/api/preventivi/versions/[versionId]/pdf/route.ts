import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit/js/pdfkit.standalone.js';

export async function GET(_: Request, { params }: { params: { versionId: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const id = Number(params.versionId);
  const version = await prisma.preventivoVersion.findUnique({
    where: { id },
    include: { preventivo: { include: { commessa: { include: { cliente: true } } } }, items: true },
  });
  if (!version) return new NextResponse('Not found', { status: 404 });

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));

  doc.fontSize(16).text(`Preventivo v${version.versionNumber}`, { continued: true }).fontSize(10).fillColor('#666').text(`  (${version.status})`);
  doc.moveDown(0.5);
  doc.fillColor('#000').fontSize(11).text(`Commessa: ${version.preventivo.commessa.codice} — ${version.preventivo.commessa.titolo}`);
  const cliente = version.preventivo.commessa.cliente;
  if (cliente) {
    doc.fontSize(10).fillColor('#444').text(`Cliente: ${cliente.ragioneSociale || cliente.nomeCommerciale || ''}`);
  }
  doc.moveDown();

  const startY = doc.y;
  doc.fontSize(10).fillColor('#000');
  doc.text('Categoria', 36, startY, { width: 90 });
  doc.text('Descrizione', 126, startY, { width: 250 });
  doc.text('Q.tà', 386, startY, { width: 40, align: 'right' });
  doc.text('Costo', 426, startY, { width: 60, align: 'right' });
  doc.text('Totale', 486, startY, { width: 72, align: 'right' });
  doc.moveTo(36, startY + 14).lineTo(558, startY + 14).strokeColor('#ddd').stroke();

  let y = startY + 20;
  for (const it of version.items) {
    if (y > 780) { doc.addPage(); y = 36; }
    doc.fillColor('#000').fontSize(9);
    doc.text(String(it.category || ''), 36, y, { width: 90 });
    doc.text(String(it.description || ''), 126, y, { width: 250 });
    doc.text(String(it.quantity ?? ''), 386, y, { width: 40, align: 'right' });
    doc.text((it.unitCost ?? 0).toFixed(2), 426, y, { width: 60, align: 'right' });
    doc.text((it.lineTotal ?? 0).toFixed(2), 486, y, { width: 72, align: 'right' });
    y += 16;
  }

  doc.moveDown();
  doc.fontSize(11).fillColor('#000');
  doc.text(`IVA: ${(version.vatRate || 0).toFixed(2)}%`, 36, y + 8);
  doc.text(`Totale: ${(version.totalWithTax || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`, 400, y + 8, { align: 'right' });

  doc.end();
  const pdfBuffer: Buffer = await new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(chunks))); });
  const ab = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);

  return new NextResponse(ab as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="preventivo-v${version.versionNumber}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}


