"use client";

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KanbanProvider, KanbanBoard, KanbanHeader, KanbanCards, KanbanCard } from '@/components/ui/kanban';
import { cn } from '@/utils';

type KanbanItem = {
  id: number;
  title: string;
  descrizione?: string | null;
  stato: 'todo' | 'doing' | 'done';
};

export function CommessaKanban({ commessaId }: { commessaId: number }) {
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newState, setNewState] = useState<KanbanItem['stato']>('todo');

  const load = async () => {
    const res = await fetch(`/api/commesse/${commessaId}/kanban`, { cache: 'no-store' });
    if (!res.ok) return;
    setItems(await res.json());
  };

  useEffect(() => { load(); }, [commessaId]);

  const update = async (id: number, patch: Partial<KanbanItem>) => {
    await fetch(`/api/commesse/${commessaId}/kanban/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  };

  const create = async () => {
    if (!newTitle.trim()) return;
    await fetch(`/api/commesse/${commessaId}/kanban`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle, stato: newState }) });
    setNewTitle('');
    setNewState('todo');
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input placeholder="Nuovo task" value={newTitle} onChange={(e)=> setNewTitle(e.target.value)} className="max-w-sm" />
        <select className="h-9 rounded-md border px-2 text-sm" value={newState} onChange={(e)=> setNewState(e.target.value as any)}>
          <option value="todo">Da fare</option>
          <option value="doing">In corso</option>
          <option value="done">Fatto</option>
        </select>
        <Button onClick={create}>Aggiungi</Button>
      </div>
      {useMemo(() => {
        const columns = [
          { id: 'todo', name: 'Da fare' },
          { id: 'doing', name: 'In corso' },
          { id: 'done', name: 'Fatto' },
        ];
        const data = items.map((i) => ({ id: i.id, name: i.title, column: i.stato }));
        return (
          <KanbanProvider
            columns={columns}
            data={data as any}
            onDataChange={async (next) => {
              // rilevo cambi colonna e ordine e salvo
              setItems((prev) => prev);
              for (const card of next) {
                await update(Number(card.id), { stato: card.column as any });
              }
              load();
            }}
          >
            {(col) => (
              <KanbanBoard id={col.id} key={col.id}>
                <KanbanHeader className="flex items-center justify-between">
                  <span>{col.name}</span>
                  <span className="text-muted-foreground text-xs">{data.filter((d)=> d.column===col.id).length}</span>
                </KanbanHeader>
                <KanbanCards id={col.id}>
                  {(card) => (
                    <KanbanCard id={card.id} name={card.name} key={card.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{card.name}</span>
                        <div className="flex items-center gap-1">
                          <button className="text-xs text-destructive hover:opacity-80" onClick={async ()=>{ await fetch(`/api/commesse/${commessaId}/kanban/${card.id}`, { method: 'DELETE' }); load(); }}>✕</button>
                        </div>
                      </div>
                    </KanbanCard>
                  )}
                </KanbanCards>
              </KanbanBoard>
            )}
          </KanbanProvider>
        );
      }, [items])}
    </div>
  );
}


