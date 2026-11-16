"use client";

import { useEffect, useState } from "react";
import { X, Terminal, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { BackgroundJob, DocumentRecord } from "@/lib/types";

interface JobProgressModalProps {
  jobId: string | null;
  onClose: () => void;
}

export function JobProgressModal({ jobId, onClose }: JobProgressModalProps) {
  const [job, setJob] = useState<BackgroundJob | null>(null);
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    let timer: NodeJS.Timeout;

    const pollJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJob(data.job);
          setDocument(data.document);

          // If still running or pending, keep polling
          if (data.job?.status === "running" || data.job?.status === "pending") {
            timer = setTimeout(pollJob, 1500);
          }
        }
      } catch (err) {
        console.error("Job poll error:", err);
      } finally {
        setLoading(false);
      }
    };

    pollJob();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Background Conversion Job</h3>
              <p className="font-mono text-xs text-slate-400">ID: {jobId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {loading && !job ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Fetching job status...</span>
            </div>
          ) : job ? (
            <>
              {/* Document details & Status */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Target Document:</span>
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-xs">
                    {document?.title || "Document"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Status:</span>
                  <span className="capitalize font-semibold text-xs flex items-center gap-1.5">
                    {job.status === "completed" && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </span>
                    )}
                    {job.status === "failed" && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> Failed
                      </span>
                    )}
                    {(job.status === "running" || job.status === "pending") && (
                      <span className="text-indigo-400 flex items-center gap-1">
                        <Loader2 className="h-4 w-4 animate-spin" /> In Progress
                      </span>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-indigo-300">{job.stage}</span>
                    <span className="text-slate-400 font-mono">{job.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        job.status === "failed"
                          ? "bg-rose-500"
                          : job.status === "completed"
                          ? "bg-emerald-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.max(5, job.progress)}%` }}
                    />
                  </div>
                </div>

                {job.error && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <strong>Error:</strong> {job.error}
                  </div>
                )}
              </div>

              {/* Execution Logs */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Execution Trace & Logs
                </h4>
                <div className="rounded-xl border border-slate-800 bg-black/70 p-4 font-mono text-xs text-slate-300 space-y-1 max-h-60 overflow-y-auto">
                  {job.logs && job.logs.length > 0 ? (
                    job.logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.includes("ERROR")
                            ? "text-rose-400"
                            : log.includes("Successfully") || log.includes("finished")
                            ? "text-emerald-400"
                            : "text-slate-300"
                        }
                      >
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-600 italic">No logs recorded yet.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">Job record not found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950/40 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
