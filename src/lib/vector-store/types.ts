import { VectorRecord, VectorQueryOptions, VectorQueryResult } from "../types";

export interface VectorStoreStats {
  provider: string;
  totalVectors: number;
  namespaces?: Record<string, number>;
  dimension?: number;
  status: "connected" | "fallback" | "error";
  message?: string;
}

export interface VectorStore {
  readonly providerName: string;
  
  /**
   * Upsert vector records into the vector database
   */
  upsert(records: VectorRecord[], namespace?: string): Promise<{ count: number }>;

  /**
   * Query the vector database for nearest neighbors using cosine similarity
   */
  query(options: VectorQueryOptions): Promise<VectorQueryResult[]>;

  /**
   * Delete vectors by IDs
   */
  delete(ids: string[], namespace?: string): Promise<{ deleted: number }>;

  /**
   * Delete all vectors under a specific project / namespace
   */
  deleteNamespace(namespace: string): Promise<{ deleted: number }>;

  /**
   * Get vector database statistics and health
   */
  getStats(namespace?: string): Promise<VectorStoreStats>;
}
