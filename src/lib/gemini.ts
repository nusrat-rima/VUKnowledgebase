import { ENTRY_CONFIG, getGeminiApiKey } from "@/entry.config";

export interface EmbeddingResult {
  values: number[];
}

/**
 * Clean model name for Gemini API.
 * Ensures model has "models/" prefix when needed in request bodies.
 */
function normalizeModelName(model: string): string {
  const clean = model.replace(/^models\//, "");
  return clean || ENTRY_CONFIG.EMBEDDING_MODEL || "gemini-embedding-001";
}

/**
 * Generate embedding for a single text string using Gemini
 */
export async function getGeminiEmbedding(
  text: string,
  modelName: string = ENTRY_CONFIG.EMBEDDING_MODEL,
  dimensionality: number = 768
): Promise<number[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured! Please set GEMINI_API_KEY in src/entry.config.ts or in your .env.local file."
    );
  }

  const model = normalizeModelName(modelName);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

  const requestBody: any = {
    model: `models/${model}`,
    content: {
      parts: [{ text }],
    },
  };
  if (dimensionality) {
    requestBody.outputDimensionality = dimensionality;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Try fallback to text-embedding-004 if gemini-embedding-001 returned 404 in certain regions
    if (response.status === 404 && model === "gemini-embedding-001") {
      console.warn("gemini-embedding-001 returned 404, attempting fallback to text-embedding-004...");
      return getGeminiEmbedding(text, "text-embedding-004", dimensionality);
    }
    throw new Error(`Gemini Embedding API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data?.embedding?.values) {
    throw new Error("Invalid response format from Gemini Embedding API: missing embedding.values");
  }

  const rawValues = data.embedding.values;
  return dimensionality && rawValues.length > dimensionality
    ? rawValues.slice(0, dimensionality)
    : rawValues;
}

/**
 * Batch generate embeddings for multiple texts using Gemini batchEmbedContents
 */
export async function getGeminiBatchEmbeddings(
  texts: string[],
  modelName: string = ENTRY_CONFIG.EMBEDDING_MODEL,
  onProgress?: (completed: number, total: number) => void,
  dimensionality: number = 768
): Promise<number[][]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured! Please set GEMINI_API_KEY in src/entry.config.ts or in your .env.local file."
    );
  }

  const model = normalizeModelName(modelName);
  const batchSize = 25; // Safe batch size for Gemini API requests
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`;

    const requests = slice.map((t) => {
      const req: any = {
        model: `models/${model}`,
        content: {
          parts: [{ text: t }],
        },
      };
      if (dimensionality) {
        req.outputDimensionality = dimensionality;
      }
      return req;
    });

    let retries = 3;
    let success = false;
    let lastError: any = null;

    while (retries > 0 && !success) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requests }),
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 404 && model === "gemini-embedding-001") {
            // Fallback for batch
            return getGeminiBatchEmbeddings(texts, "text-embedding-004", onProgress, dimensionality);
          }
          if (response.status === 429) {
            // Rate limit, wait with backoff
            await new Promise((r) => setTimeout(r, 2000 * (4 - retries)));
            retries--;
            continue;
          }
          throw new Error(`Gemini Batch Embedding API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        if (!data.embeddings || !Array.isArray(data.embeddings)) {
          throw new Error("Invalid response from Gemini Batch Embedding: embeddings array missing");
        }

        for (const item of data.embeddings) {
          let vals: number[] = item.values;
          if (dimensionality && vals.length > dimensionality) {
            vals = vals.slice(0, dimensionality);
          }
          allEmbeddings.push(vals);
        }

        success = true;
      } catch (err) {
        lastError = err;
        retries--;
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    if (!success) {
      throw lastError || new Error("Failed to generate batch embeddings after retries");
    }

    if (onProgress) {
      onProgress(allEmbeddings.length, texts.length);
    }
  }

  return allEmbeddings;
}
