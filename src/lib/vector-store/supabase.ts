import { VectorRecord, VectorQueryOptions, VectorQueryResult } from "../types";
import { VectorStore, VectorStoreStats } from "./types";

export class SupabaseVectorStore implements VectorStore {
  readonly providerName = "supabase";
  private url: string;
  private key: string;
  private table: string;

  constructor() {
    this.url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
    this.key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "";
    this.table = process.env.SUPABASE_TABLE || "document_embeddings";
  }

  private isConfigured(): boolean {
    return !!(this.url && this.key);
  }

  private headers() {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
  }

  async upsert(records: VectorRecord[], namespace?: string): Promise<{ count: number }> {
    if (!this.isConfigured()) {
      throw new Error("Supabase pgvector is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
    }

    const rows = records.map((r) => ({
      id: r.id,
      embedding: r.values,
      metadata: r.metadata,
      project_id: namespace || r.metadata?.projectId || "default",
      content: r.metadata?.text || "",
    }));

    const response = await fetch(`${this.url}/rest/v1/${this.table}`, {
      method: "POST",
      headers: {
        ...this.headers(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Supabase Upsert Error (${response.status}): ${err}`);
    }

    return { count: records.length };
  }

  async query(options: VectorQueryOptions): Promise<VectorQueryResult[]> {
    if (!this.isConfigured()) {
      throw new Error("Supabase pgvector is not configured.");
    }

    const { vector, topK = 5, namespace } = options;

    // Call Supabase RPC match_documents function
    const response = await fetch(`${this.url}/rest/v1/rpc/match_documents`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        query_embedding: vector,
        match_count: topK,
        filter_project_id: namespace || null,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Supabase Query RPC Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return (data || []).map((row: any) => ({
      id: row.id,
      score: row.similarity ?? row.score ?? 0,
      metadata: row.metadata || {},
    }));
  }

  async delete(ids: string[]): Promise<{ deleted: number }> {
    if (!this.isConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const idList = ids.map((id) => `"${id}"`).join(",");
    const response = await fetch(`${this.url}/rest/v1/${this.table}?id=in.(${idList})`, {
      method: "DELETE",
      headers: this.headers(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Supabase Delete Error: ${err}`);
    }

    return { deleted: ids.length };
  }

  async deleteNamespace(namespace: string): Promise<{ deleted: number }> {
    if (!this.isConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const response = await fetch(`${this.url}/rest/v1/${this.table}?project_id=eq.${encodeURIComponent(namespace)}`, {
      method: "DELETE",
      headers: this.headers(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Supabase Delete Namespace Error: ${err}`);
    }

    return { deleted: 1 };
  }

  async getStats(namespace?: string): Promise<VectorStoreStats> {
    if (!this.isConfigured()) {
      return {
        provider: "supabase",
        totalVectors: 0,
        status: "error",
        message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env",
      };
    }

    try {
      const countUrl = namespace
        ? `${this.url}/rest/v1/${this.table}?project_id=eq.${encodeURIComponent(namespace)}&select=count`
        : `${this.url}/rest/v1/${this.table}?select=count`;

      const response = await fetch(countUrl, {
        method: "HEAD",
        headers: {
          ...this.headers(),
          Prefer: "count=exact",
        },
      });

      const countRange = response.headers.get("content-range");
      let total = 0;
      if (countRange && countRange.includes("/")) {
        total = parseInt(countRange.split("/")[1], 10) || 0;
      }

      return {
        provider: "supabase (pgvector)",
        totalVectors: total,
        dimension: 768,
        status: "connected",
        message: `Connected to Supabase table '${this.table}'`,
      };
    } catch (err: any) {
      return {
        provider: "supabase",
        totalVectors: 0,
        status: "error",
        message: err.message,
      };
    }
  }
}
