import { NextResponse } from "next/server";
import { ENTRY_CONFIG, isGeminiConfigured, getGeminiApiKey } from "@/entry.config";
import { getVectorStore } from "@/lib/vector-store";

export async function GET() {
  try {
    const rawKey = getGeminiApiKey();
    const hasKey = isGeminiConfigured();
    const keyMasked = hasKey ? `${rawKey.substring(0, 4)}...${rawKey.substring(rawKey.length - 4)}` : "Not Configured";
    const keySource = ENTRY_CONFIG.GEMINI_API_KEY ? "entry.config.ts" : (process.env.GEMINI_API_KEY ? ".env / Environment" : "None");

    const vectorStore = getVectorStore();
    const vectorStats = await vectorStore.getStats();

    return NextResponse.json({
      gemini: {
        configured: hasKey,
        keyMasked,
        keySource,
        model: ENTRY_CONFIG.EMBEDDING_MODEL,
      },
      vectorDb: {
        provider: vectorStore.providerName,
        stats: vectorStats,
      },
      admin: {
        username: ENTRY_CONFIG.ADMIN_USERNAME,
      },
      system: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
        entryConfigFile: "src/entry.config.ts",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
