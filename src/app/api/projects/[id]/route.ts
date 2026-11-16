import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { getVectorStore } from "@/lib/vector-store";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = dataStore.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = dataStore.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete vectors in vector DB under this project namespace
    try {
      const vectorStore = getVectorStore();
      await vectorStore.deleteNamespace(project.vectorNamespace);
    } catch (vErr) {
      console.warn("Could not delete vector namespace:", vErr);
    }

    const deleted = dataStore.deleteProject(params.id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
