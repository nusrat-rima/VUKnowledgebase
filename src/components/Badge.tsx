import React from "react";
import { DocumentStatus } from "@/lib/types";
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: DocumentStatus;
  progress?: number;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Indexed</span>
        </span>
      );

    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 border border-rose-500/20">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Error</span>
        </span>
      );

    case "parsing":
    case "chunking":
    case "embedding":
    case "storing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 border border-blue-500/20 animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Processing & Indexing...</span>
        </span>
      );

    case "queued":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-400 border border-slate-500/20">
          <Clock className="h-3.5 w-3.5" />
          <span>Queued</span>
        </span>
      );
  }
}
