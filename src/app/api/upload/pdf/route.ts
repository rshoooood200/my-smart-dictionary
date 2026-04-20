import { NextRequest, NextResponse } from 'next/server';

// Upload PDF - Simple base64 storage for now
export async function POST(req: NextRequest) {
  console.log('PDF Upload: Starting...');

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const titleAr = formData.get('titleAr') as string | null;

    console.log('PDF Upload: File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });

    if (!file) {
      console.log('PDF Upload: No file provided');
      return NextResponse.json(
        { error: 'الملف مطلوب' },
        { status: 400 }
      );
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      console.log('PDF Upload: Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'يجب أن يكون الملف بصيغة PDF' },
        { status: 400 }
      );
    }

    // Check file size (max 5MB for base64 storage)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('PDF Upload: File too large:', file.size);
      return NextResponse.json(
        { error: 'حجم الملف يجب أن لا يتجاوز 5 ميجابايت' },
        { status: 400 }
      );
    }

    console.log('PDF Upload: Converting to base64...');

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    console.log('PDF Upload: Success, base64 length:', dataUrl.length);

    return NextResponse.json({
      success: true,
      pdfUrl: dataUrl,
      pdfTitle: title || file.name.replace('.pdf', ''),
      pdfTitleAr: titleAr || title || file.name.replace('.pdf', ''),
      pdfSize: file.size,
      pdfPages: 0,
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
