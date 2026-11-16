export type DocumentSourceType = 'file' | 'web' | 'text';

export type DocumentStatus = 
  | 'queued' 
  | 'parsing' 
  | 'chunking' 
  | 'embedding' 
  | 'storing' 
  | 'completed' 
  | 'failed';

export interface Project {
  id: string;
  name: string;
  description: string;
  vectorNamespace: string;
  chunkSize: number;
  chunkOverlap: number;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  chunkCount: number;
  vectorCount: number;
}

export interface DocumentChunkMetadata {
  documentId: string;
  projectId: string;
  documentTitle: string;
  sourceType: DocumentSourceType;
  sourceUrl?: string;
  chunkIndex: number;
  totalChunks: number;
  text: string;
  timestamp: string;
  [key: string]: any;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  projectId: string;
  chunkIndex: number;
  text: string;
  metadata: DocumentChunkMetadata;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  title: string;
  sourceType: DocumentSourceType;
  sourceUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: DocumentStatus;
  progress: number; // 0 - 100
  currentStage: string;
  totalChunks: number;
  embeddedChunks: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface BackgroundJob {
  id: string;
  documentId: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  stage: string;
  progress: number;
  logs: string[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: DocumentChunkMetadata;
}

export interface VectorQueryOptions {
  vector: number[];
  topK?: number;
  namespace?: string;
  filter?: Record<string, any>;
}

export interface VectorQueryResult {
  id: string;
  score: number;
  metadata: DocumentChunkMetadata;
}
