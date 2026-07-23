import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/db";

export const authOptions: AuthOptions = {
  session: {
    // Credentials provider requires JWT sessions in NextAuth v4 (no
    // database-session support without a custom adapter workaround).
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] login attempt", { username: credentials?.username });
        if (!credentials?.username || !credentials.password) {
          console.log("[auth] missing username or password in request");
          return null;
        }

        const user = await prisma.user.findUnique({ where: { username: credentials.username } });
        console.log("[auth] user found in DB?", !!user);
        if (!user) return null;

        const valid = await compare(credentials.password, user.passwordHash);
        console.log("[auth] password compare result", valid);
        if (!valid) return null;

        return { id: user.id, name: user.username, isAdmin: user.isAdmin };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin: boolean }).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
};

/** For use in Server Components / Server Actions / Route Handlers. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("Not authorized");
  return user;
}
