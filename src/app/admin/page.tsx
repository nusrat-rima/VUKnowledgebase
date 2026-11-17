"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  FileText, 
  Layers, 
  Sparkles, 
  ArrowUpRight, 
  UploadCloud, 
  Globe, 
  Search, 
  AlertCircle,
  Database
} from "lucide-react";
import { StatusBadge } from "@/components/Badge";
import { DocumentRecord, Project } from "@/lib/types";

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/documents").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([projData, docData, settData]) => {
        setProjects(projData.projects || []);
        setDocuments(docData.documents || []);
        setSettings(settData || null);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalVectors = documents.reduce((acc, d) => acc + (d.embeddedChunks || 0), 0);
  const completedDocs = documents.filter((d) => d.status === "completed").length;
  const processingDocs = documents.filter((d) => d.status !== "completed" && d.status !== "failed").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner if API Key is not set */}
      {settings && !settings.gemini?.configured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-200">Gemini API Key Required</h3>
              <p className="mt-1 text-xs text-amber-300/80 leading-relaxed">
                To start generating vector embeddings with <code className="font-mono font-bold">gemini-embedding-001</code>, 
                paste your Gemini API key in <code className="rounded bg-amber-950/60 px-1.5 py-0.5 font-mono text-amber-200">src/entry.config.ts</code> or in your <code className="rounded bg-amber-950/60 px-1.5 py-0.5 font-mono text-amber-200">.env.local</code> file.
              </p>
              <div className="mt-3">
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/30"
                >
                  Configure Entry File / Keys
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">VuKnowledgeBase Admin Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage projects, upload PDFs, scrape websites, and monitor background Gemini vector conversions
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-500/40 hover:text-white transition"
        >
          <span>Open VuKnowledgeBase Portal</span>
          <ArrowUpRight className="h-4 w-4 text-indigo-400" />
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Projects */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Projects</span>
            <div className="rounded-2xl bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/20">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{projects.length}</span>
            <p className="mt-1 text-xs text-slate-400">Knowledge namespaces</p>
          </div>
        </div>

        {/* Card 2: Documents */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Documents</span>
            <div className="rounded-2xl bg-sky-500/10 p-2.5 text-sky-400 border border-sky-500/20">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{documents.length}</span>
            <p className="mt-1 text-xs text-slate-400">
              {completedDocs} completed • {processingDocs} processing
            </p>
          </div>
        </div>

        {/* Card 3: Vectors Generated */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Vector Embeddings</span>
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{totalVectors}</span>
            <p className="mt-1 text-xs text-slate-400">Indexed in Neon pgvector</p>
          </div>
        </div>

        {/* Card 4: Model & DB */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Embedding Engine</span>
            <div className="rounded-2xl bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-sm font-bold text-purple-300 block truncate">
              gemini-embedding-001
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <Database className="h-3 w-3 text-cyan-400" />
              <span>DB: <strong className="text-white uppercase">{settings?.vectorDb?.provider || "neon"}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Ingestion Action Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/admin/documents?tab=files"
          className="glass-card group flex items-center justify-between rounded-3xl p-6 hover:border-indigo-500/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 transition group-hover:scale-105">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300">Upload Documents</h3>
              <p className="text-xs text-slate-400">PDFs, TXT, MD, CSV, JSON files</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </Link>

        <Link
          href="/admin/documents?tab=web"
          className="glass-card group flex items-center justify-between rounded-3xl p-6 hover:border-cyan-500/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600/15 text-cyan-400 border border-cyan-500/20 transition group-hover:scale-105">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300">Scrape Websites</h3>
              <p className="text-xs text-slate-400">Extract web pages into embeddings</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </Link>

        <Link
          href="/admin/search"
          className="glass-card group flex items-center justify-between rounded-3xl p-6 hover:border-emerald-500/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 transition group-hover:scale-105">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300">Search Playground</h3>
              <p className="text-xs text-slate-400">Test Gemini semantic search</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </Link>
      </div>

      {/* Recent Documents Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4.5 bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-white">Recent Documents</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest converted files and web collections in NeonDB</p>
          </div>
          <Link
            href="/admin/documents"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            View All Documents →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3">Document Title</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Chunks</th>
                <th className="px-6 py-3">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.slice(0, 5).map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/20 transition">
                  <td className="px-6 py-3.5 font-medium text-slate-200">
                    <div className="truncate max-w-xs">{doc.title}</div>
                  </td>
                  <td className="px-6 py-3.5 capitalize text-slate-400">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono">
                      {doc.sourceType}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={doc.status} progress={doc.progress} />
                  </td>
                  <td className="px-6 py-3.5 font-mono text-slate-300">
                    {doc.embeddedChunks || 0} / {doc.totalChunks || 0}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {documents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No documents uploaded yet. Click{" "}
                    <Link href="/admin/documents" className="text-indigo-400 underline">
                      Upload Documents
                    </Link>{" "}
                    to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
