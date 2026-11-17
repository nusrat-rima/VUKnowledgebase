"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, GraduationCap, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#070b14] p-4 overflow-hidden">
      {/* Subtle University Blue Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-blue-600/10 blur-[140px]" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/80 p-8 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 text-white">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Varendra University, Rajshahi
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Knowledge Base Admin
              </h1>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Sign in to manage and upload university documents, website resources, and academic publications
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full rounded-xl border border-white/[0.1] bg-slate-950 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/[0.1] bg-slate-950 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Knowledge Admin</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick info credentials */}
          <div className="mt-8 rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Default Administrator Access:</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Username: <strong className="text-slate-200">admin</strong></span>
              <span>Password: <strong className="text-slate-200">admin123</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
