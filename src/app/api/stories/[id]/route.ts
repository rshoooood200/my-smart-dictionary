import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * دالة تنظيف المحتوى من أي بيانات فاسدة أو خطيرة
 */
function cleanStoryContent(text: string): string {
  if (!text) return '';
  
  let result = text;

  // إزالة الأنماط المشوهة
  result = result.replace(/(\w+(?:\s+\w+)?)\s*['"]?\s*data-[a-z-]+\s*=\s*['"][^'"]*['"][^>]*>\s*\1/gi, '$1');
  result = result.replace(/(\w+(?:\s+\w+)?)\s*["'>]+\s*\1\b/gi, '$1');

  // إزالة script tags
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/javascript:/gi, '');

  // إزالة HTML tags
  result = result.replace(/<\/?span[^>]*>/gi, '');
  result = result.replace(/<\/?div[^>]*>/gi, '');
  result = result.replace(/<[^>]+>/g, '');

  // إزالة data-* و class attributes
  result = result
    .replace(/\s*data-[a-z-]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s*data-[a-z-]+\s*=\s*'[^']*'/gi, '')
    .replace(/\s*class\s*=\s*["'][^"']*["']/gi, '');

  // إزالة نص عربي داخل quotes
  result = result.replace(/\s*['"][\u0600-\u06FF\s]+['"]/g, '');

  // إزالة بقايا quotes
  result = result
    .replace(/"\s*>/g, '')
    .replace(/'\s*>/g, '')
    .replace(/\s*>\s*/g, ' ')
    .replace(/["']/g, '');

  // تنظيف المسافات
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

// GET - جلب قصة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const story = await db.story.findUnique({
      where: { id },
      include: {
        storyWords: {
          include: {
            word: true
          }
        },
        questions: true
      }
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: 'القصة غير موجودة' },
        { status: 404 }
      );
    }

    // تحويل الأسئلة - options مخزنة كـ JSON string
    const storyWithParsedQuestions = {
      ...story,
      questions: story.questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }))
    };

    return NextResponse.json({ 
      success: true, 
      data: storyWithParsedQuestions 
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}

// PUT - تحديث قصة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      title, titleAr, content, contentAr, level,
      readingTime, wordCount, isFavorite, isRead 
    } = body;

    // تنظيف المحتوى قبل التحديث
    const cleanedTitle = title ? cleanStoryContent(title) : undefined;
    const cleanedTitleAr = titleAr !== undefined ? (titleAr ? cleanStoryContent(titleAr) : null) : undefined;
    const cleanedContent = content ? cleanStoryContent(content) : undefined;
    const cleanedContentAr = contentAr !== undefined ? (contentAr ? cleanStoryContent(contentAr) : null) : undefined;

    const story = await db.story.update({
      where: { id },
      data: {
        ...(cleanedTitle && { title: cleanedTitle }),
        ...(cleanedTitleAr !== undefined && { titleAr: cleanedTitleAr }),
        ...(cleanedContent && { content: cleanedContent }),
        ...(cleanedContentAr !== undefined && { contentAr: cleanedContentAr }),
        ...(level && { level }),
        ...(readingTime !== undefined && { readingTime }),
        ...(wordCount !== undefined && { wordCount }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(isRead !== undefined && { isRead })
      }
    });

    return NextResponse.json({ success: true, data: story });
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update story' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث جزئي للقصة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isFavorite, isRead } = body;

    const updateData: Record<string, unknown> = {};
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (isRead !== undefined) updateData.isRead = isRead;

    const story = await db.story.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: story });
  } catch (error) {
    console.error('Error patching story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update story' },
      { status: 500 }
    );
  }
}

// DELETE - حذف قصة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // سيتم حذف storyWords و questions تلقائياً بسبب onDelete: Cascade
    await db.story.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف القصة بنجاح' 
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete story' },
      { status: 500 }
    );
  }
}
