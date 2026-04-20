import { NextRequest, NextResponse } from 'next/server';

// Route segment config - increase timeout for large files
export const maxDuration = 60;

// This endpoint handles PDF uploads
// For large files, we use direct upload via Vercel Blob's handleUpload
export async function POST(req: NextRequest) {
  console.log('PDF Upload API: Starting...');

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!blobToken) {
      console.error('PDF Upload: BLOB_READ_WRITE_TOKEN not found in environment');
      return NextResponse.json({ 
        error: 'خطأ في التكوين: BLOB_READ_WRITE_TOKEN غير موجود' 
      }, { status: 500 });
    }

    // For large file uploads, we need to handle the request differently
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const titleAr = formData.get('titleAr') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });
    }

    console.log('PDF Upload: File received:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type
    });

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'يجب أن يكون الملف بصيغة PDF' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم الملف يجب أن لا يتجاوز 50 ميجابايت' }, { status: 400 });
    }

    // Import put dynamically to ensure it's loaded
    const { put } = await import('@vercel/blob');

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const cleanName = file.name.replace(/[^\w\.\-]/g, '_').substring(0, 50);
    const fileName = `pdfs/${timestamp}-${randomId}-${cleanName}`;

    console.log('PDF Upload: Uploading to Vercel Blob:', fileName);

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
      contentType: 'application/pdf',
      token: blobToken,
    });

    console.log('PDF Upload: Upload complete!', blob.url);

    return NextResponse.json({
      success: true,
      pdfUrl: blob.url,
      pdfTitle: title || file.name.replace('.pdf', ''),
      pdfTitleAr: titleAr || title || file.name.replace('.pdf', ''),
      pdfSize: file.size,
      pdfPages: 0,
    });

  } catch (error: any) {
    console.error('PDF Upload Error:', error);
    
    const errorMessage = error?.message || 'خطأ غير معروف';
    
    if (errorMessage.includes('body size') || errorMessage.includes('too large') || errorMessage.includes('413')) {
      return NextResponse.json({ 
        error: 'حجم الملف كبير جداً على الخادم. تواصل مع الدعم الفني.' 
      }, { status: 413 });
    }
    
    return NextResponse.json({ 
      error: `فشل في رفع الملف: ${errorMessage}` 
    }, { status: 500 });
  }
}
