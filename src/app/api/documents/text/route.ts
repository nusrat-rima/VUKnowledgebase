import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { processDocumentInBackground } from "@/lib/background-worker";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, title, content } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = dataStore.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Document content cannot be empty" }, { status: 400 });
    }

    const cleanTitle = (title || "").trim() || "Untitled Text Note";

    // Create document record
    const doc = dataStore.createDocument({
      projectId,
      title: cleanTitle,
      sourceType: "text",
      status: "queued",
      progress: 0,
      currentStage: "Queued for conversion...",
      totalChunks: 0,
      embeddedChunks: 0,
    });

    // Create background job
    const job = dataStore.createJob({
      documentId: doc.id,
      projectId,
      status: "pending",
      stage: "Queued",
      progress: 0,
    });

    // Process in background
    processDocumentInBackground({
      documentId: doc.id,
      projectId,
      rawText: content,
      jobId: job.id,
    }).catch((err) => {
      console.error(`Background worker failed for ${doc.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: "Queued text document for background conversion.",
      document: {
        documentId: doc.id,
        jobId: job.id,
        title: cleanTitle,
      },
    });
  } catch (error: any) {
    console.error("Text note error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
