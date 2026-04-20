import { NextRequest, NextResponse } from 'next/server';

// Upload PDF and return base64 data URL
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const titleAr = formData.get('titleAr') as string | null;

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

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return NextResponse.json({
      success: true,
      pdfUrl: dataUrl,
      pdfTitle: title || file.name.replace('.pdf', ''),
      pdfTitleAr: titleAr || title || file.name.replace('.pdf', ''),
      pdfSize: file.size,
      pdfPages: 0, // We'll need a PDF library to count pages
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
