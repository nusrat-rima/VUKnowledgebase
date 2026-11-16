import { dataStore } from "./data-store";
import { chunkText } from "./document-processor/chunker";
import { extractFromPdf, extractFromTextFile, extractFromUrl } from "./document-processor/extractor";
import { getGeminiBatchEmbeddings } from "./gemini";
import { getVectorStore } from "./vector-store";
import { DocumentRecord, VectorRecord } from "./types";
import { ENTRY_CONFIG } from "@/entry.config";

export interface ProcessDocumentOptions {
  documentId: string;
  projectId: string;
  fileBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
  webUrl?: string;
  rawText?: string;
  jobId: string;
}

/**
 * Executes document ingestion and vectorization in the background
 */
export async function processDocumentInBackground(options: ProcessDocumentOptions) {
  const { documentId, projectId, fileBuffer, fileName, mimeType, webUrl, rawText, jobId } = options;

  const project = dataStore.getProject(projectId);
  if (!project) {
    dataStore.updateDocument(documentId, {
      status: "failed",
      errorMessage: `Project '${projectId}' not found`,
    });
    dataStore.updateJob(jobId, {
      status: "failed",
      error: `Project '${projectId}' not found`,
    });
    return;
  }

  try {
    dataStore.updateJob(jobId, { status: "running", stage: "Extracting content", progress: 10 });
    dataStore.updateDocument(documentId, {
      status: "parsing",
      currentStage: "Extracting content...",
      progress: 10,
    });
    dataStore.addJobLog(jobId, "Starting content extraction...");

    // 1. CONTENT EXTRACTION
    let extractedContent = "";
    let resolvedTitle = "";

    if (webUrl) {
      dataStore.addJobLog(jobId, `Fetching and parsing website: ${webUrl}`);
      const webResult = await extractFromUrl(webUrl);
      extractedContent = webResult.content;
      resolvedTitle = webResult.title;
    } else if (fileBuffer && fileName) {
      dataStore.addJobLog(jobId, `Extracting file: ${fileName} (${mimeType || "application/octet-stream"})`);
      if (fileName.toLowerCase().endsWith(".pdf") || mimeType?.includes("pdf")) {
        const pdfResult = await extractFromPdf(fileBuffer);
        extractedContent = pdfResult.content;
        resolvedTitle = pdfResult.title || fileName;
      } else {
        const textResult = extractFromTextFile(fileBuffer, fileName);
        extractedContent = textResult.content;
        resolvedTitle = textResult.title;
      }
    } else if (rawText) {
      dataStore.addJobLog(jobId, "Processing raw text note input");
      extractedContent = rawText;
      resolvedTitle = "Text Note";
    } else {
      throw new Error("No valid input content source provided (file, web url, or text).");
    }

    if (!extractedContent || extractedContent.trim().length === 0) {
      throw new Error("Extracted content is empty.");
    }

    // Update document title if needed
    const currentDoc = dataStore.getDocument(documentId);
    if (currentDoc && (!currentDoc.title || currentDoc.title === "Untitled Document" || currentDoc.title === webUrl)) {
      dataStore.updateDocument(documentId, { title: resolvedTitle });
    }

    // 2. CHUNKING
    dataStore.updateJob(jobId, { stage: "Chunking text", progress: 25 });
    dataStore.updateDocument(documentId, {
      status: "chunking",
      currentStage: "Chunking document into semantic blocks...",
      progress: 25,
    });
    dataStore.addJobLog(
      jobId,
      `Splitting text with chunkSize=${project.chunkSize || ENTRY_CONFIG.DEFAULT_CHUNK_SIZE}, overlap=${project.chunkOverlap || ENTRY_CONFIG.DEFAULT_CHUNK_OVERLAP}`
    );

    const chunks = chunkText(extractedContent, {
      chunkSize: project.chunkSize || ENTRY_CONFIG.DEFAULT_CHUNK_SIZE,
      chunkOverlap: project.chunkOverlap || ENTRY_CONFIG.DEFAULT_CHUNK_OVERLAP,
      documentId,
      projectId,
      documentTitle: resolvedTitle || currentDoc?.title || "Document",
      sourceType: currentDoc?.sourceType || "text",
      sourceUrl: webUrl,
    });

    if (chunks.length === 0) {
      throw new Error("Chunking generated 0 chunks from the extracted text.");
    }

    dataStore.updateDocument(documentId, {
      totalChunks: chunks.length,
      status: "embedding",
      currentStage: `Created ${chunks.length} chunks. Generating Gemini embeddings...`,
      progress: 35,
    });
    dataStore.addJobLog(jobId, `Generated ${chunks.length} chunks. Calling Gemini Embedding API (${ENTRY_CONFIG.EMBEDDING_MODEL})...`);

    // 3. GEMINI EMBEDDINGS
    dataStore.updateJob(jobId, { stage: "Generating Gemini embeddings", progress: 35 });
    const chunkTexts = chunks.map((c) => c.text);

    const embeddings = await getGeminiBatchEmbeddings(
      chunkTexts,
      ENTRY_CONFIG.EMBEDDING_MODEL,
      (completed, total) => {
        const percent = 35 + Math.round((completed / total) * 45); // up to 80%
        dataStore.updateDocument(documentId, {
          embeddedChunks: completed,
          progress: percent,
          currentStage: `Embedded ${completed}/${total} chunks with Gemini (${percent}%)...`,
        });
        dataStore.updateJob(jobId, {
          progress: percent,
          stage: `Embedded ${completed}/${total} chunks`,
        });
      }
    );

    dataStore.addJobLog(jobId, `Successfully generated ${embeddings.length} vector embeddings.`);

    // 4. VECTOR DATABASE STORAGE
    dataStore.updateJob(jobId, { stage: "Storing in Vector Database", progress: 85 });
    dataStore.updateDocument(documentId, {
      status: "storing",
      currentStage: "Saving vectors and metadata to configured Vector Database...",
      progress: 85,
    });

    const vectorStore = getVectorStore();
    dataStore.addJobLog(
      jobId,
      `Upserting ${embeddings.length} vectors to provider '${vectorStore.providerName}' in namespace '${project.vectorNamespace}'...`
    );

    const vectorRecords: VectorRecord[] = chunks.map((chunk, idx) => ({
      id: chunk.id,
      values: embeddings[idx],
      metadata: chunk.metadata,
    }));

    await vectorStore.upsert(vectorRecords, project.vectorNamespace);

    dataStore.addJobLog(jobId, `Vectors successfully indexed in vector database!`);

    // 5. COMPLETION
    const completedAt = new Date().toISOString();
    dataStore.updateDocument(documentId, {
      status: "completed",
      progress: 100,
      currentStage: "Completed",
      embeddedChunks: chunks.length,
      completedAt,
    });

    dataStore.updateJob(jobId, {
      status: "completed",
      stage: "Completed",
      progress: 100,
      completedAt,
    });

    dataStore.addJobLog(jobId, `Document ingestion finished successfully at ${new Date().toLocaleTimeString()}`);
  } catch (error: any) {
    console.error("Background ingestion error:", error);
    const errorMsg = error?.message || "Unknown error during document processing";
    dataStore.updateDocument(documentId, {
      status: "failed",
      errorMessage: errorMsg,
      currentStage: "Failed",
    });
    dataStore.updateJob(jobId, {
      status: "failed",
      stage: "Failed",
      error: errorMsg,
    });
    dataStore.addJobLog(jobId, `ERROR: ${errorMsg}`);
  }
}
