import { prisma } from '@/lib/prisma';

export default async function PrintPreventivoVersionPage({ params }: { params: { versionId: string } }) {
  const id = Number(params.versionId);
  const version = await prisma.preventivoVersion.findUnique({
    where: { id },
    include: { preventivo: { include: { commessa: { include: { cliente: true } } } }, items: true },
  });
  if (!version) return <div className="p-6">Versione non trovata</div>;

  const cliente = version.preventivo.commessa.cliente;

  return (
    <div className="mx-auto max-w-3xl p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Preventivo v{version.versionNumber}</h1>
          <div className="text-sm text-muted-foreground">Commessa {version.preventivo.commessa.codice} – {version.preventivo.commessa.titolo}</div>
        </div>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => window.print()}>Stampa</button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium">Cliente</div>
          <div>{cliente?.ragioneSociale || cliente?.nomeCommerciale}</div>
          <div>{cliente?.indirizzo}</div>
          <div>{cliente?.cap} {cliente?.comune} ({cliente?.provincia})</div>
          <div>P.IVA {cliente?.partitaIva || '-'} CF {cliente?.codiceFiscale || '-'}</div>
        </div>
        <div>
          <div className="font-medium">Dati versione</div>
          <div>Stato: {version.status}</div>
          <div>IVA: {version.vatRate?.toFixed(2)}%</div>
          <div>Totale: {version.totalWithTax?.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</div>
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1 text-left">Categoria</th>
            <th className="border px-2 py-1 text-left">Descrizione</th>
            <th className="border px-2 py-1 text-right">Q.tà</th>
            <th className="border px-2 py-1 text-right">Costo</th>
            <th className="border px-2 py-1 text-right">Totale</th>
          </tr>
        </thead>
        <tbody>
          {version.items.map((it) => (
            <tr key={it.id}>
              <td className="border px-2 py-1">{it.category}</td>
              <td className="border px-2 py-1">{it.description}</td>
              <td className="border px-2 py-1 text-right">{it.quantity}</td>
              <td className="border px-2 py-1 text-right">{(it.unitCost || 0).toFixed(2)}</td>
              <td className="border px-2 py-1 text-right">{(it.lineTotal || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





