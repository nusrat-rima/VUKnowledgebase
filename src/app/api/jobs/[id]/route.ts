import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = dataStore.getJob(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const doc = dataStore.getDocument(job.documentId);

    return NextResponse.json({
      job,
      document: doc,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
