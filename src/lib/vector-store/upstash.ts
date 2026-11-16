import { VectorRecord, VectorQueryOptions, VectorQueryResult } from "../types";
import { VectorStore, VectorStoreStats } from "./types";

export class UpstashVectorStore implements VectorStore {
  readonly providerName = "upstash";
  private url: string;
  private token: string;

  constructor() {
    this.url = (process.env.UPSTASH_VECTOR_REST_URL || "").replace(/\/$/, "");
    this.token = process.env.UPSTASH_VECTOR_REST_TOKEN || "";
  }

  private isConfigured(): boolean {
    return !!(this.url && this.token);
  }

  async upsert(records: VectorRecord[], namespace?: string): Promise<{ count: number }> {
    if (!this.isConfigured()) {
      throw new Error("Upstash Vector is not configured. Please set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in your .env file.");
    }

    const payload = records.map((r) => ({
      id: r.id,
      vector: r.values,
      metadata: {
        ...r.metadata,
        namespace: namespace || r.metadata?.projectId || "default",
      },
    }));

    const endpoint = namespace ? `${this.url}/upsert?namespace=${encodeURIComponent(namespace)}` : `${this.url}/upsert`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upstash Vector Upsert Error (${response.status}): ${err}`);
    }

    return { count: records.length };
  }

  async query(options: VectorQueryOptions): Promise<VectorQueryResult[]> {
    if (!this.isConfigured()) {
      throw new Error("Upstash Vector is not configured. Please set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in your .env file.");
    }

    const { vector, topK = 5, namespace, filter } = options;
    const endpoint = namespace ? `${this.url}/query?namespace=${encodeURIComponent(namespace)}` : `${this.url}/query`;

    const payload: any = {
      vector,
      topK,
      includeMetadata: true,
    };

    if (filter) {
      payload.filter = filter;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upstash Vector Query Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const resultList = data.result || [];

    return resultList.map((item: any) => ({
      id: item.id,
      score: item.score,
      metadata: item.metadata || {},
    }));
  }

  async delete(ids: string[], namespace?: string): Promise<{ deleted: number }> {
    if (!this.isConfigured()) {
      throw new Error("Upstash Vector is not configured.");
    }

    const endpoint = namespace ? `${this.url}/delete?namespace=${encodeURIComponent(namespace)}` : `${this.url}/delete`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ids),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upstash Delete Error: ${err}`);
    }

    return { deleted: ids.length };
  }

  async deleteNamespace(namespace: string): Promise<{ deleted: number }> {
    if (!this.isConfigured()) {
      throw new Error("Upstash Vector is not configured.");
    }

    const endpoint = `${this.url}/reset?namespace=${encodeURIComponent(namespace)}`;
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upstash Reset Namespace Error: ${err}`);
    }

    return { deleted: 1 };
  }

  async getStats(): Promise<VectorStoreStats> {
    if (!this.isConfigured()) {
      return {
        provider: "upstash",
        totalVectors: 0,
        status: "error",
        message: "UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN is missing in .env",
      };
    }

    try {
      const response = await fetch(`${this.url}/info`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return {
          provider: "upstash",
          totalVectors: 0,
          status: "error",
          message: `Upstash info returned HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const info = data.result || {};

      return {
        provider: "upstash",
        totalVectors: info.vectorCount || 0,
        dimension: info.dimension,
        status: "connected",
        message: "Connected to Upstash Vector REST API.",
      };
    } catch (err: any) {
      return {
        provider: "upstash",
        totalVectors: 0,
        status: "error",
        message: err.message,
      };
    }
  }
}
