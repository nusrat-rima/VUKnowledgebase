"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  Plus, 
  FileText, 
  Layers, 
  Trash2, 
  Search, 
  UploadCloud, 
  X,
  Sliders,
  Calendar
} from "lucide-react";
import { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newChunkSize, setNewChunkSize] = useState(800);
  const [newChunkOverlap, setNewChunkOverlap] = useState(150);
  const [submitting, setSubmitting] = useState(false);

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
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
          chunkSize: Number(newChunkSize) || 800,
          chunkOverlap: Number(newChunkOverlap) || 150,
        }),
      });

      if (res.ok) {
        setNewProjectName("");
        setNewProjectDesc("");
        setShowCreateModal(false);
        fetchProjects();
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}" and all its converted vectors?`)) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Projects Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize documents and vector namespaces into isolated projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm transition hover:border-slate-700"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base">{project.name}</h3>
                    <span className="font-mono text-[10px] text-slate-500">ID: {project.id}</span>
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

              <p className="mt-4 text-xs text-slate-400 line-clamp-2">
                {project.description || "No description provided for this project."}
              </p>

              {/* Stats badges */}
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-800/80 py-3.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-400" />
                  <div>
                    <span className="block text-xs font-bold text-white">{project.documentCount || 0}</span>
                    <span className="block text-[10px] text-slate-500">Documents</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <div>
                    <span className="block text-xs font-bold text-white">{project.vectorCount || 0}</span>
                    <span className="block text-[10px] text-slate-500">Vectors in DB</span>
                  </div>
                </div>
              </div>

              {/* Chunk config info */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Sliders className="h-3 w-3" />
                  <span>Chunk: {project.chunkSize} chars (overlap: {project.chunkOverlap})</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-2 pt-2">
              <Link
                href={`/admin/documents?projectId=${project.id}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 transition hover:bg-indigo-600 hover:text-white"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload Docs</span>
              </Link>
              <Link
                href={`/admin/search?projectId=${project.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 p-2 text-slate-400 transition hover:border-slate-700 hover:text-white"
                title="Search this project"
              >
                <Search className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          <FolderKanban className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm">No projects created yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Create Your First Project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Website Documentation, Legal Contracts"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Brief description of the documents stored under this project"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Chunk Size (chars)</label>
                  <input
                    type="number"
                    value={newChunkSize}
                    onChange={(e) => setNewChunkSize(Number(e.target.value))}
                    min={200}
                    max={4000}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Overlap (chars)</label>
                  <input
                    type="number"
                    value={newChunkOverlap}
                    onChange={(e) => setNewChunkOverlap(Number(e.target.value))}
                    min={0}
                    max={500}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
