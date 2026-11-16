import { DocumentChunk, DocumentChunkMetadata, DocumentSourceType } from "../types";

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  documentId: string;
  projectId: string;
  documentTitle: string;
  sourceType: DocumentSourceType;
  sourceUrl?: string;
}

/**
 * Splits text into overlapping chunks respecting paragraph and sentence boundaries
 */
export function chunkText(text: string, options: ChunkOptions): DocumentChunk[] {
  const {
    chunkSize = 800,
    chunkOverlap = 150,
    documentId,
    projectId,
    documentTitle,
    sourceType,
    sourceUrl,
  } = options;

  const cleanText = text.replace(/\r\n/g, "\n").trim();
  if (!cleanText) return [];

  const rawChunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex >= cleanText.length) {
      const slice = cleanText.substring(startIndex).trim();
      if (slice.length > 0) {
        rawChunks.push(slice);
      }
      break;
    }

    // Try finding natural break points: paragraph break -> sentence break -> space
    let splitIndex = -1;

    // Look for paragraph break in the last 20% of the chunk window
    const searchWindow = cleanText.substring(Math.max(startIndex, endIndex - 150), endIndex + 50);
    const paraIndex = searchWindow.lastIndexOf("\n\n");
    if (paraIndex !== -1) {
      splitIndex = Math.max(startIndex, endIndex - 150) + paraIndex + 2;
    } else {
      // Look for sentence boundary (. ! ?)
      const sentenceMatch = searchWindow.match(/([.!?])\s+[A-Z0-9]/g);
      if (sentenceMatch && sentenceMatch.length > 0) {
        const lastSentenceIndex = searchWindow.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]);
        if (lastSentenceIndex !== -1) {
          splitIndex = Math.max(startIndex, endIndex - 150) + lastSentenceIndex + 1;
        }
      }
    }

    // Fallback to space
    if (splitIndex === -1 || splitIndex <= startIndex) {
      const spaceIndex = cleanText.lastIndexOf(" ", endIndex);
      if (spaceIndex > startIndex) {
        splitIndex = spaceIndex + 1;
      } else {
        splitIndex = endIndex;
      }
    }

    const chunkContent = cleanText.substring(startIndex, splitIndex).trim();
    if (chunkContent.length > 0) {
      rawChunks.push(chunkContent);
    }

    // Advance with overlap
    startIndex = Math.max(startIndex + 1, splitIndex - chunkOverlap);
  }

  const totalChunks = rawChunks.length;
  const timestamp = new Date().toISOString();

  return rawChunks.map((chunkStr, index) => {
    const chunkId = `${documentId}_chunk_${index}`;
    const metadata: DocumentChunkMetadata = {
      documentId,
      projectId,
      documentTitle,
      sourceType,
      sourceUrl,
      chunkIndex: index,
      totalChunks,
      text: chunkStr,
      timestamp,
      tokenEstimate: Math.ceil(chunkStr.length / 4),
    };

    return {
      id: chunkId,
      documentId,
      projectId,
      chunkIndex: index,
      text: chunkStr,
      metadata,
    };
  });
}
