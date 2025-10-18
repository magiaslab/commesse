'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut, useSession } from 'next-auth/react';

export function UserDropdown() {
  const { data } = useSession();
  const email = data?.user?.email || 'user@dominio.it';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src="" alt={email} />
            <AvatarFallback>{email[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm text-gray-700 md:inline">{email}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => (window.location.href = '/profile')}>Profilo</DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

