"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  GraduationCap,
  ArrowRight,
  BookOpen,
  DollarSign,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  Building2,
  Award,
  Bus,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Project } from "@/lib/types";

interface SourceMatch {
  id: string;
  score: number;
  metadata?: {
    documentTitle?: string;
    sourceType?: string;
    sourceUrl?: string;
    text?: string;
    chunkIndex?: number;
  };
}

interface QueryResult {
  query: string;
  answer: string | null;
  sources: SourceMatch[];
  count: number;
  executionTimeMs: number;
}

const SAMPLE_QUESTIONS = [
  "What are the admission requirements and tuition fees for CSE?",
  "How much is the total tuition fee for Bachelor of Pharmacy (B.Pharm)?",
  "What scholarships and GPA waivers does Varendra University provide?",
  "How can students pay semester fees through bKash?",
  "Where is the permanent campus located and what bus routes are available?",
  "Is Varendra University approved by UGC and the Pharmacy Council of Bangladesh?",
];

export default function FrontPage() {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load available projects for filtering
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects);
        }
      })
      .catch((err) => console.error("Error loading projects:", err));
  }, []);

  const handleSearch = async (searchQuery: string = query) => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setQuery(q);

    try {
      const res = await fetch("/api/kb/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          projectId: selectedProjectId !== "all" ? selectedProjectId : undefined,
          mode: "ask",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process question");
      }

      setResult(data);
      setExpandedSourceIndex(0); // Open top match by default

      // Scroll to answer smoothly
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      setError(err.message || "An error occurred while answering your question.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Background radial gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-sky-600/15 blur-[120px]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & University Identity */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 shadow-lg shadow-blue-600/30 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-blue-400">
                  Varendra University
                </span>
                <span className="hidden sm:inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/20">
                  Rajshahi
                </span>
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                Knowledge Base & AI Assistant
              </span>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-3">
            <a
              href="https://vu.edu.bd"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
            >
              <span>Main Website</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition active:scale-95"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            <span>AI-Powered University Knowledge Retrieval</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Ask Anything About{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Varendra University
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Get instant, verified answers on admissions, tuition fees, academic faculties, scholarships, 
            campus facilities, and payment guidelines powered by vector search.
          </p>
        </div>

        {/* Central Search Box */}
        <div className="admin-card rounded-3xl p-3 sm:p-4 shadow-2xl border-white/[0.12] bg-slate-900/90 backdrop-blur-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              {/* Optional Project Filter */}
              {projects.length > 0 && (
                <div className="sm:w-56 shrink-0">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full h-13 rounded-2xl border border-white/[0.08] bg-slate-950 px-3.5 text-xs font-semibold text-slate-300 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">🔍 All Knowledge Base</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        📂 {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Main Question Input Field */}
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question (e.g. What are the admission requirements and tuition fees for CSE?)"
                  className="w-full h-13 rounded-2xl border border-white/[0.08] bg-slate-950 pl-5 pr-12 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="h-13 px-7 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Ask Question</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Sample Questions Chips */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
              Suggested Queries:
            </span>
            {SAMPLE_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSearch(sq)}
                className="rounded-xl border border-white/[0.06] bg-slate-950/70 hover:bg-blue-600/20 hover:border-blue-500/30 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-blue-300 transition text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="admin-card rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-2xl animate-pulse">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="h-7 w-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Searching Varendra University Knowledge Base...
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Converting question into vector embeddings • Querying Neon pgvector database • Fine-tuning answer with Gemini
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-300 shadow-xl">
            <span className="font-bold block mb-1">Search Error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Results Container */}
        {result && !loading && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in duration-300">
            {/* Fine-Tuned AI Answer Card */}
            <div className="admin-card rounded-3xl p-6 sm:p-8 shadow-2xl border-blue-500/30 bg-gradient-to-b from-slate-900 to-slate-950">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Fine-Tuned Answer
                    </h2>
                    <span className="text-xs text-slate-400">
                      Synthesized from verified Varendra University records
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-white/[0.08] bg-slate-950 px-3 py-1.5 text-[11px] font-mono text-slate-400">
                    ⚡ {result.executionTimeMs}ms
                  </span>
                  {result.answer && (
                    <button
                      onClick={() => handleCopyAnswer(result.answer || "")}
                      className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Answer Body */}
              <div className="mt-6 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {result.answer || "No fine-tuned response could be synthesized for this question."}
              </div>

              {/* Prompt Citation Footnote */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
                <span>Information verified from official VU documents and website data</span>
                <span>Model: gemini-embedding-001 + Gemini</span>
              </div>
            </div>

            {/* Matched Sources / Best Matches Section (shown when relevant university sources exist) */}
            {result.sources.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Best Matching Knowledge Sources ({result.sources.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Cosine Similarity Ranking
                  </span>
                </div>

                <div className="space-y-3">
                  {result.sources.map((source, idx) => {
                    const isExpanded = expandedSourceIndex === idx;
                    const similarityPercent = Math.round((source.score || 0) * 100);

                    return (
                      <div
                        key={source.id || idx}
                        className="admin-card rounded-2xl overflow-hidden border border-white/[0.08] bg-slate-900/60 transition"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSourceIndex(isExpanded ? null : idx)
                          }
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600/20 text-xs font-bold text-blue-300 border border-blue-500/25">
                              #{idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-white block">
                                {source.metadata?.documentTitle || "Official University Document"}
                              </span>
                              {source.metadata?.sourceUrl && (
                                <span className="text-[11px] text-blue-400 flex items-center gap-1 mt-0.5 font-mono">
                                  {source.metadata.sourceUrl}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                                similarityPercent >= 75
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : similarityPercent >= 60
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              }`}
                            >
                              {similarityPercent}% Match
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-white/[0.06] bg-slate-950/70 p-4.5 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {source.metadata?.text || "No excerpt text available for this vector record."}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Institutional Pillars / Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="admin-card rounded-3xl p-5 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Permanent Campus</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Located on Rajshahi Bypass Road, Chandrima, Paba. Approved by UGC & Ministry of Education.
            </p>
          </div>

          <div className="admin-card rounded-3xl p-5 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Up to 100% Waivers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generous tuition waivers for Golden GPA 5.0, Freedom Fighter quotas, siblings, and merit.
            </p>
          </div>

          <div className="admin-card rounded-3xl p-5 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600/15 text-sky-400 border border-sky-500/20">
              <Bus className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">City Bus Network</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Daily bus shuttles connecting Vheripara, Talaimari, Court, and Zero Point to campus.
            </p>
          </div>

          <div className="admin-card rounded-3xl p-5 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Admission Hotlines</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              01730406501 – 503, 01730406590 or email info@vu.edu.bd for admission assistance.
            </p>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-slate-950/90 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 text-xs font-bold text-blue-300 border border-blue-500/30">
              VU
            </div>
            <div>
              <span className="font-bold text-white block">
                Varendra University, Rajshahi
              </span>
              <span className="text-[11px] text-slate-500">
                Rajshahi Bypass Road, Chandrima, Paba, Rajshahi-6204
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://vu.edu.bd"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 transition"
            >
              Official Website (vu.edu.bd)
            </a>
            <a
              href="https://www.facebook.com/vu.edu/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 transition"
            >
              Facebook Page
            </a>
            <Link href="/admin" className="hover:text-blue-400 transition">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}