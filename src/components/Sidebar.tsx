"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileUp, 
  Search, 
  GraduationCap,
  Building2,
  FileText
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Upload Documents", href: "/admin/documents", icon: FileUp },
  { name: "Search Knowledge", href: "/admin/search", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.08] bg-slate-950/90 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex h-18 items-center gap-3 border-b border-white/[0.08] px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 shadow-md shadow-blue-600/30 text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-blue-400">
            Varendra University
          </span>
          <span className="block text-sm font-bold text-white">
            Knowledge Base
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Admin Management
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* University Identity Footer */}
      <div className="border-t border-white/[0.08] p-4">
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-3.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
            <Building2 className="h-3.5 w-3.5 text-blue-400" />
            <span>Rajshahi Campus</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Official Knowledge Repository for Varendra University
          </p>
        </div>
      </div>
    </aside>
  );
}
