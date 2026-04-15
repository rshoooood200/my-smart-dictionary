import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeText } from '@/lib/auth-helpers';

/**
 * دالة تنظيف المحتوى من أي بيانات فاسدة أو خطيرة
 * هذه الدالة تضمن أن أي نص محفوظ في قاعدة البيانات نظيف 100%
 */
function cleanStoryContent(text: string): string {
  if (!text) return '';
  
  let result = text;

  // الخطوة 1: إزالة الأنماط المشوهة الكاملة
  // نمط: word' data-t='ترجمة' ... >word
  result = result.replace(/(\w+(?:\s+\w+)?)\s*['"]?\s*data-[a-z-]+\s*=\s*['"][^'"]*['"][^>]*>\s*\1/gi, '$1');

  // الخطوة 2: إزالة نمط: word">word أو word'>word أو word>word
  result = result.replace(/(\w+(?:\s+\w+)?)\s*["'>]+\s*\1\b/gi, '$1');

  // الخطوة 3: إزالة أي script tags أو كود خطير
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/javascript:/gi, '');
  result = result.replace(/on\w+\s*=/gi, 'data-blocked=');

  // الخطوة 4: إزالة HTML tags المتبقية
  result = result.replace(/<\/?span[^>]*>/gi, '');
  result = result.replace(/<\/?div[^>]*>/gi, '');
  result = result.replace(/<\/?p[^>]*>/gi, '');
  result = result.replace(/<[^>]+>/g, '');

  // الخطوة 5: إزالة data-* attributes
  result = result
    .replace(/\s*data-[a-z-]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s*data-[a-z-]+\s*=\s*'[^']*'/gi, '');

  // الخطوة 6: إزالة class attributes
  result = result.replace(/\s*class\s*=\s*["'][^"']*["']/gi, '');

  // الخطوة 7: إزالة أي نص عربي داخل quotes (ترجمات عالقة من أخطاء سابقة)
  result = result.replace(/\s*['"][\u0600-\u06FF\s]+['"]/g, '');

  // الخطوة 8: إزالة بقايا quotes و brackets
  result = result
    .replace(/"\s*>/g, '')
    .replace(/'\s*>/g, '')
    .replace(/\s*>\s*/g, ' ')
    .replace(/["']/g, '');

  // الخطوة 9: تنظيف المسافات الزائدة
  result = result
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

// GET - جلب جميع القصص
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const level = searchParams.get('level');
    const isRead = searchParams.get('isRead');
    const isFavorite = searchParams.get('isFavorite');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };

    if (level) {
      where.level = level;
    }

    if (isRead !== null && isRead !== '') {
      where.isRead = isRead === 'true';
    }

    if (isFavorite !== null && isFavorite !== '') {
      where.isFavorite = isFavorite === 'true';
    }

    const stories = await db.story.findMany({
      where,
      include: {
        storyWords: {
          include: {
            word: true
          }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, data: stories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

// POST - إنشاء قصة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, titleAr, content, contentAr, level, 
      readingTime, wordCount, userId, wordIds, isAiGenerated 
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'العنوان والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    // تنظيف المحتوى قبل الحفظ - ضمان عدم وجود أي بيانات فاسدة
    const cleanedTitle = cleanStoryContent(title);
    const cleanedTitleAr = titleAr ? cleanStoryContent(titleAr) : null;
    const cleanedContent = cleanStoryContent(content);
    const cleanedContentAr = contentAr ? cleanStoryContent(contentAr) : null;

    // إنشاء القصة بالمحتوى النظيف
    const story = await db.story.create({
      data: {
        title: cleanedTitle,
        titleAr: cleanedTitleAr,
        content: cleanedContent,
        contentAr: cleanedContentAr,
        level: level || 'beginner',
        readingTime: readingTime || Math.ceil(cleanedContent.split(/\s+/).length / 200),
        wordCount: wordCount || cleanedContent.split(/\s+/).length,
        savedWordsCount: wordIds?.length || 0,
        isAiGenerated: isAiGenerated || false,
        userId,
        // إضافة الكلمات المحفوظة المستخدمة
        ...(wordIds && wordIds.length > 0 && {
          storyWords: {
            create: wordIds.map((wordId: string, index: number) => ({
              wordId,
              position: index
            }))
          }
        })
      },
      include: {
        storyWords: {
          include: {
            word: true
          }
        }
      }
    });

    // تحديث XP للمستخدم
    await db.user.update({
      where: { id: userId },
      data: { 
        xp: { increment: 10 },
        lastActiveDate: new Date()
      }
    });

    return NextResponse.json({ success: true, data: story });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create story' },
      { status: 500 }
    );
  }
}
