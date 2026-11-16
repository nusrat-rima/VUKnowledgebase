import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { getVectorStore } from "@/lib/vector-store";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = dataStore.getDocument(params.id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ document: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = dataStore.getDocument(params.id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Attempt to delete chunk vectors from vector DB
    try {
      const vectorStore = getVectorStore();
      const chunkIds = Array.from({ length: doc.totalChunks || 0 }, (_, i) => `${doc.id}_chunk_${i}`);
      if (chunkIds.length > 0) {
        await vectorStore.delete(chunkIds, doc.projectId);
      }
    } catch (vErr) {
      console.warn("Could not delete vectors from vector store:", vErr);
    }

    const deleted = dataStore.deleteDocument(params.id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
