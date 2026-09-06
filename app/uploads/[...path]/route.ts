import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const relPath = params.path.join("/");
  const filePath = path.join(process.cwd(), "public", "uploads", relPath);

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
