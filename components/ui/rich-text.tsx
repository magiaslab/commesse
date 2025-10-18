'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

type RichTextProps = {
  value?: string; // HTML
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
};

// Semplice editor rich text basato su contentEditable + execCommand (compatibile senza dipendenze)
export function RichTextEditor({ value, onChange, placeholder, className }: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value != null && el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const apply = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    onChange?.(ref.current?.innerHTML || '');
  };

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap gap-1">
        <Button type="button" size="sm" variant="outline" onClick={() => apply('bold')}>B</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => apply('italic')}><em>I</em></Button>
        <Button type="button" size="sm" variant="outline" onClick={() => apply('insertUnorderedList')}>• List</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { const url = prompt('Inserisci URL'); if (url) apply('createLink', url); }}>Link</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => apply('removeFormat')}>Clear</Button>
      </div>
      <div
        ref={ref}
        className="min-h-[120px] w-full rounded-md border border-input bg-background p-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        contentEditable
        data-placeholder={placeholder || ''}
        onInput={() => onChange?.(ref.current?.innerHTML || '')}
        suppressContentEditableWarning
      />
    </div>
  );
}


