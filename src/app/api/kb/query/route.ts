import { NextResponse } from "next/server";
import { getGeminiApiKey, ENTRY_CONFIG } from "@/entry.config";
import { getGeminiEmbedding } from "@/lib/gemini";
import { getVectorStore } from "@/lib/vector-store";
import { dataStore } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const { query, projectId, mode = "search" } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const startTime = Date.now();
    const apiKey = getGeminiApiKey();

    // 1. Generate query embedding with gemini-embedding-001
    const queryVector = await getGeminiEmbedding(query.trim(), ENTRY_CONFIG.EMBEDDING_MODEL);

    // 2. Query NeonDB / active Vector DB
    const vectorStore = getVectorStore();
    const matches = await vectorStore.query({
      vector: queryVector,
      topK: 6,
      namespace: projectId && projectId !== "all" ? projectId : undefined,
    });

    let aiAnswer: string | null = null;

    // 3. If "ask" mode is requested and we have matches, synthesize answer with Gemini
    if (mode === "ask" && matches.length > 0 && apiKey) {
      const contextText = matches
        .map(
          (m, idx) =>
            `[Source ${idx + 1}: ${m.metadata?.documentTitle || "Document"}${
              m.metadata?.sourceUrl ? ` (${m.metadata.sourceUrl})` : ""
            }]\n${m.metadata?.text || ""}`
        )
        .join("\n\n---\n\n");

      const prompt = `You are the VuKnowledgeBase AI Assistant. Answer the user's question clearly, accurately, and concisely based strictly on the provided context retrieved from our knowledge base (which includes PDFs, website scrapes, and documents).
Always cite the source titles or numbers where appropriate. If the context does not contain enough information to answer the question, state that politely.

Question:
${query}

Context from VuKnowledgeBase:
${contextText}

Answer:`;

      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-3-flash-preview",
        "gemini-flash-latest",
        "gemini-3.5-flash-lite",
      ];

      for (const m of modelsToTry) {
        try {
          const genRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 1024,
                },
              }),
            }
          );

          if (genRes.ok) {
            const genData = await genRes.json();
            aiAnswer =
              genData.candidates?.[0]?.content?.parts?.[0]?.text || null;
            if (aiAnswer) break;
          }
        } catch (genErr) {
          console.warn(`AI generation error with ${m}:`, genErr);
        }
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query: query.trim(),
      answer: aiAnswer,
      sources: matches,
      count: matches.length,
      provider: vectorStore.providerName,
      executionTimeMs,
    });
  } catch (error: any) {
    console.error("VuKnowledgeBase query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
