import { handleUpload, type HandleUploadBody } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Validate the pathname
        if (!pathname.startsWith('pdfs/')) {
          throw new Error('Invalid upload path');
        }
        
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          tokenPayload: JSON.stringify({
            // Optional: Add user info or other metadata
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('PDF upload completed:', blob.url);
        // Optional: Update database or do other post-upload tasks
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
