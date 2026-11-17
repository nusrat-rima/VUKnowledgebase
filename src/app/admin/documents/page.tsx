"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  UploadCloud, 
  Globe, 
  FileText, 
  FolderKanban, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  FileUp, 
  RefreshCw,
  ExternalLink,
  GraduationCap
} from "lucide-react";
import { StatusBadge } from "@/components/Badge";
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
      setAlertMessage({ type: "error", text: "Please select a target Category first." });
      return;
    }
    if (selectedFiles.length === 0) {
      setAlertMessage({ type: "error", text: "Please select at least one document or PDF to upload." });
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
        text: `Uploaded ${selectedFiles.length} file(s). Content is being processed and indexed into the knowledge base!`,
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
      setAlertMessage({ type: "error", text: "Please select a target Category first." });
      return;
    }
    const urls = webUrlsText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      setAlertMessage({ type: "error", text: "Please enter at least one URL from Varendra University." });
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
      if (!res.ok) throw new Error(data.error || "Web collection failed");

      setAlertMessage({
        type: "success",
        text: `Submitted ${urls.length} website link(s). Web content is being collected and indexed into the knowledge base!`,
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
      setAlertMessage({ type: "error", text: "Please select a target Category first." });
      return;
    }
    if (!textContent.trim()) {
      setAlertMessage({ type: "error", text: "Information content cannot be empty." });
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
          title: textTitle.trim() || "Varendra University Information Note",
          content: textContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit information");

      setAlertMessage({
        type: "success",
        text: "University note submitted and indexed into the knowledge base!",
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
    if (!confirm(`Delete "${title}" from the Varendra University knowledge base?`)) {
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Varendra University, Rajshahi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Upload & Manage Documents
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload official prospectuses, syllabuses, notices, or collect information directly from university websites
          </p>
        </div>

        {/* Category Selector Bar */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-950/80 p-2 shadow-lg">
          <FolderKanban className="h-4 w-4 text-blue-400 ml-2" />
          <span className="text-xs font-medium text-slate-400">Target Category:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-xl border border-white/[0.1] bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
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
          className={`flex items-center gap-3 rounded-2xl border p-4 text-xs shadow-lg animate-in fade-in duration-200 ${
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
          <span className="font-medium">{alertMessage.text}</span>
        </div>
      )}

      {/* Ingestion Source Tabs */}
      <div className="admin-card rounded-3xl overflow-hidden shadow-2xl">
        {/* Tab Header */}
        <div className="flex border-b border-white/[0.08] bg-slate-950/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "files"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload PDFs & Files</span>
          </button>

          <button
            onClick={() => setActiveTab("web")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "web"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Collect from Website (vu.edu.bd)</span>
          </button>

          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "text"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>University Notes & Text</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: File Upload */}
          {activeTab === "files" && (
            <form onSubmit={handleUploadFiles} className="space-y-5">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/[0.12] bg-slate-950/60 p-10 text-center transition hover:border-blue-500/50 hover:bg-slate-950/80 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/25 mb-4 group-hover:scale-110 transition shadow-lg shadow-blue-500/10">
                  <FileUp className="h-7 w-7" />
                </div>
                <p className="text-base font-bold text-white">
                  Drop Varendra University PDFs and documents here, or{" "}
                  <span className="text-blue-400 underline decoration-blue-500/40 underline-offset-4">browse files</span>
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
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-md">
                  Upload syllabus copies, admission circulars, examination schedules, fee charts, and student guidelines.
                </p>

                {/* Formats row */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                  {["PDF Documents", "Academic Calendars", "Notices & Circulars", "Text & Markdown"].map((fmt, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-[10px] font-mono font-medium text-slate-400"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-lg" onClick={(e) => e.stopPropagation()}>
                    {selectedFiles.map((f, i) => (
                      <span
                        key={i}
                        className="rounded-xl bg-blue-600/20 px-3 py-1.5 text-xs font-mono font-semibold text-blue-200 border border-blue-500/30 flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                        <span>{f.name}</span>
                        <span className="text-slate-400 text-[10px]">({(f.size / 1024).toFixed(1)} KB)</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={uploadingFiles || selectedFiles.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-40"
                >
                  {uploadingFiles ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing & Indexing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      <span>Upload & Index {selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ""}</span>
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
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Varendra University Website URLs (Enter one URL per line):
                </label>
                <textarea
                  rows={4}
                  value={webUrlsText}
                  onChange={(e) => setWebUrlsText(e.target.value)}
                  placeholder={`https://vu.edu.bd/admission\nhttps://vu.edu.bd/department/cse\nhttps://vu.edu.bd/tuition-fees`}
                  className="w-full rounded-2xl border border-white/[0.1] bg-slate-950 p-4 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  The system will automatically fetch each webpage from <code className="text-blue-300 font-mono">vu.edu.bd</code>, extract the official information, and index it into the knowledge base.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={scrapingWeb || !webUrlsText.trim()}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-40"
                >
                  {scrapingWeb ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Collecting Information...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      <span>Collect & Index Website Pages</span>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subject / Notice Title
                </label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="e.g. Spring 2026 Admission Notice, CSE Lab Schedule"
                  className="w-full rounded-xl border border-white/[0.1] bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Information Content
                </label>
                <textarea
                  rows={6}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste official notices, admission requirements, faculty details, or university announcements here..."
                  className="w-full rounded-xl border border-white/[0.1] bg-slate-950 p-4 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingText || !textContent.trim()}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-40"
                >
                  {submittingText ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>Save & Index Information</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="admin-card rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4.5 bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-white">University Documents & Records</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All documents currently stored in the Varendra University knowledge repository
            </p>
          </div>
          <button
            onClick={() => fetchDocuments()}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Document Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date Uploaded</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-200 truncate max-w-sm">
                      {doc.title}
                    </div>
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-sm"
                      >
                        <span>{doc.sourceUrl}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
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

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
                      title="Remove document from knowledge base"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {documents.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No documents uploaded to this category yet. Select an upload tab above to add Varendra University materials.
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

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading documents...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
