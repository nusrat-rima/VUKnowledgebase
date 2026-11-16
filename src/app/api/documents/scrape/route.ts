import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { processDocumentInBackground } from "@/lib/background-worker";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, url, urls } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = dataStore.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const targetUrls: string[] = [];
    if (url && typeof url === "string") {
      targetUrls.push(url.trim());
    }
    if (Array.isArray(urls)) {
      targetUrls.push(...urls.map((u: string) => u.trim()).filter(Boolean));
    }

    if (targetUrls.length === 0) {
      return NextResponse.json({ error: "At least one valid website URL is required" }, { status: 400 });
    }

    const results = [];

    for (const targetUrl of targetUrls) {
      // Create document record
      const doc = dataStore.createDocument({
        projectId,
        title: targetUrl,
        sourceType: "web",
        sourceUrl: targetUrl,
        status: "queued",
        progress: 0,
        currentStage: "Queued for web scraping & conversion...",
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

      // Run background ingestion asynchronously
      processDocumentInBackground({
        documentId: doc.id,
        projectId,
        webUrl: targetUrl,
        jobId: job.id,
      }).catch((err) => {
        console.error(`Background worker failed for ${doc.id}:`, err);
      });

      results.push({
        documentId: doc.id,
        jobId: job.id,
        url: targetUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${results.length} website(s) for background extraction and vectorization.`,
      documents: results,
    });
  } catch (error: any) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
