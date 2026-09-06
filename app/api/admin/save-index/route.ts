import { NextRequest, NextResponse } from "next/server";
import { readIndex, writeIndex } from "@/lib/indexStore";
import type { IndexEntry } from "@/lib/search";

type IncomingEntry = { pageNumber: number; text: string; embedding: number[] };

export async function POST(req: NextRequest) {
  const { password, fileName, blobUrl, entries } = (await req.json()) as {
    password?: string;
    fileName?: string;
    blobUrl?: string;
    entries?: IncomingEntry[];
  };

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong admin password." }, { status: 401 });
  }
  if (!fileName || !blobUrl || !Array.isArray(entries)) {
    return NextResponse.json(
      { error: "Missing fileName, blobUrl, or entries." },
      { status: 400 }
    );
  }

  const existing = await readIndex();
  const withoutThisFile = existing.filter((e) => e.fileName !== fileName);

  const newEntries: IndexEntry[] = entries.map((e) => ({
    fileName,
    blobUrl,
    pageNumber: e.pageNumber,
    text: e.text,
    embedding: e.embedding,
  }));

  const combined = [...withoutThisFile, ...newEntries];
  await writeIndex(combined);

  return NextResponse.json({ ok: true, chunksForThisFile: newEntries.length, totalChunks: combined.length });
}
