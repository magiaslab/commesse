import Link from 'next/link';
import { LayoutDashboard, Briefcase, Users, Factory, FileText, Kanban, Settings } from 'lucide-react';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/commesse', label: 'Commesse', icon: Briefcase },
  { href: '/clients', label: 'Clienti', icon: Users },
  { href: '/suppliers', label: 'Fornitori', icon: Factory },
  { href: '/documents', label: 'Documenti', icon: FileText },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/settings', label: 'Impostazioni', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-white/70 p-4 md:block">
      <div className="mb-6 text-lg font-semibold">Commesse</div>
      <nav className="space-y-1 text-sm">
        {links.map((l) => {
          const Icon = l.icon as any;
          return (
            <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100">
              <Icon size={18} className="text-gray-500" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
