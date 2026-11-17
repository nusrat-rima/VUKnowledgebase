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
  Bot,
  Loader2,
  FolderKanban,
  Check,
  Copy,
  Clock,
  ChevronRight,
  UploadCloud,
  FileUp,
  Cpu,
  ArrowUpRight
} from "lucide-react";
import { Project, VectorQueryResult, DocumentRecord } from "@/lib/types";

export default function VuKnowledgeBasePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"ask" | "search">("ask");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VectorQueryResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch projects
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects) setProjects(data.projects);
      })
      .catch((err) => console.error("Error fetching projects:", err));

    // 2. Fetch documents
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => {
        if (data.documents) setDocuments(data.documents);
      })
      .catch((err) => console.error("Error fetching documents:", err));

    // 3. Fetch settings & vector DB stats
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const effectiveQuery = (customQuery || query).trim();
    if (!effectiveQuery) return;

    if (customQuery) setQuery(customQuery);
    setLoading(true);
    setError(null);
    setAiAnswer(null);

    try {
      const res = await fetch("/api/kb/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: effectiveQuery,
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

  const totalVectors = documents.reduce((acc, d) => acc + (d.embeddedChunks || 0), 0);
  const completedDocs = documents.filter((d) => d.status === "completed").length;

  return (
    <div className="relative min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-cyan-500/15 blur-[140px]" />
      <div className="pointer-events-none fixed top-1/3 -left-48 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-10 -right-48 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[130px]" />

      {/* Top Floating Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#060911]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25 transition group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#080d1a]">
                <BookOpen className="h-5 w-5 text-indigo-400 group-hover:text-cyan-300 transition" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-200 transition">
                  VuKnowledgeBase
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live NeonDB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AI Knowledge Hub • PDFs, Web & Docs
              </p>
            </div>
          </Link>

          {/* System status pills & Admin Portal CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-400">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-mono text-[11px] text-slate-300">gemini-embedding-001</span>
              <span className="text-slate-600">•</span>
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-mono text-[11px] text-slate-300">Neon Serverless</span>
            </div>

            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition active:scale-[0.98]"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Panel</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-70" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 max-w-5xl w-full mx-auto px-6 pt-12 pb-20 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin-slow" />
            <span>AI Knowledge & Semantic Retrieval</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Search, ask & discover across your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-200">
              entire knowledge base
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Instantly query all information extracted from crawled websites, uploaded PDF manuals, and research documents — vectorized into 768-dimensional embeddings and stored in Neon PostgreSQL.
          </p>
        </div>

        {/* Central Search Command Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Controls Bar: Mode & Project Scope */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-5">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-950/80 p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setMode("ask")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  mode === "ask"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Ask AI Assistant</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("search")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  mode === "search"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                <span>Semantic Search</span>
              </button>
            </div>

            {/* Scope / Project selector */}
            <div className="flex items-center gap-2">
              <FolderKanban className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-medium text-slate-400">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-xl border border-white/[0.1] bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.documentCount || 0} docs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={(e) => handleSearch(e)} className="relative">
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4.5 text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  mode === "ask"
                    ? "Ask a question (e.g. Summarize the uploaded PDF or website info)..."
                    : "Enter keywords, topics, or concepts to find relevant document chunks..."
                }
                className="w-full rounded-2xl border border-white/[0.12] bg-slate-950/80 py-4 pl-12 pr-32 text-sm text-white placeholder-slate-500 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2.5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-indigo-400 active:scale-95 disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === "ask" ? "Ask AI" : "Search"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick query chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500 text-[11px] font-medium">Quick Prompts:</span>
            {[
              "What information was collected from the website?",
              "Summarize the key sections of our documents",
              "What policies, guidelines, or specs are outlined?",
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSearch(undefined, chip)}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-[11px] font-medium text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-200 transition"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-rose-400" />
            <div>
              <strong className="font-semibold">Search Notice:</strong> {error}
            </div>
          </div>
        )}

        {/* AI Answer Section */}
        {aiAnswer && (
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 shadow-md shadow-indigo-500/30 text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">VuKnowledgeBase Synthesized Answer</h3>
                  <p className="text-[11px] text-indigo-300">
                    Grounded with citations from {results.length} retrieved document chunks
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(aiAnswer, "ai-answer")}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 hover:text-white transition"
                  title="Copy answer"
                >
                  {copiedId === "ai-answer" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans pt-1">
              {aiAnswer}
            </div>
          </div>
        )}

        {/* Retrieved Sources & Knowledge Chunks Grid */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Retrieved Knowledge Chunks ({results.length})
                </h2>
              </div>
              {searchMeta && (
                <span className="text-xs font-mono text-slate-500">
                  Retrieved in {searchMeta.executionTimeMs}ms • NeonDB ({searchMeta.provider})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {results.map((item, idx) => {
                const meta = item.metadata || {};
                const scorePercent = Math.round(item.score * 100);

                return (
                  <div
                    key={item.id}
                    className="glass-card rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/[0.06] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-mono font-bold text-indigo-400 border border-indigo-500/20">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            {meta.sourceType === "web" ? (
                              <Globe className="h-3.5 w-3.5 text-cyan-400" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-indigo-400" />
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
                              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-sm"
                            >
                              <span>{meta.sourceUrl}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-300">
                          {scorePercent}% Cosine Match
                        </span>

                        <button
                          onClick={() => copyToClipboard(meta.text || "", item.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"
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

                    <div className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-white/[0.04] whitespace-pre-wrap">
                      {meta.text || "No preview content available."}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Knowledge Base Overview Cards (When no search active) */}
        {results.length === 0 && !loading && (
          <div className="space-y-8 pt-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Knowledge Base Content & Documents</h2>
                <p className="text-xs text-slate-400">
                  Documents ingested and indexed in your Neon PostgreSQL vector store
                </p>
              </div>

              <Link
                href="/admin/documents"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <span>Upload more in Admin Panel</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Document Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.slice(0, 6).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSearch(undefined, `Tell me about ${doc.title}`)}
                  className="glass-card rounded-2xl p-5 cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                        {doc.sourceType === "web" ? (
                          <Globe className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <FileText className="h-4 w-4 text-indigo-400" />
                        )}
                      </div>
                      <span className="rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] font-mono text-slate-400 border border-white/[0.06] uppercase">
                        {doc.sourceType}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-white line-clamp-1">
                        {doc.title}
                      </h3>
                      {doc.sourceUrl ? (
                        <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                          {doc.sourceUrl}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "Document"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="font-mono text-indigo-300 font-semibold">
                      {doc.embeddedChunks || doc.totalChunks || 0} vectors
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <span>Click to query</span>
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] p-10 text-center space-y-3">
                  <FileUp className="mx-auto h-8 w-8 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-300">
                    No documents ingested into VuKnowledgeBase yet.
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Log into the Admin Panel to upload PDFs, crawl websites, or paste research notes.
                  </p>
                  <Link
                    href="/admin/documents"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Upload Documents Now</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Architecture / Stat Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                <span className="text-2xl font-extrabold text-white">{totalVectors}</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">Vectors in NeonDB</span>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                <span className="text-2xl font-extrabold text-white">{completedDocs}</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">Active Documents</span>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                <span className="font-mono text-sm font-bold text-indigo-300 truncate block mt-1">
                  gemini-embedding-001
                </span>
                <span className="block text-[11px] text-slate-400 mt-1">Embedding Engine</span>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                <span className="font-mono text-sm font-bold text-cyan-300 uppercase block mt-1">
                  Neon PostgreSQL
                </span>
                <span className="block text-[11px] text-slate-400 mt-1">Vector DB (pgvector)</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#060911]/90 py-8 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">VuKnowledgeBase</span>
            <span>•</span>
            <span>AI Knowledge Infrastructure</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/admin" className="hover:text-slate-300 transition">
              Admin Login
            </Link>
            <Link href="/admin/documents" className="hover:text-slate-300 transition">
              Document Ingestion
            </Link>
            <Link href="/admin/settings" className="hover:text-slate-300 transition">
              Vector DB Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
