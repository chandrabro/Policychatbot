import { NextRequest, NextResponse } from "next/server";
import { readIndex } from "@/lib/indexStore";
import { topKByCosine } from "@/lib/search";
import { generateAnswer } from "@/lib/answer";

export const runtime = "nodejs";
export const maxDuration = 45;

const TOP_K = 6;

export async function POST(req: NextRequest) {
  const { question, embedding } = (await req.json()) as {
    question?: string;
    embedding?: number[];
  };

  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return NextResponse.json({ error: "Missing question embedding." }, { status: 400 });
  }

  try {
    const index = await readIndex();
    if (index.length === 0) {
      return NextResponse.json({
        answer:
          "No policies have been indexed yet. An admin needs to add them first via /admin.",
        sources: [],
      });
    }

    const topChunks = topKByCosine(index, embedding, TOP_K);
    const answer = await generateAnswer(question.trim(), topChunks);

    const seen = new Set<string>();
    const sources = topChunks
      .filter((c) => {
        const key = `${c.fileName}-${c.pageNumber}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((c) => ({ fileName: c.fileName, pageNumber: c.pageNumber, blobUrl: c.blobUrl }));

    return NextResponse.json({ answer, sources });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Something went wrong answering that." },
      { status: 500 }
    );
  }
}

