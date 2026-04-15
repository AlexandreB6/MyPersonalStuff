"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

/**
 * Minimal owner login page. Only relevant in private mode with
 * OWNER_PASSWORD set; otherwise the API rejects the POST with 404.
 */
export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      if (res.status === 404) {
        setError("Connexion désactivée (mode démo ou gate non configuré).");
      } else if (res.status === 401) {
        setError("Mot de passe incorrect.");
      } else {
        setError("Erreur inattendue.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !password}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
