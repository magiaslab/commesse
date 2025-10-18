export default function NotFound() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Commessa non trovata</h1>
      <p className="mt-2 text-sm text-gray-500">La risorsa richiesta potrebbe essere stata rimossa o l&apos;ID non è valido.</p>
      <a href="/commesse" className="mt-4 inline-block rounded-md border px-3 py-1.5 text-sm hover:shadow">Torna all&apos;elenco</a>
    </main>
  );
}


