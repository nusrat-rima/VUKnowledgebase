"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  FileText, 
  Globe, 
  Copy, 
  Check, 
  FolderKanban,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { Project, VectorQueryResult } from "@/lib/types";

function VectorSearchContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<VectorQueryResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!selectedProjectId) {
      setError("Please select a target category.");
      return;
    }

    setSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          projectId: selectedProjectId,
          topK: 6,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.matches || []);
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
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Varendra University, Rajshahi
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Knowledge Base Search
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Query and verify official university information across all uploaded documents, PDFs, and website pages
        </p>
      </div>

      {/* Query Bar */}
      <div className="admin-card rounded-3xl p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Picker */}
            <div className="sm:w-72">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">University Category</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-slate-950 px-3.5 py-3 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Question or Topic to Search</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. What are the admission fees for CSE? / Library opening hours / Waiver criteria"
                  className="w-full rounded-xl border border-white/[0.1] bg-slate-950 py-3 pl-11 pr-4 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
              >
                {searching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <strong>Notice:</strong> {error}
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.map((match, idx) => {
          const meta = match.metadata || {};

          return (
            <div
              key={match.id}
              className="admin-card rounded-3xl p-6 shadow-xl transition"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600/20 text-xs font-bold text-blue-300 border border-blue-500/30">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      {meta.sourceType === "web" ? (
                        <Globe className="h-3.5 w-3.5 text-sky-400" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                      )}
                      <h3 className="font-bold text-sm text-white">{meta.documentTitle || "Official Document"}</h3>
                    </div>
                    {meta.sourceUrl && (
                      <a
                        href={meta.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>{meta.sourceUrl}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-[11px] font-semibold text-emerald-400">
                    Relevant Match
                  </span>

                  <button
                    onClick={() => copyToClipboard(meta.text || "", match.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    title="Copy excerpt"
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
              <div className="mt-4 rounded-2xl border border-white/[0.04] bg-slate-950/60 p-4 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {meta.text || "No excerpt content available."}
              </div>
            </div>
          );
        })}

        {results.length === 0 && !searching && hasSearched && (
          <div className="admin-card rounded-3xl p-12 text-center text-slate-400">
            No matching documents found in this category. Try searching with different keywords.
          </div>
        )}

        {results.length === 0 && !hasSearched && (
          <div className="rounded-3xl border border-dashed border-white/[0.1] p-12 text-center text-slate-500">
            <BookOpen className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm">Search across Varendra University official documents above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VectorSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading search portal...</div>}>
      <VectorSearchContent />
    </Suspense>
  );
}
