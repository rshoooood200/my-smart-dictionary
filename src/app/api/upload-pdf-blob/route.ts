import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

// Increase timeout for large file uploads
export const maxDuration = 60;

// Route for client-side upload - generates token and handles callback
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('PDF upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
