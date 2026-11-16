"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  UploadCloud, 
  Globe, 
  FileText, 
  FolderKanban, 
  Trash2, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  FileUp, 
  Plus,
  RefreshCw
} from "lucide-react";
import { StatusBadge } from "@/components/Badge";
import { JobProgressModal } from "@/components/JobProgressModal";
import { DocumentRecord, Project } from "@/lib/types";

function DocumentsContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "";
  const initialTab = (searchParams.get("tab") as "files" | "web" | "text") || "files";

  const [activeTab, setActiveTab] = useState<"files" | "web" | "text">(initialTab);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Scrape State
  const [webUrlsText, setWebUrlsText] = useState("");
  const [scrapingWeb, setScrapingWeb] = useState(false);

  // Text Note State
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [submittingText, setSubmittingText] = useState(false);

  // Active Job Inspection Modal
  const [inspectJobId, setInspectJobId] = useState<string | null>(null);

  // Notification message
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
        if (!selectedProjectId && data.projects.length > 0) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const url = selectedProjectId
        ? `/api/documents?projectId=${selectedProjectId}`
        : "/api/documents";
      const res = await fetch(url);
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [selectedProjectId]);

  // Polling: Auto-refresh documents if any is currently processing
  useEffect(() => {
    const hasActiveJobs = documents.some(
      (d) => d.status !== "completed" && d.status !== "failed"
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 2000);

    return () => clearInterval(interval);
  }, [documents, selectedProjectId]);

  // --- Handlers ---
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUploadFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setAlertMessage({ type: "error", text: "Please select a target Project first." });
      return;
    }
    if (selectedFiles.length === 0) {
      setAlertMessage({ type: "error", text: "Please select at least one file to upload." });
      return;
    }

    setUploadingFiles(true);
    setAlertMessage(null);

    try {
      const formData = new FormData();
      formData.append("projectId", selectedProjectId);
      for (const file of selectedFiles) {
        formData.append("files", file);
      }

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setAlertMessage({
        type: "success",
        text: `Queued ${selectedFiles.length} file(s). Conversion to Gemini embeddings has started in the background!`,
      });
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (err: any) {
      setAlertMessage({ type: "error", text: err.message });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleScrapeWeb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setAlertMessage({ type: "error", text: "Please select a target Project first." });
      return;
    }
    const urls = webUrlsText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      setAlertMessage({ type: "error", text: "Please enter at least one URL." });
      return;
    }

    setScrapingWeb(true);
    setAlertMessage(null);

    try {
      const res = await fetch("/api/documents/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId, urls }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scraping failed");

      setAlertMessage({
        type: "success",
        text: `Queued ${urls.length} website URL(s). Background scraping and vectorization started!`,
      });
      setWebUrlsText("");
      fetchDocuments();
    } catch (err: any) {
      setAlertMessage({ type: "error", text: err.message });
    } finally {
      setScrapingWeb(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setAlertMessage({ type: "error", text: "Please select a target Project first." });
      return;
    }
    if (!textContent.trim()) {
      setAlertMessage({ type: "error", text: "Text content cannot be empty." });
      return;
    }

    setSubmittingText(true);
    setAlertMessage(null);

    try {
      const res = await fetch("/api/documents/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: textTitle.trim() || "Collected Web Information",
          content: textContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit text");

      setAlertMessage({
        type: "success",
        text: "Note submitted! Background Gemini embedding generation has started.",
      });
      setTextTitle("");
      setTextContent("");
      fetchDocuments();
    } catch (err: any) {
      setAlertMessage({ type: "error", text: err.message });
    } finally {
      setSubmittingText(false);
    }
  };

  const handleDeleteDocument = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and remove its vectors from the Vector DB?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(documents.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Delete doc error:", err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header & Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Document Ingestion & Embeddings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload PDFs, scrape websites, or ingest text — vectorized immediately with <span className="text-indigo-400 font-mono">gemini-embedding-001</span> in the background
          </p>
        </div>

        {/* Project Selector Bar */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2">
          <FolderKanban className="h-4 w-4 text-indigo-400 ml-2" />
          <span className="text-xs text-slate-400">Target Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-xs ${
            alertMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {alertMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Ingestion Source Tabs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Tab Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-semibold transition border-b-2 ${
              activeTab === "files"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Documents (PDF, TXT, MD)</span>
          </button>

          <button
            onClick={() => setActiveTab("web")}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-semibold transition border-b-2 ${
              activeTab === "web"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Scrape Websites / URLs</span>
          </button>

          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-semibold transition border-b-2 ${
              activeTab === "text"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Raw Text Note</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: File Upload */}
          {activeTab === "files" && (
            <form onSubmit={handleUploadFiles} className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-8 text-center transition hover:border-indigo-500/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-3">
                  <FileUp className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Drag and drop your files here, or{" "}
                  <label className="text-indigo-400 cursor-pointer hover:underline">
                    browse
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.txt,.md,.json,.csv,.docx"
                      onChange={(e) => {
                        if (e.target.files) setSelectedFiles(Array.from(e.target.files));
                      }}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF documents, Plain Text (.txt), Markdown (.md), JSON, CSV
                </p>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg">
                    {selectedFiles.map((f, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-indigo-600/15 px-2.5 py-1 text-[11px] font-mono text-indigo-300 border border-indigo-500/30"
                      >
                        {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploadingFiles || selectedFiles.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {uploadingFiles ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Queueing Uploads...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Ingest & Vectorize {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Web Scraping */}
          {activeTab === "web" && (
            <form onSubmit={handleScrapeWeb} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Website URLs (Enter one URL per line):
                </label>
                <textarea
                  rows={4}
                  value={webUrlsText}
                  onChange={(e) => setWebUrlsText(e.target.value)}
                  placeholder={`https://example.com/docs/api-guide\nhttps://example.com/blog/introduction`}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The background worker will fetch each web page, strip scripts and styles, extract clean article text, chunk it, and compute Gemini embeddings.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={scrapingWeb || !webUrlsText.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {scrapingWeb ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Queueing Scraping Jobs...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      <span>Scrape & Vectorize Websites</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Raw Text Note */}
          {activeTab === "text" && (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Title / Topic</label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="e.g. Competitor Research Notes, Customer FAQs"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Content Text / Markdown</label>
                <textarea
                  rows={6}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste any collected text, notes, copied website paragraphs, or markdown here..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingText || !textContent.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingText ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Ingest & Vectorize Note</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Ingestion Activity & Documents Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Project Documents & Vector Status</h2>
            <p className="text-xs text-slate-400">
              Real-time background conversion status and chunk indexing
            </p>
          </div>
          <button
            onClick={() => fetchDocuments()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3">Document Title</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Conversion Status</th>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3">Chunks</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/20 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-200 truncate max-w-sm">
                      {doc.title}
                    </div>
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400/80 hover:underline truncate block max-w-sm mt-0.5"
                      >
                        {doc.sourceUrl}
                      </a>
                    )}
                    {doc.errorMessage && (
                      <span className="text-[11px] text-rose-400 block mt-1">
                        {doc.errorMessage}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300 uppercase">
                      {doc.sourceType}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={doc.status} progress={doc.progress} />
                  </td>

                  <td className="px-6 py-4 w-44">
                    <div className="space-y-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            doc.status === "failed"
                              ? "bg-rose-500"
                              : doc.status === "completed"
                              ? "bg-emerald-500"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${Math.max(5, doc.progress || 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {doc.currentStage || "Pending"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono text-slate-300">
                    {doc.embeddedChunks || 0} / {doc.totalChunks || 0}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          // Find job id by document id or format
                          setInspectJobId(`job_${doc.id.replace('doc_', '')}`);
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-indigo-300 hover:bg-indigo-600/10 hover:text-indigo-200 transition"
                        title="View background job trace & logs"
                      >
                        <Terminal className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        title="Delete document and its vectors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {documents.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No documents uploaded to this project yet. Use the tabs above to ingest files or website links!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Background Job Logs Modal */}
      <JobProgressModal
        jobId={inspectJobId}
        onClose={() => setInspectJobId(null)}
      />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading documents...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
