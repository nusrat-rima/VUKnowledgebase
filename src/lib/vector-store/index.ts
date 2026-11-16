import { ENTRY_CONFIG } from "@/entry.config";
import { VectorStore } from "./types";
import { LocalVectorStore } from "./local";
import { PineconeVectorStore } from "./pinecone";
import { UpstashVectorStore } from "./upstash";
import { SupabaseVectorStore } from "./supabase";
import { QdrantVectorStore } from "./qdrant";

// Singleton stores to maintain state in serverless memory
let localStoreInstance: LocalVectorStore | null = null;
let pineconeStoreInstance: PineconeVectorStore | null = null;
let upstashStoreInstance: UpstashVectorStore | null = null;
let supabaseStoreInstance: SupabaseVectorStore | null = null;
let qdrantStoreInstance: QdrantVectorStore | null = null;

export function getVectorStore(): VectorStore {
  const provider = (
    process.env.VECTOR_DB_PROVIDER ||
    ENTRY_CONFIG.DEFAULT_VECTOR_DB_PROVIDER ||
    "local"
  ).toLowerCase().trim();

  switch (provider) {
    case "pinecone":
      if (!pineconeStoreInstance) {
        pineconeStoreInstance = new PineconeVectorStore();
      }
      return pineconeStoreInstance;

    case "upstash":
      if (!upstashStoreInstance) {
        upstashStoreInstance = new UpstashVectorStore();
      }
      return upstashStoreInstance;

    case "supabase":
      if (!supabaseStoreInstance) {
        supabaseStoreInstance = new SupabaseVectorStore();
      }
      return supabaseStoreInstance;

    case "qdrant":
      if (!qdrantStoreInstance) {
        qdrantStoreInstance = new QdrantVectorStore();
      }
      return qdrantStoreInstance;

    case "local":
    default:
      if (!localStoreInstance) {
        localStoreInstance = new LocalVectorStore();
      }
      return localStoreInstance;
  }
}

export * from "./types";
