import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "local-development-wedding-admin-secret",
  pages: {
    signIn: "/admin/login"
  },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        const envEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
        const envPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
        if (envEmail && envPassword && email === envEmail && password === envPassword) {
          return { id: "env-admin", email, role: "ADMIN" };
        }

        const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
        if (user && (await bcrypt.compare(password, user.passwordHash))) {
          return { id: user.id, email: user.email, role: user.role };
        }

        return null;
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role || "ADMIN";
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = String(token.role || "ADMIN");
      }
      return session;
    }
  }
};

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" ? session : null;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
