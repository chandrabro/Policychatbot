import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!process.env.ADMIN_PASSWORD || clientPayload !== process.env.ADMIN_PASSWORD) {
          throw new Error("Wrong admin password.");
        }
        return {
          allowedContentTypes: ["application/pdf", "application/octet-stream", "*/*"],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op — the admin page tracks the resulting URL itself and saves
        // it into the index in a separate call.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
