"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  FileText, 
  Layers, 
  ArrowUpRight, 
  UploadCloud, 
  Globe, 
  Search, 
  GraduationCap,
  CheckCircle2,
  BookOpen
} from "lucide-react";
import { StatusBadge } from "@/components/Badge";
import { DocumentRecord, Project } from "@/lib/types";

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/documents").then((r) => r.json()),
    ])
      .then(([projData, docData]) => {
        setProjects(projData.projects || []);
        setDocuments(docData.documents || []);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const completedDocs = documents.filter((d) => d.status === "completed").length;
  const processingDocs = documents.filter((d) => d.status !== "completed" && d.status !== "failed").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Varendra University, Rajshahi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Knowledge Base Administration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, upload, and organize official university documents, websites, and research archives
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition"
          >
            <FolderKanban className="h-4 w-4 text-blue-400" />
            <span>+ Create Project</span>
          </Link>

          <Link
            href="/admin/documents"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Documents</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Projects */}
        <div className="admin-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Projects</span>
            <div className="rounded-2xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{projects.length}</span>
            <p className="mt-1 text-xs text-slate-400">University projects</p>
          </div>
        </div>

        {/* Card 2: Documents */}
        <div className="admin-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Documents</span>
            <div className="rounded-2xl bg-sky-500/10 p-2.5 text-sky-400 border border-sky-500/20">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{documents.length}</span>
            <p className="mt-1 text-xs text-slate-400">
              {completedDocs} ready • {processingDocs} processing
            </p>
          </div>
        </div>

        {/* Card 3: Indexed Knowledge */}
        <div className="admin-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Indexed Sections</span>
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              {documents.reduce((acc, d) => acc + (d.embeddedChunks || 0), 0)}
            </span>
            <p className="mt-1 text-xs text-slate-400">Knowledge entries available</p>
          </div>
        </div>

        {/* Card 4: System State */}
        <div className="admin-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Knowledge System</span>
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base font-bold text-emerald-400 block">
              Active & Synced
            </span>
            <p className="mt-1 text-xs text-slate-400">
              Varendra University Database
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/admin/documents?tab=files"
          className="admin-card group flex items-center justify-between rounded-3xl p-6 hover:border-blue-500/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/20 transition group-hover:scale-105">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300">Upload PDFs & Documents</h3>
              <p className="text-xs text-slate-400">Syllabuses, academic calendars, notices</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </Link>

        <Link
          href="/admin/documents?tab=web"
          className="admin-card group flex items-center justify-between rounded-3xl p-6 hover:border-sky-500/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600/15 text-sky-400 border border-sky-500/20 transition group-hover:scale-105">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-sky-300">Collect from Website</h3>
              <p className="text-xs text-slate-400">Extract pages from vu.edu.bd</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </Link>

        <Link
          href="/admin/search"
          className="admin-card group flex items-center justify-between rounded-3xl p-6 hover:border-emerald-500/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 transition group-hover:scale-105">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300">Search Knowledge</h3>
              <p className="text-xs text-slate-400">Query indexed university information</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </Link>
      </div>

      {/* Recent Documents Table */}
      <div className="admin-card rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4.5 bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-white">Recently Uploaded Documents</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest Varendra University files and website information</p>
          </div>
          <Link
            href="/admin/documents"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            View All Documents →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Document Title</th>
                <th className="px-6 py-3.5">Source Type</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Uploaded On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {documents.slice(0, 5).map((doc) => (
                <tr key={doc.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    <div className="truncate max-w-sm">{doc.title}</div>
                    {doc.sourceUrl && (
                      <span className="text-[11px] text-slate-500 font-mono block truncate max-w-sm mt-0.5">
                        {doc.sourceUrl}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-mono font-medium text-slate-300 uppercase border border-white/[0.06]">
                      {doc.sourceType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}

              {documents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    No documents uploaded yet. Use the Upload Documents section to add Varendra University PDFs and websites.
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
