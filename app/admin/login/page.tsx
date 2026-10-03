"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const formData = new FormData(event.currentTarget);
    setError("");
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.get("email"),
        password: formData.get("password")
      });
      if (result?.ok) {
        const callbackUrl = searchParams.get("callbackUrl");
        const destination = callbackUrl && callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("//") ? callbackUrl : "/admin";
        router.replace(destination);
        router.refresh();
      } else {
        setError("Invalid admin email or password.");
      }
    } catch {
      setError("Unable to sign in. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4">
      <form onSubmit={submit} className="admin-panel w-full max-w-md p-7">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-sage text-white"><Lock className="h-5 w-5" /></div>
        <h1 className="mt-5 font-serif text-3xl">Admin Login</h1>
        <p className="mt-2 text-sm text-muted">Manage the wedding invitation securely.</p>
        <div className="mt-6 grid gap-4">
          <label className="admin-label">Email<input name="email" type="email" autoComplete="username" className="admin-input" required /></label>
          <label className="admin-label">Password<input name="password" type="password" autoComplete="current-password" className="admin-input" required /></label>
          <button type="submit" disabled={submitting} aria-busy={submitting} className="cursor-pointer rounded-full bg-sage px-5 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{submitting ? "Signing in…" : "Sign In"}</button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      </form>
    </main>
  );
}
