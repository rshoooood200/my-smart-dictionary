import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, verifyWordOwnership } from '@/lib/auth-helpers';

// GET - جلب كلمات للمراجعة
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'flashcard';
    const count = parseInt(searchParams.get('count') || '10');
    const category = searchParams.get('category') || '';

    const where: Record<string, unknown> = { userId };

    if (category) {
      where.categoryId = category;
    }

    let words;

    if (mode === 'need-review') {
      // كلمات تحتاج مراجعة (لم تُراجع منذ فترة أو معدل الإجابة منخفض)
      where.OR = [
        { lastReviewedAt: null },
        { lastReviewedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
      ];
      
      words = await db.word.findMany({
        where,
        include: { sentences: true },
        take: count,
        orderBy: { lastReviewedAt: 'asc' },
      });
    } else if (mode === 'random') {
      // كلمات عشوائية - استخدام Prisma بدلاً من $queryRaw
      const allWords = await db.word.findMany({
        where,
        include: { sentences: true },
      });
      words = allWords.sort(() => Math.random() - 0.5).slice(0, count);
    } else {
      // الوضع الافتراضي - كل الكلمات
      words = await db.word.findMany({
        where,
        include: { sentences: true },
        take: count,
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, data: words });
  } catch (error) {
    console.error('Error fetching review words:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب كلمات المراجعة' },
      { status: 500 }
    );
  }
}

// POST - تسجيل نتيجة مراجعة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wordId, isCorrect } = body;

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    if (!wordId) {
      return NextResponse.json(
        { success: false, error: 'معرف الكلمة مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من ملكية الكلمة
    const existingWord = await verifyWordOwnership(wordId, userId);
    if (!existingWord) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل هذه الكلمة' },
        { status: 403 }
      );
    }

    // تحديث إحصائيات الكلمة
    const word = await db.word.update({
      where: { id: wordId },
      data: {
        reviewCount: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        lastReviewedAt: new Date(),
      },
    });

    // تحديث إحصائيات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await db.dailyStats.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        wordsReviewed: { increment: 1 },
        correctAnswers: isCorrect ? { increment: 1 } : undefined,
        wrongAnswers: !isCorrect ? { increment: 1 } : undefined,
      },
      create: {
        userId,
        date: today,
        wordsReviewed: 1,
        correctAnswers: isCorrect ? 1 : 0,
        wrongAnswers: !isCorrect ? 1 : 0,
      },
    });

    return NextResponse.json({ success: true, data: word });
  } catch (error) {
    console.error('Error recording review:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تسجيل المراجعة' },
      { status: 500 }
    );
  }
}

// PUT - إنشاء/إنهاء جلسة مراجعة
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, totalWords, correctCount, wrongCount, duration } = body;

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    if (action === 'start') {
      const session = await db.reviewSession.create({
        data: {
          sessionType: 'flashcard',
          totalWords: 0,
          correctCount: 0,
          wrongCount: 0,
          duration: 0,
          userId,
        },
      });
      return NextResponse.json({ success: true, data: session });
    }

    if (action === 'end' && sessionId) {
      // التحقق من ملكية الجلسة
      const existingSession = await db.reviewSession.findFirst({
        where: { id: sessionId, userId }
      });
      if (!existingSession) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح لك بتعديل هذه الجلسة' },
          { status: 403 }
        );
      }

      const session = await db.reviewSession.update({
        where: { id: sessionId },
        data: {
          totalWords,
          correctCount,
          wrongCount,
          duration,
        },
      });
      return NextResponse.json({ success: true, data: session });
    }

    return NextResponse.json(
      { success: false, error: 'إجراء غير صالح' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing review session:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إدارة جلسة المراجعة' },
      { status: 500 }
    );
  }
}
