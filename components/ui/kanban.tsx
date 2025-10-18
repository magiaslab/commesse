'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { DndContext, useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor, DragEndEvent, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { cn } from '@/components/lib/utils';

export type KanbanItem = { id: string | number; name: string; column: string } & Record<string, any>;
export type KanbanColumn = { id: string; name: string } & Record<string, any>;

type Ctx = { columns: KanbanColumn[]; data: KanbanItem[] };
const KanbanCtx = createContext<Ctx>({ columns: [], data: [] });

export function KanbanProvider({ columns, data, onDataChange, children }: { columns: KanbanColumn[]; data: KanbanItem[]; onDataChange?: (d: KanbanItem[]) => void; children: (column: KanbanColumn) => ReactNode }) {
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

  function onDragEnd(ev: DragEndEvent) {
    const { active, over } = ev;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    const list = [...data];
    const oldIndex = list.findIndex((i) => String(i.id) === String(activeId));
    if (oldIndex < 0) return;
    const overItem = list.find((i) => String(i.id) === String(overId));
    const overColumn = overItem ? overItem.column : String(overId);
    list[oldIndex] = { ...list[oldIndex], column: overColumn };
    // reorder within column
    const same = list.filter((i) => i.column === overColumn);
    const newIndex = same.findIndex((i) => String(i.id) === String(overId));
    const indices = list.map((it, idx) => ({ it, idx })).filter((x) => x.it.column === overColumn).map((x) => x.idx);
    const targetIdx = newIndex >= 0 && newIndex < indices.length ? indices[newIndex] : indices[indices.length - 1];
    const moved = arrayMove(list, oldIndex, targetIdx);
    onDataChange?.(moved);
  }

  return (
    <KanbanCtx.Provider value={{ columns, data }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid auto-cols-fr grid-flow-col gap-4">
          {columns.map((col) => children(col))}
        </div>
      </DndContext>
    </KanbanCtx.Provider>
  );
}

export function KanbanBoard({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn('flex min-h-40 flex-col overflow-hidden rounded-md border bg-secondary text-xs ring-2 transition-all', isOver ? 'ring-primary' : 'ring-transparent', className)}>
      {children}
    </div>
  );
}

export function KanbanHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('m-0 p-2 font-semibold text-sm', props.className)} />;
}

export function KanbanCards({ id, children, className }: { id: string; children: (item: KanbanItem) => ReactNode; className?: string }) {
  const { data } = useContext(KanbanCtx);
  const items = useMemo(() => data.filter((d) => d.column === id), [data, id]);
  const ids = items.map((i) => i.id);
  return (
    <SortableContext items={ids}>
      <div className={cn('flex flex-col gap-2 p-2', className)}>{items.map(children)}</div>
    </SortableContext>
  );
}

export function KanbanCard({ id, name, children, className }: { id: string | number; name: string; children?: ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition } as any;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={cn('cursor-grab rounded-md p-3 shadow-sm', isDragging && 'pointer-events-none opacity-40', className)}>{children ?? <p className="m-0 text-sm font-medium">{name}</p>}</Card>
    </div>
  );
}


