import { prisma } from './prisma';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions, DefaultSession } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      role?: 'ADMIN' | 'MANAGER' | 'CONTABILE' | 'OPERATORE';
    } & DefaultSession['user'];
  }
  interface User {
    id: number;
    role?: 'ADMIN' | 'MANAGER' | 'CONTABILE' | 'OPERATORE';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: number | string;
    role?: 'ADMIN' | 'MANAGER' | 'CONTABILE' | 'OPERATORE';
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return { id: String(user.id), email: user.email, name: user.name ?? undefined, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? 'OPERATORE';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = Number(token.id) || 0;
        session.user.role = (token.role as any) ?? 'OPERATORE';
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = () => getServerSession(authOptions);
