import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Wrong admin password." }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "policies");
    await fs.mkdir(uploadDir, { recursive: true });

    const safeFileName = path.basename(file.name);
    const filePath = path.join(uploadDir, safeFileName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/policies/${encodeURIComponent(safeFileName)}`;
    return NextResponse.json({ url: fileUrl });
  } catch (err: any) {
    console.error("Local upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save file locally." },
      { status: 500 }
    );
  }
}
