import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { getPrismaClient } from "./db";
import { ApiError } from "./api-errors";
import { getAdminCredentialsError } from "./admin-credentials";

const production = process.env.NODE_ENV === "production";
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret,
  useSecureCookies: production,
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
        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") return null;
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        if (!email || !password) return null;

        if (production && (!secret || secret.trim().length < 32)) {
          console.error("[admin-auth] Set AUTH_SECRET to a random secret of at least 32 characters in the deployment environment.");
          return null;
        }
        const envEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
        const envPassword = process.env.ADMIN_PASSWORD ?? "";
        const configurationError = getAdminCredentialsError(envEmail, envPassword, production);
        if (configurationError) {
          console.error("[admin-auth]", configurationError);
        }
        if (production && password === "ChangeMe123!") return null;
        // Environment credentials are plaintext. Preserve password whitespace exactly.
        if (!configurationError && email === envEmail && password === envPassword) {
          return { id: "env-admin", email, role: "ADMIN" };
        }

        // An invalid environment account must not disable existing database accounts.
        const user = await Promise.resolve().then(() => getPrismaClient().user.findUnique({ where: { email } })).catch(() => {
          console.error("[admin-auth] Unable to check the database admin account.");
          return null;
        });
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

export async function requireAdmin(request?: Request) {
  if (request && !['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
    const protocol = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.slice(0, -1);
    let allowed = false;
    try { const url = new URL(origin || ''); allowed = url.host === host && url.protocol === `${protocol}:`; } catch { /* Missing/invalid origin. */ }
    if (!allowed) throw new ApiError('This request is not allowed.', 403);
  }
  const session = await getAdminSession();
  if (!session) {
    throw new ApiError("Please sign in to the admin dashboard.", 401);
  }
  return session;
}
