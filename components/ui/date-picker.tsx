'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
};

export function DatePicker(props: DatePickerProps) {
  const { value, onChange, placeholder, min, max, className, disabled } = props;
  return (
    <div className={`relative ${className || ''}`}>
      <input
        type="date"
        className="h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-3 pr-9 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || ''}
        min={min}
        max={max}
        disabled={disabled}
      />
      <CalendarIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}


