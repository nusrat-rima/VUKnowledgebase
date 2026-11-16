"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Sparkles, 
  Layers, 
  FolderKanban, 
  FileText, 
  Clock, 
  Database, 
  Copy, 
  Check, 
  Sliders,
  ChevronRight
} from "lucide-react";
import { Project, VectorQueryResult } from "@/lib/types";

function VectorSearchContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<VectorQueryResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects);
          if (!selectedProjectId && data.projects.length > 0) {
            setSelectedProjectId(data.projects[0].id);
          }
        }
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!selectedProjectId) {
      setError("Please select a target project.");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          projectId: selectedProjectId,
          topK,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.matches || []);
      setSearchMeta({
        executionTimeMs: data.executionTimeMs,
        provider: data.provider,
        model: data.model,
        count: data.matchCount,
      });
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Vector Search Playground</h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform semantic similarity searches against your vectorized documents using <span className="font-mono text-indigo-400">gemini-embedding-001</span>
        </p>
      </div>

      {/* Query Bar & Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Project Picker */}
            <div className="sm:w-64">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Scope</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Query Input */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Semantic Query</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. What are the key terms mentioned in our agreements? / How does the integration work?"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Top-K Selector */}
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Top-K</label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {searching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Meta Stats Bar if searched */}
      {searchMeta && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 px-5 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Layers className="h-4 w-4 text-emerald-400" />
              Found {searchMeta.count} matching chunk(s)
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {searchMeta.executionTimeMs} ms
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Model: <strong className="text-indigo-400">{searchMeta.model}</strong></span>
            <span>Vector DB: <strong className="text-indigo-300 uppercase">{searchMeta.provider}</strong></span>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {results.map((match, idx) => {
          const scorePercent = Math.round(match.score * 100);
          const meta = match.metadata || {};

          return (
            <div
              key={match.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm transition hover:border-slate-700"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-mono font-bold text-slate-300">
                    #{idx + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{meta.documentTitle || "Document"}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>Chunk {meta.chunkIndex ?? 0} of {meta.totalChunks ?? 1}</span>
                      {meta.sourceUrl && (
                        <>
                          <span>•</span>
                          <a
                            href={meta.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline truncate max-w-xs"
                          >
                            {meta.sourceUrl}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score badge */}
                <div className="flex items-center gap-2">
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-bold font-mono border ${
                      scorePercent >= 80
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : scorePercent >= 60
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                    }`}
                  >
                    {scorePercent}% Similarity
                  </div>

                  <button
                    onClick={() => copyToClipboard(meta.text || "", match.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    title="Copy chunk text"
                  >
                    {copiedId === match.id ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Chunk text content */}
              <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {meta.text || "No text available for this chunk."}
              </div>
            </div>
          );
        })}

        {results.length === 0 && !searching && searchMeta && (
          <div className="rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
            No matching chunks found above similarity threshold. Try a broader search query.
          </div>
        )}

        {results.length === 0 && !searchMeta && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
            <Search className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm">Enter a search query above to test Gemini vector embeddings.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VectorSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading vector search playground...</div>}>
      <VectorSearchContent />
    </Suspense>
  );
}
