"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  Plus, 
  FileText, 
  Trash2, 
  Search, 
  UploadCloud, 
  Calendar,
  CheckCircle2,
  FolderPlus
} from "lucide-react";
import { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
          chunkSize: 800,
          chunkOverlap: 150,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Project "${newProjectName.trim()}" created successfully!`);
        setNewProjectName("");
        setNewProjectDesc("");
        fetchProjects();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert(data.error || "Failed to create project");
      }
    } catch (err: any) {
      alert(`Error creating project: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}" and all documents inside it?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Varendra University, Rajshahi
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Projects Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Create and organize isolated projects for specific subjects, departments, admission cycles, or documents
        </p>
      </div>

      {/* CREATE PROJECT SECTION */}
      <div className="admin-card rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 border-blue-500/30">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <FolderPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Create New Project</h2>
            <p className="text-xs text-slate-400">
              Each project holds a dedicated collection of website links, PDFs, and documents
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. CSE Department, Admissions 2026, Pharmacy Curricula"
                className="w-full rounded-xl border border-white/[0.1] bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Project Description (Optional)
              </label>
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief description of the documents and topics stored under this project"
                className="w-full rounded-xl border border-white/[0.1] bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !newProjectName.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              <span>{submitting ? "Creating Project..." : "Create Project"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ALL PROJECTS LIST SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Existing University Projects ({projects.length})
          </h2>
          <span className="text-xs text-slate-500">
            Documents will be uploaded and saved under these projects
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="admin-card flex flex-col justify-between rounded-3xl p-6"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/25">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{project.name}</h3>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    title="Delete project"
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-4 text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {project.description || "Official materials and records for this project."}
                </p>

                {/* Stats */}
                <div className="mt-5 border-t border-white/[0.08] pt-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">{project.documentCount || 0} Documents</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-2 pt-2">
                <Link
                  href={`/admin/documents?projectId=${project.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload Documents</span>
                </Link>
                <Link
                  href={`/admin/search?projectId=${project.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900/90 p-2.5 text-slate-400 transition hover:border-slate-700 hover:text-white"
                  title="Search this project"
                >
                  <Search className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && !loading && (
          <div className="rounded-3xl border border-dashed border-white/[0.1] p-12 text-center text-slate-500">
            <FolderKanban className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm">No projects created yet.</p>
            <p className="text-xs text-slate-500 mt-1">Use the Create New Project section above to add your first project.</p>
          </div>
        )}
      </div>
    </div>
  );
}
