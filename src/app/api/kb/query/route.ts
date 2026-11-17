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

    const NO_RESULTS_RESPONSE =
      "Thank you for reaching out to the Varendra University Knowledge Base. No results found for this inquiry as it is not related to Varendra University, Rajshahi. If you have any questions regarding our university admissions, faculties, programs, tuition fees, scholarships, or campus facilities, we will be glad to assist you!";

    let aiAnswer: string | null = null;
    let finalSources = matches;

    // 3. If "ask" mode is requested, synthesize answer with Gemini
    if (mode === "ask") {
      if (matches.length === 0) {
        aiAnswer = NO_RESULTS_RESPONSE;
        finalSources = [];
      } else if (apiKey) {
        const contextText = matches
          .map(
            (m, idx) =>
              `[Source ${idx + 1}: ${m.metadata?.documentTitle || "Document"}${
                m.metadata?.sourceUrl ? ` (${m.metadata.sourceUrl})` : ""
              }]\n${m.metadata?.text || ""}`
          )
          .join("\n\n---\n\n");

        const prompt = `You are the official Varendra University (VU), Rajshahi Knowledge Base Assistant.
Your sole purpose is to provide official, accurate information specifically about Varendra University, Rajshahi (admissions, tuition fees, faculties, academic curricula, rules, policies, campus facilities, transport, notices, etc.).

CRITICAL RULES:
1. RELEVANCE CHECK: If the user's question is NOT related to Varendra University, OR if the question asks about unrelated topics (such as general knowledge, cooking, general coding, other institutions, personal advice, etc.), OR if the provided university context does not contain relevant information to answer the question:
   You MUST respond EXACTLY with this thankful message:
   "Thank you for reaching out to the Varendra University Knowledge Base. No results found for this inquiry as it is not related to Varendra University, Rajshahi. If you have any questions regarding our university admissions, faculties, programs, tuition fees, scholarships, or campus facilities, we will be glad to assist you!"

2. Only if the question is genuinely related to Varendra University and supported by the context, provide a clear, accurate, and structured answer based strictly on the provided context, citing source titles or numbers where appropriate.

Question: ${query}

Context from Varendra University Knowledge Base:
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
                    temperature: 0.1,
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

        if (!aiAnswer) {
          aiAnswer = NO_RESULTS_RESPONSE;
        }

        // If the answer is an unrelated / no results message, clear out misleading source cards
        if (
          aiAnswer.includes("No results found") ||
          aiAnswer.includes("not related to Varendra University")
        ) {
          finalSources = [];
        }
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query: query.trim(),
      answer: aiAnswer,
      sources: finalSources,
      count: finalSources.length,
      provider: vectorStore.providerName,
      executionTimeMs,
    });
  } catch (error: any) {
    console.error("VuKnowledgeBase query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
