import { cn } from '../../utils/cn';

export function Alert({ title, description, className }: { title: string; description?: string; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800', className)}>
      <div className="mt-0.5 font-medium">{title}</div>
      {description && <div className="text-red-700 opacity-90">{description}</div>}
    </div>
  );
}

