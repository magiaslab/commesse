import { NextResponse } from 'next/server';
import { guard } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { versionId: string } }) {
  const g = await guard();
  if ('error' in g) return g.error;
  const id = Number(params.versionId);
  const version = await prisma.preventivoVersion.findUnique({
    where: { id },
    include: { preventivo: { include: { commessa: { include: { cliente: true } } } }, items: true },
  });
  if (!version) return new NextResponse('Not found', { status: 404 });

  // HTML semplice stampabile (può essere reso più ricco in seguito)
  const rows = version.items.map((it) => `
    <tr>
      <td style="border:1px solid #ddd;padding:4px">${it.category}</td>
      <td style="border:1px solid #ddd;padding:4px">${it.description}</td>
      <td style="border:1px solid #ddd;padding:4px;text-align:right">${it.quantity}</td>
      <td style="border:1px solid #ddd;padding:4px;text-align:right">${(it.unitCost || 0).toFixed(2)}</td>
      <td style="border:1px solid #ddd;padding:4px;text-align:right">${(it.lineTotal || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Preventivo v${version.versionNumber}</title></head>
  <body>
    <h1>Preventivo v${version.versionNumber}</h1>
    <div>Commessa ${version.preventivo.commessa.codice} – ${version.preventivo.commessa.titolo}</div>
    <div>Totale: ${(version.totalWithTax || 0).toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</div>
    <table style="border-collapse:collapse;width:100%;margin-top:12px">
      <thead>
        <tr>
          <th style="border:1px solid #ddd;padding:4px;text-align:left">Categoria</th>
          <th style="border:1px solid #ddd;padding:4px;text-align:left">Descrizione</th>
          <th style="border:1px solid #ddd;padding:4px;text-align:right">Q.tà</th>
          <th style="border:1px solid #ddd;padding:4px;text-align:right">Costo</th>
          <th style="border:1px solid #ddd;padding:4px;text-align:right">Totale</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}


