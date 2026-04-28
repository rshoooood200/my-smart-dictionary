import { NextRequest, NextResponse } from 'next/server';

// Generate upload token for client-side direct upload to Vercel Blob
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: 'filename مطلوب' }, { status: 400 });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!blobToken) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN غير موجود' }, { status: 500 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const cleanName = filename.replace(/[^\w\.\-]/g, '_').substring(0, 50);
    const filePath = `pdfs/${timestamp}-${randomId}-${cleanName}`;

    // Return the path and token for client-side upload
    return NextResponse.json({
      success: true,
      filePath,
      token: blobToken,
    });

  } catch (error: any) {
    console.error('Token generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
