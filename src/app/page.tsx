"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Globe, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Database,
  ExternalLink,
  ChevronRight,
  Bot,
  Loader2,
  FolderKanban,
  Check,
  Copy
} from "lucide-react";
import { Project, VectorQueryResult } from "@/lib/types";

export default function VuKnowledgeBasePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"search" | "ask">("ask");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VectorQueryResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    // Fetch projects
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects);
          const totalDocs = data.projects.reduce((acc: number, p: Project) => acc + (p.documentCount || 0), 0);
          setDocCount(totalDocs);
        }
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAiAnswer(null);

    try {
      const res = await fetch("/api/kb/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          projectId: selectedProjectId,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");

      setResults(data.sources || []);
      setAiAnswer(data.answer || null);
      setSearchMeta({
        count: data.count,
        executionTimeMs: data.executionTimeMs,
        provider: data.provider,
      });
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  VuKnowledgeBase
                </span>
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/20">
                  AI & Vector Powered
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Centralized knowledge from websites, PDFs & documents
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Admin Login */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>NeonDB pgvector</span>
              <span className="text-slate-600">•</span>
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>gemini-embedding-001</span>
            </div>

            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl bg-indigo-600/15 border border-indigo-500/30 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-600 hover:text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Panel</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Search & Ask VuKnowledgeBase</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Find answers in all your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-200">
              collected documents
            </span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Search across all crawled websites, technical PDFs, and notes vectorized with Google Gemini embeddings and stored in your Neon database.
          </p>
        </div>

        {/* Search Bar & Controls Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("ask")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mode === "ask"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Ask AI Assistant</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("search")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mode === "search"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                <span>Semantic Search</span>
              </button>
            </div>

            {/* Scope / Project selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Project Scope:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Projects & Knowledge</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  mode === "ask"
                    ? "Ask a question (e.g. What are the key points in the uploaded policy or website?)..."
                    : "Search topics, keywords, or concepts across the documents..."
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-12 pr-28 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === "ask" ? "Ask" : "Search"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick topic suggestion pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-slate-500 text-[11px]">Quick Queries:</span>
            {["Summary of website content", "What policies are outlined?", "Key findings & details"].map(
              (pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(pill);
                  }}
                  className="rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 transition"
                >
                  {pill}
                </button>
              )
            )}
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* AI Answer Card (when in Ask mode) */}
        {aiAnswer && (
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 to-slate-900/80 p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Bot className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white">VuKnowledgeBase AI Answer</h3>
              </div>
              <span className="text-[11px] font-mono text-indigo-300">
                Grounded in {results.length} retrieved source(s)
              </span>
            </div>
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans pt-1">
              {aiAnswer}
            </div>
          </div>
        )}

        {/* Retrieved Sources & Matches */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Retrieved Documents & Knowledge Chunks ({results.length})
              </h2>
              {searchMeta && (
                <span className="text-xs text-slate-500 font-mono">
                  {searchMeta.executionTimeMs}ms • NeonDB ({searchMeta.provider})
                </span>
              )}
            </div>

            <div className="space-y-4">
              {results.map((item, idx) => {
                const meta = item.metadata || {};
                const scorePercent = Math.round(item.score * 100);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg transition hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-mono font-bold text-slate-300">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            {meta.sourceType === "web" ? (
                              <Globe className="h-3.5 w-3.5 text-sky-400" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-amber-400" />
                            )}
                            <h3 className="font-semibold text-sm text-white truncate max-w-md">
                              {meta.documentTitle || "Document"}
                            </h3>
                          </div>
                          {meta.sourceUrl && (
                            <a
                              href={meta.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-sm"
                            >
                              <span>{meta.sourceUrl}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-300">
                          {scorePercent}% Match
                        </span>

                        <button
                          onClick={() => copyToClipboard(meta.text || "", item.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                          title="Copy text snippet"
                        >
                          {copiedId === item.id ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/50 whitespace-pre-wrap">
                      {meta.text || "No preview available"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state / Prompt to Admin */}
        {results.length === 0 && !loading && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manage & Populate VuKnowledgeBase</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Need to add more PDFs, scrape fresh websites, or upload documents? Access the Admin Panel to ingest content with background Gemini vector conversion.
              </p>
            </div>
            <div>
              <Link
                href="/admin/documents"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition"
              >
                <span>Go to Admin Panel Ingestion</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>VuKnowledgeBase • Powered by Google Gemini embeddings and NeonDB pgvector</p>
      </footer>
    </div>
  );
}
