import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { put } from '@vercel/blob';

// Generate upload URL for client-side direct upload to Vercel Blob
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

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

    // Return the path only - don't expose the token
    return NextResponse.json({
      success: true,
      filePath,
    });

  } catch (error: any) {
    console.error('Token generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
