"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, FolderKanban, Sparkles, CheckCircle2, AlertTriangle, ChevronDown, BookOpen } from "lucide-react";
import { Project } from "@/lib/types";

interface NavbarProps {
  currentProjectId?: string;
  onProjectChange?: (projectId: string) => void;
}

export function Navbar({ currentProjectId, onProjectChange }: NavbarProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentProjectId || "");
  const [systemStatus, setSystemStatus] = useState<{
    geminiConfigured: boolean;
    vectorProvider: string;
  } | null>(null);

  useEffect(() => {
    // Fetch projects
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects);
          if (!selectedId && data.projects.length > 0) {
            setSelectedId(data.projects[0].id);
            if (onProjectChange) onProjectChange(data.projects[0].id);
          }
        }
      })
      .catch((err) => console.error("Error fetching projects:", err));

    // Fetch system status
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSystemStatus({
          geminiConfigured: !!data.gemini?.configured,
          vectorProvider: data.vectorDb?.provider || "local",
        });
      })
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

  useEffect(() => {
    if (currentProjectId && currentProjectId !== selectedId) {
      setSelectedId(currentProjectId);
    }
  }, [currentProjectId]);

  const handleSelectProject = (id: string) => {
    setSelectedId(id);
    if (onProjectChange) onProjectChange(id);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-6 backdrop-blur-xl">
      {/* Left: Project Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <FolderKanban className="h-4 w-4 text-indigo-400" />
          <span>Active Project:</span>
        </div>
        <select
          value={selectedId}
          onChange={(e) => handleSelectProject(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.documentCount || 0} docs)
            </option>
          ))}
          {projects.length === 0 && <option value="">Loading projects...</option>}
        </select>
      </div>

      {/* Right: Status badges & Logout */}
      <div className="flex items-center gap-4">
        {/* Gemini API Key status indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-400">Gemini:</span>
          {systemStatus?.geminiConfigured ? (
            <span className="flex items-center gap-1 font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Key Required
            </span>
          )}
        </div>

        {/* Vector DB Provider badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400">
          <span>Vector DB:</span>
          <span className="font-mono font-semibold text-indigo-300 uppercase">
            {systemStatus?.vectorProvider || "local"}
          </span>
        </div>

        {/* User & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Switch to public VuKnowledgeBase portal"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>Portal</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              A
            </div>
            <span className="hidden lg:inline text-xs font-medium text-slate-300">Admin</span>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
