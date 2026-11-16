import fs from "fs";
import path from "path";
import { VectorRecord, VectorQueryOptions, VectorQueryResult } from "../types";
import { VectorStore, VectorStoreStats } from "./types";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;
  return dotProduct / magnitude;
}

export class LocalVectorStore implements VectorStore {
  readonly providerName = "local";
  private records: Map<string, VectorRecord> = new Map();
  private filePath: string;
  private isLoaded = false;

  constructor() {
    this.filePath = path.join(process.cwd(), ".data", "vectors.json");
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const list: VectorRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.records.set(item.id, item);
        }
      }
    } catch {
      // In serverless readonly environments, fallback to memory
    }
    this.isLoaded = true;
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.records.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), "utf-8");
    } catch {
      // Ignore if running on readonly filesystem like Vercel Lambda
    }
  }

  async upsert(records: VectorRecord[], namespace?: string): Promise<{ count: number }> {
    for (const record of records) {
      const effectiveRecord: VectorRecord = {
        ...record,
        metadata: {
          ...record.metadata,
          namespace: namespace || record.metadata?.projectId || "default",
        },
      };
      this.records.set(record.id, effectiveRecord);
    }
    this.saveToDisk();
    return { count: records.length };
  }

  async query(options: VectorQueryOptions): Promise<VectorQueryResult[]> {
    const { vector, topK = 5, namespace, filter } = options;
    const results: { id: string; score: number; record: VectorRecord }[] = [];

    for (const record of Array.from(this.records.values())) {
      // Check namespace filter if provided
      if (namespace && record.metadata.projectId !== namespace && record.metadata.namespace !== namespace) {
        continue;
      }

      // Check metadata filter if provided
      if (filter) {
        let match = true;
        for (const [k, v] of Object.entries(filter)) {
          if (record.metadata[k] !== v) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      const score = cosineSimilarity(vector, record.values);
      results.push({
        id: record.id,
        score,
        record,
      });
    }

    // Sort descending by similarity score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK).map((r) => ({
      id: r.id,
      score: Math.max(0, Math.min(1, r.score)),
      metadata: r.record.metadata,
    }));
  }

  async delete(ids: string[]): Promise<{ deleted: number }> {
    let deleted = 0;
    for (const id of ids) {
      if (this.records.delete(id)) {
        deleted++;
      }
    }
    this.saveToDisk();
    return { deleted };
  }

  async deleteNamespace(namespace: string): Promise<{ deleted: number }> {
    let deleted = 0;
    for (const [id, record] of Array.from(this.records.entries())) {
      if (record.metadata.projectId === namespace || record.metadata.namespace === namespace) {
        this.records.delete(id);
        deleted++;
      }
    }
    this.saveToDisk();
    return { deleted };
  }

  async getStats(namespace?: string): Promise<VectorStoreStats> {
    const namespaces: Record<string, number> = {};
    let total = 0;

    for (const record of Array.from(this.records.values())) {
      const ns = record.metadata.projectId || record.metadata.namespace || "default";
      namespaces[ns] = (namespaces[ns] || 0) + 1;
      total++;
    }

    return {
      provider: "local (built-in JSON/Memory)",
      totalVectors: namespace ? (namespaces[namespace] || 0) : total,
      namespaces,
      dimension: 768,
      status: "connected",
      message: "Using built-in zero-config vector store with Cosine Similarity.",
    };
  }
}
