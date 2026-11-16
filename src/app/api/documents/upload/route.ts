import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { processDocumentInBackground } from "@/lib/background-worker";

export const maxDuration = 60; // Allow serverless function time for background processing

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const projectId = formData.get("projectId") as string;
    const files = formData.getAll("files") as File[];

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = dataStore.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const mimeType = file.type || "application/octet-stream";
      const fileSize = file.size;

      // Create document record in queued status
      const doc = dataStore.createDocument({
        projectId,
        title: fileName,
        sourceType: "file",
        fileName,
        fileSize,
        mimeType,
        status: "queued",
        progress: 0,
        currentStage: "Queued for conversion...",
        totalChunks: 0,
        embeddedChunks: 0,
      });

      // Create background job record
      const job = dataStore.createJob({
        documentId: doc.id,
        projectId,
        status: "pending",
        stage: "Queued",
        progress: 0,
      });

      // Launch background conversion asynchronously (non-blocking)
      // Note: We intentionally do not await here so the client gets an immediate response
      // while conversion executes in the background!
      processDocumentInBackground({
        documentId: doc.id,
        projectId,
        fileBuffer: buffer,
        fileName,
        mimeType,
        jobId: job.id,
      }).catch((err) => {
        console.error(`Background worker failed for ${doc.id}:`, err);
      });

      results.push({
        documentId: doc.id,
        jobId: job.id,
        fileName,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${results.length} document(s) for background conversion.`,
      documents: results,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
