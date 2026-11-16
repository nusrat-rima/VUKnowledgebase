import { VectorRecord, VectorQueryOptions, VectorQueryResult } from "../types";
import { VectorStore, VectorStoreStats } from "./types";

export class QdrantVectorStore implements VectorStore {
  readonly providerName = "qdrant";
  private url: string;
  private apiKey: string;
  private collection: string;

  constructor() {
    this.url = (process.env.QDRANT_URL || "").replace(/\/$/, "");
    this.apiKey = process.env.QDRANT_API_KEY || "";
    this.collection = process.env.QDRANT_COLLECTION || "gemini_documents";
  }

  private isConfigured(): boolean {
    return !!this.url;
  }

  private headers() {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      h["api-key"] = this.apiKey;
    }
    return h;
  }

  async upsert(records: VectorRecord[], namespace?: string): Promise<{ count: number }> {
    if (!this.isConfigured()) {
      throw new Error("Qdrant is not configured. Please set QDRANT_URL in your .env file.");
    }

    const points = records.map((r, idx) => ({
      // Qdrant supports UUID or unsigned integer IDs. If r.id has a dash/string, generate a deterministic hash or uuid
      id: r.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? r.id
        : Math.abs(r.id.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0) + idx),
      vector: r.values,
      payload: {
        ...r.metadata,
        originalId: r.id,
        namespace: namespace || r.metadata?.projectId || "default",
      },
    }));

    const response = await fetch(`${this.url}/collections/${this.collection}/points?wait=true`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify({ points }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Qdrant Upsert Error (${response.status}): ${err}`);
    }

    return { count: records.length };
  }

  async query(options: VectorQueryOptions): Promise<VectorQueryResult[]> {
    if (!this.isConfigured()) {
      throw new Error("Qdrant is not configured.");
    }

    const { vector, topK = 5, namespace } = options;

    const payload: any = {
      vector,
      limit: topK,
      with_payload: true,
      with_vector: false,
    };

    if (namespace) {
      payload.filter = {
        must: [
          {
            key: "namespace",
            match: { value: namespace },
          },
        ],
      };
    }

    const response = await fetch(`${this.url}/collections/${this.collection}/points/search`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Qdrant Search Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const resultList = data.result || [];

    return resultList.map((item: any) => ({
      id: item.payload?.originalId || String(item.id),
      score: item.score,
      metadata: item.payload || {},
    }));
  }

  async delete(ids: string[]): Promise<{ deleted: number }> {
    if (!this.isConfigured()) {
      throw new Error("Qdrant is not configured.");
    }

    const response = await fetch(`${this.url}/collections/${this.collection}/points/delete`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        points: ids,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Qdrant Delete Error: ${err}`);
    }

    return { deleted: ids.length };
  }

  async deleteNamespace(namespace: string): Promise<{ deleted: number }> {
    if (!this.isConfigured()) {
      throw new Error("Qdrant is not configured.");
    }

    const response = await fetch(`${this.url}/collections/${this.collection}/points/delete`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        filter: {
          must: [{ key: "namespace", match: { value: namespace } }],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Qdrant Delete Filter Error: ${err}`);
    }

    return { deleted: 1 };
  }

  async getStats(): Promise<VectorStoreStats> {
    if (!this.isConfigured()) {
      return {
        provider: "qdrant",
        totalVectors: 0,
        status: "error",
        message: "QDRANT_URL is missing in .env",
      };
    }

    try {
      const response = await fetch(`${this.url}/collections/${this.collection}`, {
        headers: this.headers(),
      });

      if (!response.ok) {
        return {
          provider: "qdrant",
          totalVectors: 0,
          status: "error",
          message: `Qdrant collection returned HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const pointsCount = data.result?.points_count || 0;

      return {
        provider: "qdrant",
        totalVectors: pointsCount,
        status: "connected",
        message: `Connected to Qdrant collection '${this.collection}'`,
      };
    } catch (err: any) {
      return {
        provider: "qdrant",
        totalVectors: 0,
        status: "error",
        message: err.message,
      };
    }
  }
}
