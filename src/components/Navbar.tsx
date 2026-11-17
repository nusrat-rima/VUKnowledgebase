"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, FolderKanban } from "lucide-react";
import { Project } from "@/lib/types";

interface NavbarProps {
  currentProjectId?: string;
  onProjectChange?: (projectId: string) => void;
}

export function Navbar({ currentProjectId, onProjectChange }: NavbarProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentProjectId || "");

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
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-white/[0.08] bg-slate-950/80 px-8 backdrop-blur-xl">
      {/* Left: University Project Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <FolderKanban className="h-4 w-4 text-blue-400" />
          <span>Active Project:</span>
        </div>
        <select
          value={selectedId}
          onChange={(e) => handleSelectProject(e.target.value)}
          className="rounded-xl border border-white/[0.1] bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition focus:border-blue-500 focus:outline-none"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.documentCount || 0} docs)
            </option>
          ))}
          {projects.length === 0 && <option value="">Loading projects...</option>}
        </select>
      </div>

      {/* Right: User profile & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 text-xs font-bold text-blue-300 border border-blue-500/30">
              VU
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-white">VU Administrator</span>
              <span className="block text-[10px] text-slate-400">Knowledge Manager</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
