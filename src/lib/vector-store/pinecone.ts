import { VectorRecord, VectorQueryOptions, VectorQueryResult } from "../types";
import { VectorStore, VectorStoreStats } from "./types";

export class PineconeVectorStore implements VectorStore {
  readonly providerName = "pinecone";
  private apiKey: string;
  private host: string;

  constructor() {
    this.apiKey = process.env.PINECONE_API_KEY || "";
    let host = process.env.PINECONE_HOST || "";
    // Clean up host protocol
    if (host && !host.startsWith("http://") && !host.startsWith("https://")) {
      host = `https://${host}`;
    }
    this.host = host;
  }

  private isConfigured(): boolean {
    return !!(this.apiKey && this.host);
  }

  async upsert(records: VectorRecord[], namespace?: string): Promise<{ count: number }> {
    if (!this.isConfigured()) {
      throw new Error("Pinecone is not configured. Please set PINECONE_API_KEY and PINECONE_HOST in your .env file.");
    }

    const vectors = records.map((r) => ({
      id: r.id,
      values: r.values,
      metadata: r.metadata,
    }));

    const response = await fetch(`${this.host}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        vectors,
        namespace: namespace || "default",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pinecone Upsert Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return { count: data.upsertedCount ?? records.length };
  }

  async query(options: VectorQueryOptions): Promise<VectorQueryResult[]> {
    if (!this.isConfigured()) {
      throw new Error("Pinecone is not configured. Please set PINECONE_API_KEY and PINECONE_HOST in your .env file.");
    }

    const { vector, topK = 5, namespace, filter } = options;

    const payload: any = {
      vector,
      topK,
      includeMetadata: true,
      includeValues: false,
    };

    if (namespace) {
      payload.namespace = namespace;
    }
    if (filter) {
      payload.filter = filter;
    }

    const response = await fetch(`${this.host}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pinecone Query Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const matches = data.matches || [];

    return matches.map((m: any) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata || {},
    }));
  }

  async delete(ids: string[], namespace?: string): Promise<{ deleted: number }> {
    if (!this.isConfigured()) {
      throw new Error("Pinecone is not configured.");
    }

    const response = await fetch(`${this.host}/vectors/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        ids,
        namespace: namespace || "default",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pinecone Delete Error (${response.status}): ${err}`);
    }

    return { deleted: ids.length };
  }

  async deleteNamespace(namespace: string): Promise<{ deleted: number }> {
    if (!this.isConfigured()) {
      throw new Error("Pinecone is not configured.");
    }

    const response = await fetch(`${this.host}/vectors/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        deleteAll: true,
        namespace,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pinecone Delete Namespace Error: ${err}`);
    }

    return { deleted: 1 };
  }

  async getStats(namespace?: string): Promise<VectorStoreStats> {
    if (!this.isConfigured()) {
      return {
        provider: "pinecone",
        totalVectors: 0,
        status: "error",
        message: "PINECONE_API_KEY or PINECONE_HOST is missing in .env",
      };
    }

    try {
      const response = await fetch(`${this.host}/describe_index_stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": this.apiKey,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        return {
          provider: "pinecone",
          totalVectors: 0,
          status: "error",
          message: `Pinecone stats returned HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const namespaces: Record<string, number> = {};
      if (data.namespaces) {
        for (const [k, v] of Object.entries(data.namespaces as Record<string, any>)) {
          namespaces[k] = v.vectorCount || 0;
        }
      }

      return {
        provider: "pinecone",
        totalVectors: data.totalVectorCount || 0,
        dimension: data.dimension,
        namespaces,
        status: "connected",
        message: "Connected to Pinecone cloud index.",
      };
    } catch (err: any) {
      return {
        provider: "pinecone",
        totalVectors: 0,
        status: "error",
        message: err.message,
      };
    }
  }
}
