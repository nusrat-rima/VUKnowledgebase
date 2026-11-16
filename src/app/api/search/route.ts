import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { getGeminiEmbedding } from "@/lib/gemini";
import { getVectorStore } from "@/lib/vector-store";
import { ENTRY_CONFIG } from "@/entry.config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, projectId, topK = 5 } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query text cannot be empty" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = dataStore.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const startTime = Date.now();

    // 1. Generate embedding for query text with Gemini
    const queryVector = await getGeminiEmbedding(query.trim(), ENTRY_CONFIG.EMBEDDING_MODEL);

    // 2. Query the vector database
    const vectorStore = getVectorStore();
    const matches = await vectorStore.query({
      vector: queryVector,
      topK: Math.min(20, Math.max(1, parseInt(String(topK), 10) || 5)),
      namespace: project.vectorNamespace,
    });

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query: query.trim(),
      project: {
        id: project.id,
        name: project.name,
      },
      matches,
      matchCount: matches.length,
      provider: vectorStore.providerName,
      model: ENTRY_CONFIG.EMBEDDING_MODEL,
      executionTimeMs,
    });
  } catch (error: any) {
    console.error("Vector search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
