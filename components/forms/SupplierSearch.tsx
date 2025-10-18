"use client";

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

type Supplier = {
  id: number;
  ragioneSociale: string;
  partitaIva?: string | null;
};

export function SupplierSearch({
  value,
  onChange,
  placeholder = 'Cerca fornitore…',
  className,
}: {
  value?: number | '';
  onChange: (id: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suppliers?q=${encodeURIComponent(query)}&pageSize=10`, { cache: 'no-store', credentials: 'include' });
        const json = await res.json();
        const items: Supplier[] = Array.isArray(json) ? json : (json.items || []);
        setOptions(items);
        setOpen(true);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    async function loadLabel(id: number) {
      try {
        const res = await fetch(`/api/suppliers/${id}`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return;
        const sup = await res.json();
        setLabel(sup?.ragioneSociale || String(id));
        setQuery('');
      } catch {}
    }
    if (value && typeof value === 'number') loadLabel(value);
  }, [value]);

  return (
    <div className={`relative ${className || ''}`} ref={boxRef}>
      <Input
        value={query || label}
        onChange={(e) => { setQuery(e.target.value); setLabel(''); }}
        onFocus={() => { if (options.length > 0) setOpen(true); }}
        placeholder={placeholder}
      />
      {open && options.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
              onClick={() => { onChange(opt.id); setLabel(opt.ragioneSociale); setQuery(''); setOpen(false); }}
            >
              <span>{opt.ragioneSociale}</span>
              {opt.partitaIva ? <span className="ml-3 text-xs text-muted-foreground">{opt.partitaIva}</span> : null}
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Nessun risultato</div>
          )}
        </div>
      )}
    </div>
  );
}


