import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - إحصائيات شاملة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'week'; // week | month | year

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    // تحديد نطاق التاريخ
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // جلب البيانات بشكل متوازي
    const [
      user,
      totalWords,
      learnedWords,
      favoriteWords,
      categories,
      dailyActivities,
      reviewSessions,
      wordsByLevel,
      wordsByCategory,
      recentWords,
      dueWords
    ] = await Promise.all([
      // معلومات المستخدم
      db.user.findUnique({
        where: { id: userId },
        select: {
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          totalStudyTime: true,
          wordsMastered: true,
          achievements: true
        }
      }),
      
      // إجمالي الكلمات
      db.word.count({ where: { userId } }),
      
      // الكلمات المحفوظة
      db.word.count({ where: { userId, isLearned: true } }),
      
      // الكلمات المفضلة
      db.word.count({ where: { userId, isFavorite: true } }),
      
      // التصنيفات
      db.category.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          nameAr: true,
          color: true,
          words: {
            select: { id: true }
          }
        }
      }),
      
      // النشاط اليومي
      db.dailyActivity.findMany({
        where: {
          userId,
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' }
      }),
      
      // جلسات المراجعة
      db.reviewSession.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // الكلمات حسب المستوى
      db.word.groupBy({
        by: ['level'],
        where: { userId },
        _count: true
      }),
      
      // الكلمات حسب التصنيف
      db.word.groupBy({
        by: ['categoryId'],
        where: { 
          userId,
          categoryId: { not: null }
        },
        _count: true
      }),
      
      // الكلمات المضافة مؤخراً
      db.word.findMany({
        where: { userId },
        select: {
          id: true,
          word: true,
          translation: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // الكلمات المستحقة للمراجعة
      db.word.count({
        where: {
          userId,
          OR: [
            { nextReviewAt: { lte: now } },
            { nextReviewAt: null }
          ]
        }
      })
    ]);

    // حساب الإحصائيات المشتقة
    const totalReviews = dailyActivities.reduce((sum, a) => sum + a.wordsReviewed, 0);
    const totalCorrect = dailyActivities.reduce((sum, a) => sum + a.correctAnswers, 0);
    const totalWrong = dailyActivities.reduce((sum, a) => sum + a.wrongAnswers, 0);
    const totalStudyTime = dailyActivities.reduce((sum, a) => sum + a.studyTime, 0);
    const accuracy = (totalCorrect + totalWrong) > 0 
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) 
      : 0;

    // حساب متوسط يومي
    const daysWithActivity = dailyActivities.filter(a => a.wordsReviewed > 0).length;
    const avgWordsPerDay = daysWithActivity > 0 ? Math.round(totalReviews / daysWithActivity) : 0;

    // حساب التقدم الأسبوعي
    const weeklyProgress = dailyActivities.slice(-7).map(a => ({
      date: a.date.toISOString().split('T')[0],
      wordsReviewed: a.wordsReviewed,
      correctAnswers: a.correctAnswers,
      wrongAnswers: a.wrongAnswers,
      studyTime: a.studyTime,
      xpEarned: a.xpEarned
    }));

    // تحضير بيانات الرسوم البيانية
    const chartData = {
      // نشاط الأيام
      dailyActivity: dailyActivities.map(a => ({
        date: a.date.toISOString().split('T')[0],
        wordsAdded: a.wordsAdded,
        wordsReviewed: a.wordsReviewed,
        studyTime: a.studyTime
      })),
      
      // توزيع الكلمات حسب المستوى
      levelDistribution: wordsByLevel.map(w => ({
        level: w.level,
        count: w._count,
        label: {
          'beginner': 'مبتدئ',
          'intermediate': 'متوسط',
          'advanced': 'متقدم'
        }[w.level] || w.level
      })),
      
      // توزيع الكلمات حسب التصنيف
      categoryDistribution: wordsByCategory.map(w => {
        const cat = categories.find(c => c.id === w.categoryId);
        return {
          categoryId: w.categoryId,
          name: cat?.nameAr || cat?.name || 'غير مصنف',
          color: cat?.color || '#6B7280',
          count: w._count
        };
      }),
      
      // منحنى التقدم
      progressCurve: weeklyProgress.map((d, i) => ({
        day: i + 1,
        date: d.date,
        accumulated: weeklyProgress.slice(0, i + 1).reduce((sum, dd) => sum + dd.wordsReviewed, 0)
      }))
    };

    // حساب heatmap للنشاط
    const heatmapData = generateHeatmapData(dailyActivities);

    // حساب الأهداف
    const goals = {
      daily: {
        target: 10,
        current: dailyActivities[dailyActivities.length - 1]?.wordsReviewed || 0,
        achieved: (dailyActivities[dailyActivities.length - 1]?.wordsReviewed || 0) >= 10
      },
      weekly: {
        target: 50,
        current: weeklyProgress.reduce((sum, d) => sum + d.wordsReviewed, 0),
        achieved: weeklyProgress.reduce((sum, d) => sum + d.wordsReviewed, 0) >= 50
      },
      mastery: {
        target: 100,
        current: learnedWords,
        progress: Math.min(100, Math.round((learnedWords / 100) * 100))
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalWords,
          learnedWords,
          favoriteWords,
          dueWords,
          categoriesCount: categories.length,
          totalReviews,
          accuracy,
          avgWordsPerDay,
          totalStudyTime,
          currentStreak: user?.currentStreak || 0,
          longestStreak: user?.longestStreak || 0,
          xp: user?.xp || 0,
          level: user?.level || 1,
          wordsMastered: user?.wordsMastered || 0
        },
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          nameAr: c.nameAr,
          color: c.color,
          wordsCount: c.words.length
        })),
        recentWords,
        chartData,
        heatmapData,
        goals,
        achievements: JSON.parse(user?.achievements || '[]')
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}

// توليد بيانات Heatmap
function generateHeatmapData(activities: Array<{ date: Date; wordsReviewed: number }>) {
  const today = new Date();
  const data: Array<{ date: string; level: number; words: number }> = [];
  
  // آخر 365 يوم
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const activity = activities.find(a => 
      new Date(a.date).toISOString().split('T')[0] === dateStr
    );
    
    const words = activity?.wordsReviewed || 0;
    
    // تحديد مستوى النشاط (0-4)
    let level = 0;
    if (words >= 20) level = 4;
    else if (words >= 15) level = 3;
    else if (words >= 10) level = 2;
    else if (words >= 5) level = 1;
    
    data.push({ date: dateStr, level, words });
  }
  
  return data;
}
