import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - جلب الإحصائيات
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, week, month

    // إجمالي الكلمات
    const totalWords = await db.word.count({
      where: { userId },
    });
    
    // الكلمات المحفوظة
    const learnedWords = await db.word.count({
      where: { userId, isLearned: true },
    });
    
    // الكلمات المفضلة
    const favoriteWords = await db.word.count({
      where: { userId, isFavorite: true },
    });

    // الكلمات حسب المستوى
    const wordsByLevel = await db.word.groupBy({
      by: ['level'],
      _count: true,
      where: { userId },
    });

    // الكلمات حسب التصنيف
    const wordsByCategory = await db.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { words: true },
        },
      },
    });

    // جلسات المراجعة
    const totalSessions = await db.reviewSession.count({
      where: { userId },
    });
    
    // متوسط الأداء
    const sessions = await db.reviewSession.findMany({
      where: { userId },
      select: {
        totalWords: true,
        correctCount: true,
      },
    });

    let averageAccuracy = 0;
    if (sessions.length > 0) {
      const totalQuestions = sessions.reduce((acc, s) => acc + s.totalWords, 0);
      const totalCorrect = sessions.reduce((acc, s) => acc + s.correctCount, 0);
      averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    }

    // الإحصائيات اليومية
    let dailyStats;
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dailyStats = await db.dailyStats.findMany({
        where: { userId, date: { gte: weekAgo } },
        orderBy: { date: 'asc' },
      });
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dailyStats = await db.dailyStats.findMany({
        where: { userId, date: { gte: monthAgo } },
        orderBy: { date: 'asc' },
      });
    } else {
      dailyStats = await db.dailyStats.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30,
      });
    }

    // آخر الكلمات المضافة
    const recentWords = await db.word.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });

    // الكلمات التي تحتاج مراجعة
    const wordsNeedReview = await db.word.findMany({
      where: {
        userId,
        OR: [
          { lastReviewedAt: null },
          { lastReviewedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalWords,
        learnedWords,
        favoriteWords,
        learningProgress: totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0,
        wordsByLevel,
        wordsByCategory,
        totalSessions,
        averageAccuracy,
        dailyStats,
        recentWords,
        wordsNeedReview,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
