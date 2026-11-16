/**
 * ==============================================================================
 * 🚀 APPLICATION ENTRY CONFIGURATION FILE
 * ==============================================================================
 * 
 * You can put your Google Gemini API key and Vector Database configuration directly
 * in this file, or supply them through environment variables (.env.local or Vercel).
 * 
 * The application prioritizes keys placed in this file. If left blank (""),
 * it automatically falls back to process.env.
 */

export const ENTRY_CONFIG = {
  /**
   * 1. GOOGLE GEMINI API KEY
   * Paste your Gemini API key below:
   * e.g., "AIzaSy..."
   * If left as "", it reads from process.env.GEMINI_API_KEY
   */
  GEMINI_API_KEY: "" as string,

  /**
   * 2. EMBEDDING MODEL
   * Requested model: "gemini-embedding-001"
   * (You can also change to "text-embedding-004" or "embedding-001" if desired)
   */
  EMBEDDING_MODEL: "gemini-embedding-001",

  /**
   * 3. ADMIN PANEL CREDENTIALS
   * Default credentials for logging into the admin panel.
   */
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  JWT_SECRET: process.env.JWT_SECRET || "gemini-vector-admin-super-secure-secret-key-32chars",

  /**
   * 4. VECTOR DATABASE CONFIGURATION (Default Fallback)
   * You can configure your Vector DB here or in your .env / .env.local file.
   * Supported providers: 'pinecone' | 'upstash' | 'supabase' | 'qdrant' | 'local'
   */
  DEFAULT_VECTOR_DB_PROVIDER: (process.env.VECTOR_DB_PROVIDER as "pinecone" | "upstash" | "supabase" | "qdrant" | "local") || "local",

  /**
   * 5. DEFAULT CHUNKING PARAMETERS
   * Default chunk size and overlap when splitting text.
   */
  DEFAULT_CHUNK_SIZE: 800, // characters per chunk
  DEFAULT_CHUNK_OVERLAP: 150, // overlapping characters between chunks
};

/**
 * Returns the effective Gemini API key
 */
export function getGeminiApiKey(): string {
  const directKey = (ENTRY_CONFIG.GEMINI_API_KEY || "").trim();
  if (directKey.length > 0) {
    return directKey;
  }
  return (process.env.GEMINI_API_KEY || "").trim();
}

/**
 * Validates whether the Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
  return getGeminiApiKey().length > 5;
}
