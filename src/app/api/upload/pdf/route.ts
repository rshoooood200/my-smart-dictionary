import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Upload PDF - Try Vercel Blob first, fallback to base64 for small files
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const titleAr = formData.get('titleAr') as string | null;

    console.log('PDF Upload: Starting upload...', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });

    if (!file) {
      return NextResponse.json(
        { error: 'الملف مطلوب' },
        { status: 400 }
      );
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'يجب أن يكون الملف بصيغة PDF' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'حجم الملف يجب أن لا يتجاوز 10 ميجابايت' },
        { status: 400 }
      );
    }

    // Check if BLOB_READ_WRITE_TOKEN is available
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    console.log('PDF Upload: Blob token available:', !!blobToken);

    if (blobToken) {
      // Use Vercel Blob Storage
      try {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `pdf-books/${timestamp}-${randomId}-${safeFileName}`;

        console.log('PDF Upload: Uploading to Vercel Blob...', filename);

        const blob = await put(filename, file, {
          access: 'public',
          contentType: 'application/pdf',
        });

        console.log('PDF Upload: Blob upload successful', blob.url);

        return NextResponse.json({
          success: true,
          pdfUrl: blob.url,
          pdfTitle: title || file.name.replace('.pdf', ''),
          pdfTitleAr: titleAr || title || file.name.replace('.pdf', ''),
          pdfSize: file.size,
          pdfPages: 0,
          storageType: 'blob'
        });
      } catch (blobError) {
        console.error('PDF Upload: Blob upload failed, falling back to base64', blobError);
        // Fall through to base64 fallback
      }
    }

    // Fallback to base64 (only for files < 2MB to avoid database issues)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ملفات أكبر من 2 ميجابايت تحتاج إلى إعداد Vercel Blob. يرجى التواصل مع المطور.' },
        { status: 400 }
      );
    }

    console.log('PDF Upload: Converting to base64...');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    console.log('PDF Upload: Base64 conversion successful, size:', dataUrl.length);

    return NextResponse.json({
      success: true,
      pdfUrl: dataUrl,
      pdfTitle: title || file.name.replace('.pdf', ''),
      pdfTitleAr: titleAr || title || file.name.replace('.pdf', ''),
      pdfSize: file.size,
      pdfPages: 0,
      storageType: 'base64'
    });
  } catch (error) {
    console.error('PDF Upload Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'فشل في رفع الملف',
      },
      { status: 500 }
    );
  }
}
