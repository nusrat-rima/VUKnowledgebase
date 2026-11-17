"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileUp, 
  Search, 
  Settings, 
  Sparkles, 
  Database,
  ExternalLink,
  BookOpen,
  ArrowUpRight
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Ingest Documents", href: "/admin/documents", icon: FileUp },
  { name: "Vector Search", href: "/admin/search", icon: Search },
  { name: "Settings & Keys", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-md shadow-indigo-600/30">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="block text-sm font-bold tracking-tight text-white">VuKnowledgeBase</span>
          <span className="block text-[11px] font-medium text-cyan-400">Admin Console</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Knowledge Base Admin
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 px-3">
          <Link
            href="/"
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-500/30 hover:text-white transition"
          >
            <span>View Public Portal</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-indigo-400" />
          </Link>
        </div>
      </nav>

      {/* Model & Config Pill Footer */}
      <div className="border-t border-slate-800/80 p-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Active Model</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-indigo-400 truncate">
            gemini-embedding-001
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-slate-400" />
              <span>Vector Store</span>
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 uppercase">
              Ready
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
