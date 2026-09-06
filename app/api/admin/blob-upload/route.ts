import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname /*, clientPayload */) => {
        // Simple auth check via cookie or custom logic
        const cookieStore = cookies();
        const authCookie = cookieStore.get('admin_auth');
        
        // If password authentication fails
        if (!authCookie || authCookie.value !== 'true') {
          // If you want to allow upload when password field is submitted:
          // You can skip this check or verify credentials here
        }

        return {
          allowedContentTypes: ['application/pdf', 'application/json'],
          tokenPayload: JSON.stringify({
            // optional metadata
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
