'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

export function UserNav() {
  const { data } = useSession();
  const user = data?.user;
  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <span className="text-sm text-gray-700">{user.email} ({user.role})</span>
          <button
            className="rounded-md border px-3 py-1 text-sm hover:shadow"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Esci
          </button>
        </>
      ) : (
        <Link href="/signin" className="rounded-md border px-3 py-1 text-sm hover:shadow" onClick={(e) => { e.preventDefault(); signIn(); }}>
          Accedi
        </Link>
      )}
    </div>
  );
}

