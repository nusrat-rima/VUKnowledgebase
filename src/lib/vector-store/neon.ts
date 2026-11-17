import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { VectorRecord, VectorQueryOptions, VectorQueryResult } from "../types";
import { VectorStore, VectorStoreStats } from "./types";
import { ENTRY_CONFIG } from "@/entry.config";

export class NeonVectorStore implements VectorStore {
  readonly providerName = "neon";
  private connectionString: string;
  private sql: NeonQueryFunction<false, false> | null = null;
  private tableInitialized = false;
  private tableName: string;

  constructor() {
    this.connectionString =
      process.env.NEON_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      ENTRY_CONFIG.NEON_DATABASE_URL ||
      "";
    this.tableName = process.env.NEON_TABLE || "document_embeddings";

    if (this.connectionString) {
      this.sql = neon(this.connectionString);
    }
  }

  private isConfigured(): boolean {
    return !!this.connectionString && !!this.sql;
  }

  /**
   * Automatically ensure pgvector extension and table exist in Neon
   */
  private async ensureTable() {
    if (this.tableInitialized || !this.sql) return;

    try {
      // Enable pgvector extension
      await this.sql`CREATE EXTENSION IF NOT EXISTS vector;`;

      // Create embeddings table if it doesn't exist
      // Using vector(768) which corresponds to gemini-embedding-001
      await this.sql`
        CREATE TABLE IF NOT EXISTS document_embeddings (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          embedding vector(768) NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create index on project_id for fast namespace filtering
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_doc_embeddings_project 
        ON document_embeddings (project_id);
      `;

      this.tableInitialized = true;
    } catch (err: any) {
      console.warn("Failed to auto-initialize Neon pgvector table:", err?.message || err);
    }
  }

  async upsert(records: VectorRecord[], namespace?: string): Promise<{ count: number }> {
    if (!this.isConfigured() || !this.sql) {
      throw new Error(
        "Neon DB is not configured. Please set NEON_DATABASE_URL or DATABASE_URL in your .env file."
      );
    }

    await this.ensureTable();

    const targetNamespace = namespace || "default";

    // Upsert records
    for (const record of records) {
      // Ensure vector length matches 768 dimensions expected by pgvector
      let values = record.values;
      if (values.length > 768) {
        values = values.slice(0, 768);
      }
      const vectorStr = `[${values.join(",")}]`;
      const metadataJson = JSON.stringify(record.metadata || {});
      const projectId = namespace || record.metadata?.projectId || targetNamespace;

      await this.sql`
        INSERT INTO document_embeddings (id, project_id, embedding, metadata)
        VALUES (${record.id}, ${projectId}, ${vectorStr}::vector, ${metadataJson}::jsonb)
        ON CONFLICT (id) DO UPDATE 
        SET project_id = EXCLUDED.project_id,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata;
      `;
    }

    return { count: records.length };
  }

  async query(options: VectorQueryOptions): Promise<VectorQueryResult[]> {
    if (!this.isConfigured() || !this.sql) {
      throw new Error("Neon DB is not configured. Please set NEON_DATABASE_URL or DATABASE_URL.");
    }

    await this.ensureTable();

    const { vector, topK = 5, namespace } = options;
    let queryVector = vector;
    if (queryVector.length > 768) {
      queryVector = queryVector.slice(0, 768);
    }
    const vectorStr = `[${queryVector.join(",")}]`;

    let rows: any[] = [];

    if (namespace) {
      rows = await this.sql`
        SELECT 
          id,
          metadata,
          1 - (embedding <=> ${vectorStr}::vector) AS score
        FROM document_embeddings
        WHERE project_id = ${namespace}
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${topK};
      `;
    } else {
      rows = await this.sql`
        SELECT 
          id,
          metadata,
          1 - (embedding <=> ${vectorStr}::vector) AS score
        FROM document_embeddings
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${topK};
      `;
    }

    return rows.map((row) => ({
      id: row.id,
      score: Math.max(0, Math.min(1, parseFloat(row.score) || 0)),
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || {}),
    }));
  }

  async delete(ids: string[]): Promise<{ deleted: number }> {
    if (!this.isConfigured() || !this.sql) {
      throw new Error("Neon DB is not configured.");
    }

    if (ids.length === 0) return { deleted: 0 };

    await this.sql`
      DELETE FROM document_embeddings 
      WHERE id = ANY(${ids});
    `;

    return { deleted: ids.length };
  }

  async deleteNamespace(namespace: string): Promise<{ deleted: number }> {
    if (!this.isConfigured() || !this.sql) {
      throw new Error("Neon DB is not configured.");
    }

    await this.sql`
      DELETE FROM document_embeddings 
      WHERE project_id = ${namespace};
    `;

    return { deleted: 1 };
  }

  async getStats(namespace?: string): Promise<VectorStoreStats> {
    if (!this.isConfigured() || !this.sql) {
      return {
        provider: "neondb",
        totalVectors: 0,
        status: "error",
        message: "NEON_DATABASE_URL or DATABASE_URL is missing in .env",
      };
    }

    try {
      await this.ensureTable();

      let total = 0;
      const namespaces: Record<string, number> = {};

      const countRows = await this.sql`
        SELECT project_id, COUNT(*)::int as count 
        FROM document_embeddings 
        GROUP BY project_id;
      `;

      for (const row of countRows) {
        namespaces[row.project_id] = row.count;
        total += row.count;
      }

      return {
        provider: "neondb (pgvector)",
        totalVectors: namespace ? (namespaces[namespace] || 0) : total,
        namespaces,
        dimension: 768,
        status: "connected",
        message: "Connected to Neon Serverless PostgreSQL with pgvector.",
      };
    } catch (err: any) {
      return {
        provider: "neondb",
        totalVectors: 0,
        status: "error",
        message: err.message,
      };
    }
  }
}
