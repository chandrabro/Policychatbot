import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong admin password." }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    hasBlobStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}
