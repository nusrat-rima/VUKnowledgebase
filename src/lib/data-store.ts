import fs from "fs";
import path from "path";
import { Project, DocumentRecord, BackgroundJob } from "./types";
import { ENTRY_CONFIG } from "@/entry.config";

interface AppDatabase {
  projects: Project[];
  documents: DocumentRecord[];
  jobs: BackgroundJob[];
}

const DEFAULT_PROJECT_ID = "proj_default";

class DataStore {
  private db: AppDatabase = {
    projects: [],
    documents: [],
    jobs: [],
  };
  private filePath: string;
  private isLoaded = false;

  constructor() {
    this.filePath = path.join(process.cwd(), ".data", "store.json");
    this.init();
  }

  private init() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.db = JSON.parse(raw);
      } else {
        // Create initial Varendra University categories
        const now = new Date().toISOString();
        this.db.projects = [
          {
            id: "cat_admissions",
            name: "Admissions & Tuition",
            description: "Undergraduate and graduate admission requirements, fee structures, and waiver policies",
            vectorNamespace: "cat_admissions",
            chunkSize: ENTRY_CONFIG.DEFAULT_CHUNK_SIZE,
            chunkOverlap: ENTRY_CONFIG.DEFAULT_CHUNK_OVERLAP,
            createdAt: now,
            updatedAt: now,
            documentCount: 0,
            chunkCount: 0,
            vectorCount: 0,
          },
          {
            id: "cat_academics",
            name: "Faculties & Academic Curricula",
            description: "Department course outlines, credit details, faculty profiles, and program syllabuses",
            vectorNamespace: "cat_academics",
            chunkSize: ENTRY_CONFIG.DEFAULT_CHUNK_SIZE,
            chunkOverlap: ENTRY_CONFIG.DEFAULT_CHUNK_OVERLAP,
            createdAt: now,
            updatedAt: now,
            documentCount: 0,
            chunkCount: 0,
            vectorCount: 0,
          },
          {
            id: "cat_policies",
            name: "Rules, Policies & Notices",
            description: "Exam regulations, code of conduct, academic calendars, and administrative circulars",
            vectorNamespace: "cat_policies",
            chunkSize: ENTRY_CONFIG.DEFAULT_CHUNK_SIZE,
            chunkOverlap: ENTRY_CONFIG.DEFAULT_CHUNK_OVERLAP,
            createdAt: now,
            updatedAt: now,
            documentCount: 0,
            chunkCount: 0,
            vectorCount: 0,
          },
        ];
        this.save();
      }
    } catch {
      // Memory fallback for readonly serverless
      if (this.db.projects.length === 0) {
        const now = new Date().toISOString();
        this.db.projects = [
          {
            id: "cat_admissions",
            name: "Admissions & Tuition",
            description: "Undergraduate and graduate admission requirements, fee structures, and waiver policies",
            vectorNamespace: "cat_admissions",
            chunkSize: 800,
            chunkOverlap: 150,
            createdAt: now,
            updatedAt: now,
            documentCount: 0,
            chunkCount: 0,
            vectorCount: 0,
          },
          {
            id: "cat_academics",
            name: "Faculties & Academic Curricula",
            description: "Department course outlines, credit details, faculty profiles, and program syllabuses",
            vectorNamespace: "cat_academics",
            chunkSize: 800,
            chunkOverlap: 150,
            createdAt: now,
            updatedAt: now,
            documentCount: 0,
            chunkCount: 0,
            vectorCount: 0,
          },
        ];
      }
    }
    this.isLoaded = true;
  }

  private save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.db, null, 2), "utf-8");
    } catch {
      // Ignore on readonly filesystem
    }
  }

  // --- PROJECTS ---
  getProjects(): Project[] {
    this.init();
    // Update stats dynamically
    return this.db.projects.map((p) => {
      const docs = this.db.documents.filter((d) => d.projectId === p.id);
      const totalChunks = docs.reduce((acc, d) => acc + (d.embeddedChunks || 0), 0);
      return {
        ...p,
        documentCount: docs.length,
        chunkCount: totalChunks,
        vectorCount: totalChunks,
      };
    });
  }

  getProject(id: string): Project | undefined {
    this.init();
    return this.getProjects().find((p) => p.id === id);
  }

  createProject(input: {
    name: string;
    description?: string;
    chunkSize?: number;
    chunkOverlap?: number;
  }): Project {
    this.init();
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const project: Project = {
      id,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      vectorNamespace: id,
      chunkSize: input.chunkSize || ENTRY_CONFIG.DEFAULT_CHUNK_SIZE,
      chunkOverlap: input.chunkOverlap || ENTRY_CONFIG.DEFAULT_CHUNK_OVERLAP,
      createdAt: now,
      updatedAt: now,
      documentCount: 0,
      chunkCount: 0,
      vectorCount: 0,
    };

    this.db.projects.push(project);
    this.save();
    return project;
  }

  updateProject(id: string, partial: Partial<Project>): Project | undefined {
    this.init();
    const project = this.db.projects.find((p) => p.id === id);
    if (!project) return undefined;

    Object.assign(project, partial, { updatedAt: new Date().toISOString() });
    this.save();
    return project;
  }

  deleteProject(id: string): boolean {
    this.init();
    const index = this.db.projects.findIndex((p) => p.id === id);
    if (index === -1) return false;

    this.db.projects.splice(index, 1);
    // Delete documents under this project
    this.db.documents = this.db.documents.filter((d) => d.projectId !== id);
    this.db.jobs = this.db.jobs.filter((j) => j.projectId !== id);
    this.save();
    return true;
  }

  // --- DOCUMENTS ---
  getDocuments(projectId?: string): DocumentRecord[] {
    this.init();
    if (projectId) {
      return this.db.documents.filter((d) => d.projectId === projectId);
    }
    return [...this.db.documents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getDocument(id: string): DocumentRecord | undefined {
    this.init();
    return this.db.documents.find((d) => d.id === id);
  }

  createDocument(doc: Omit<DocumentRecord, "id" | "createdAt" | "updatedAt">): DocumentRecord {
    this.init();
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: DocumentRecord = {
      ...doc,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.db.documents.unshift(record);
    this.save();
    return record;
  }

  updateDocument(id: string, partial: Partial<DocumentRecord>): DocumentRecord | undefined {
    this.init();
    const doc = this.db.documents.find((d) => d.id === id);
    if (!doc) return undefined;

    Object.assign(doc, partial, { updatedAt: new Date().toISOString() });
    this.save();
    return doc;
  }

  deleteDocument(id: string): boolean {
    this.init();
    const index = this.db.documents.findIndex((d) => d.id === id);
    if (index === -1) return false;

    this.db.documents.splice(index, 1);
    this.db.jobs = this.db.jobs.filter((j) => j.documentId !== id);
    this.save();
    return true;
  }

  // --- BACKGROUND JOBS ---
  getJobs(projectId?: string): BackgroundJob[] {
    this.init();
    if (projectId) {
      return this.db.jobs.filter((j) => j.projectId === projectId);
    }
    return [...this.db.jobs].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  getJob(id: string): BackgroundJob | undefined {
    this.init();
    return this.db.jobs.find((j) => j.id === id);
  }

  createJob(job: Omit<BackgroundJob, "id" | "startedAt" | "logs">): BackgroundJob {
    this.init();
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: BackgroundJob = {
      ...job,
      id,
      logs: [`Job created at ${new Date().toLocaleTimeString()}`],
      startedAt: new Date().toISOString(),
    };

    this.db.jobs.unshift(record);
    this.save();
    return record;
  }

  updateJob(id: string, partial: Partial<BackgroundJob>): BackgroundJob | undefined {
    this.init();
    const job = this.db.jobs.find((j) => j.id === id);
    if (!job) return undefined;

    Object.assign(job, partial);
    this.save();
    return job;
  }

  addJobLog(id: string, log: string) {
    this.init();
    const job = this.db.jobs.find((j) => j.id === id);
    if (job) {
      const timestamp = new Date().toLocaleTimeString();
      job.logs.push(`[${timestamp}] ${log}`);
      this.save();
    }
  }
}

// Global singleton so state persists across hot reload / requests
const globalDataStore = (global as any).__DATA_STORE__ || new DataStore();
if (process.env.NODE_ENV !== "production") {
  (global as any).__DATA_STORE__ = globalDataStore;
}

export const dataStore: DataStore = globalDataStore;
