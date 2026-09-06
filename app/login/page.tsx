"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(params.get("next") || "/");
      router.refresh();
    } else {
      setError("That password isn't right. Check with whoever set this up.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-line bg-panel p-8"
      >
        <h1 className="font-display text-2xl text-ink">Policy Assistant</h1>
        <p className="mt-1 text-sm text-mute">
          Enter the shared access password to continue.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-5 w-full rounded-md border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-navy"
        />
        {error && <p className="mt-2 text-sm text-amber">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 w-full rounded-md bg-navy py-2.5 font-medium text-white transition hover:bg-navy-dark disabled:opacity-50"
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
