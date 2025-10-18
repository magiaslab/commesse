"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function TableToolbar({
  query,
  onQueryChange,
  pageSize,
  onPageSizeChange,
  exportHref,
  rightSlot,
  placeholder = "Cerca...",
  info,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  exportHref?: string;
  rightSlot?: React.ReactNode;
  placeholder?: string;
  info?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center gap-2">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-9 w-full max-w-md"
        />
        <Select value={`${pageSize}`} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-[110px]"><SelectValue placeholder="Per pagina" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        {info ? <div className="hidden sm:block text-sm text-muted-foreground px-2">{info}</div> : null}
        {exportHref ? (
          <Button asChild variant="outline">
            <a href={exportHref} target="_blank" rel="noreferrer">Esporta CSV</a>
          </Button>
        ) : null}
      </div>
      {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
    </div>
  );
}
