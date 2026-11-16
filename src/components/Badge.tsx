import React from "react";
import { DocumentStatus } from "@/lib/types";
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: DocumentStatus;
  progress?: number;
}

export function StatusBadge({ status, progress }: StatusBadgeProps) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Completed</span>
        </span>
      );

    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Failed</span>
        </span>
      );

    case "embedding":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20 animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Embedding {progress ? `(${progress}%)` : "..."}</span>
        </span>
      );

    case "parsing":
    case "chunking":
    case "storing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 border border-sky-500/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="capitalize">{status}...</span>
        </span>
      );

    case "queued":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-400 border border-slate-500/20">
          <Clock className="h-3.5 w-3.5" />
          <span>Queued</span>
        </span>
      );
  }
}
