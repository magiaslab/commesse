import { NextResponse } from 'next/server';
import { getServerAuthSession } from './auth';

export type Role = 'ADMIN' | 'MANAGER' | 'CONTABILE' | 'OPERATORE';

export async function guard(allowedRoles?: Role[]) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    return { error: new NextResponse('Unauthorized', { status: 401 }) } as const;
  }
  const userRole = (session.user.role || 'OPERATORE') as Role;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return { error: new NextResponse('Forbidden', { status: 403 }) } as const;
  }
  return { session } as const;
}

