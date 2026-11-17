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
  X,
  Calendar
} from "lucide-react";
import { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
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
          chunkSize: 800,
          chunkOverlap: 150,
        }),
      });

      if (res.ok) {
        setNewProjectName("");
        setNewProjectDesc("");
        setShowCreateModal(false);
        fetchProjects();
      }
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}" and all its documents?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
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
            Knowledge Categories
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize university documents into categories like Admissions, Faculties, Curricula, and Campus Notices
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
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
                  title="Delete category"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-400 leading-relaxed line-clamp-2">
                {project.description || "Official materials and records for this category."}
              </p>

              {/* Stats badges */}
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
                title="Search this category"
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
          <p className="mt-3 text-sm">No university categories created yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
          >
            Create First Category
          </button>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-bold text-white">Create Knowledge Category</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Admissions & Tuition, Faculty of Science & Engineering"
                  className="w-full rounded-xl border border-white/[0.1] bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Brief description of the university documents grouped in this category"
                  className="w-full rounded-xl border border-white/[0.1] bg-slate-950 p-3 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
