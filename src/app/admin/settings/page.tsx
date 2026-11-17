"use client";

import { useEffect, useState } from "react";
import { 
  Settings, 
  KeyRound, 
  Database, 
  FileCode2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles,
  Server,
  Cloud
} from "lucide-react";

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testingVector, setTestingVector] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestConnection = async () => {
    setTestingVector(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      const stats = json.vectorDb?.stats;
      if (stats?.status === "connected") {
        setTestResult(`Success! Vector store connected (${stats.provider}). Total vectors indexed: ${stats.totalVectors}`);
      } else {
        setTestResult(`Status: ${stats?.status} - ${stats?.message || "Check your credentials"}`);
      }
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`);
    } finally {
      setTestingVector(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings & Configuration</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your Gemini API Key configuration, entry file settings, and Vector Database integration
        </p>
      </div>

      {/* SECTION 1: Gemini API Key & Entry File */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Google Gemini API Configuration</h2>
              <p className="text-xs text-slate-400">Embedding Model: <code className="text-indigo-400 font-mono font-bold">gemini-embedding-001</code></p>
            </div>
          </div>

          <div>
            {data?.gemini?.configured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active & Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
                <AlertTriangle className="h-3.5 w-3.5" />
                API Key Not Set
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <span className="text-xs text-slate-400 block">Detected API Key:</span>
            <div className="font-mono text-xs font-bold text-slate-200">
              {data?.gemini?.keyMasked || "None"}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Source: <strong className="text-indigo-300">{data?.gemini?.keySource}</strong>
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <FileCode2 className="h-4 w-4 text-indigo-400" />
              <span>Direct Entry File Location:</span>
            </div>
            <p className="font-mono text-xs text-indigo-300">
              src/entry.config.ts
            </p>
            <p className="text-[11px] text-slate-500">
              You can paste your key directly into <code className="text-slate-400">ENTRY_CONFIG.GEMINI_API_KEY</code>, or set <code className="text-slate-400">GEMINI_API_KEY</code> in <code className="text-slate-400">.env.local</code>.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-mono text-[11px] text-indigo-300">
            <span>// Snippet in src/entry.config.ts:</span>
          </div>
          <pre className="font-mono text-[11px] text-slate-400 bg-black/60 p-3 rounded-lg overflow-x-auto">
{`export const ENTRY_CONFIG = {
  GEMINI_API_KEY: "AIzaSy...", // <-- Paste your key here directly!
  EMBEDDING_MODEL: "gemini-embedding-001",
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "admin123",
};`}
          </pre>
        </div>
      </div>

      {/* SECTION 2: Vector Database in .env */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-400 border border-purple-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Vector Database Configuration</h2>
              <p className="text-xs text-slate-400">Configured via environment variables (.env.local / Vercel)</p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testingVector}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            {testingVector ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Server className="h-3.5 w-3.5" />
            )}
            <span>Test Connection</span>
          </button>
        </div>

        {testResult && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-xs text-indigo-300">
            {testResult}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs text-slate-400 block mb-1">Active Provider:</span>
            <span className="font-mono text-sm font-bold text-white uppercase">
              {data?.vectorDb?.provider || "local"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs text-slate-400 block mb-1">Total Vectors in Store:</span>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {data?.vectorDb?.stats?.totalVectors ?? 0}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs text-slate-400 block mb-1">Connection State:</span>
            <span className="font-mono text-sm font-bold text-indigo-300 capitalize">
              {data?.vectorDb?.stats?.status || "Ready"}
            </span>
          </div>
        </div>

        {/* Vector DB Provider Templates */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            How to switch Vector DB providers in your .env:
          </h3>

          <div className="rounded-xl border border-slate-800 bg-black/60 p-4 font-mono text-xs text-slate-300 space-y-3">
            <div>
              <span className="text-cyan-400 font-bold block mb-1"># For Neon Serverless Postgres (pgvector):</span>
              <p className="text-slate-400">VECTOR_DB_PROVIDER=neon</p>
              <p className="text-slate-400">NEON_DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require</p>
            </div>

            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-indigo-400 font-bold block mb-1"># For Pinecone:</span>
              <p className="text-slate-400">VECTOR_DB_PROVIDER=pinecone</p>
              <p className="text-slate-400">PINECONE_API_KEY=your_key</p>
              <p className="text-slate-400">PINECONE_HOST=https://your-index.svc.pinecone.io</p>
            </div>

            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-purple-400 font-bold block mb-1"># For Upstash Vector (Serverless):</span>
              <p className="text-slate-400">VECTOR_DB_PROVIDER=upstash</p>
              <p className="text-slate-400">UPSTASH_VECTOR_REST_URL=https://...upstash.io</p>
              <p className="text-slate-400">UPSTASH_VECTOR_REST_TOKEN=your_token</p>
            </div>

            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-emerald-400 font-bold block mb-1"># For Supabase / Postgres pgvector:</span>
              <p className="text-slate-400">VECTOR_DB_PROVIDER=supabase</p>
              <p className="text-slate-400">SUPABASE_URL=https://your-proj.supabase.co</p>
              <p className="text-slate-400">SUPABASE_SERVICE_ROLE_KEY=your_key</p>
            </div>

            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-sky-400 font-bold block mb-1"># For Local / Zero-setup Mode:</span>
              <p className="text-slate-400">VECTOR_DB_PROVIDER=local</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Vercel Deployment Checklist */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-3">
          <Cloud className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Vercel Deployment Checklist</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          When deploying to Vercel, simply push this repo to GitHub and import it on Vercel. 
          In your Vercel Project Settings &gt; Environment Variables, add:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 font-mono">
          <li>GEMINI_API_KEY=your_gemini_api_key</li>
          <li>VECTOR_DB_PROVIDER=pinecone (or upstash / supabase / qdrant)</li>
          <li>ADMIN_PASSWORD=your_secure_password</li>
          <li>JWT_SECRET=any_random_32_characters</li>
        </ul>
      </div>
    </div>
  );
}
