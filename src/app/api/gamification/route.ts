import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// تعريف الإنجازات
const ACHIEVEMENTS = [
  // إنجازات الكلمات
  { key: 'first_word', name: 'First Steps', nameAr: 'الخطوة الأولى', description: 'Add your first word', descriptionAr: 'أضف أول كلمة', icon: '🌱', category: 'words', requirement: 1, xpReward: 10, color: '#10B981' },
  { key: 'words_10', name: 'Word Collector', nameAr: 'جامع الكلمات', description: 'Learn 10 words', descriptionAr: 'تعلم 10 كلمات', icon: '📚', category: 'words', requirement: 10, xpReward: 50, color: '#3B82F6' },
  { key: 'words_50', name: 'Vocabulary Builder', nameAr: 'بناء المفردات', description: 'Learn 50 words', descriptionAr: 'تعلم 50 كلمة', icon: '📖', category: 'words', requirement: 50, xpReward: 100, color: '#8B5CF6' },
  { key: 'words_100', name: 'Word Master', nameAr: 'سيد الكلمات', description: 'Learn 100 words', descriptionAr: 'تعلم 100 كلمة', icon: '🎓', category: 'words', requirement: 100, xpReward: 200, color: '#EC4899' },
  { key: 'words_500', name: 'Vocabulary Genius', nameAr: 'عبقري المفردات', description: 'Learn 500 words', descriptionAr: 'تعلم 500 كلمة', icon: '🏆', category: 'words', requirement: 500, xpReward: 500, color: '#F59E0B' },
  
  // إنجازات المراجعة
  { key: 'first_review', name: 'Quick Review', nameAr: 'مراجعة سريعة', description: 'Complete your first review', descriptionAr: 'أكمل أول مراجعة', icon: '🔄', category: 'review', requirement: 1, xpReward: 15, color: '#10B981' },
  { key: 'reviews_10', name: 'Dedicated Learner', nameAr: 'متعلم ملتزم', description: 'Complete 10 reviews', descriptionAr: 'أكمل 10 مراجعات', icon: '⭐', category: 'review', requirement: 10, xpReward: 50, color: '#F59E0B' },
  { key: 'reviews_50', name: 'Review Champion', nameAr: 'بطل المراجعة', description: 'Complete 50 reviews', descriptionAr: 'أكمل 50 مراجعات', icon: '🌟', category: 'review', requirement: 50, xpReward: 150, color: '#EF4444' },
  { key: 'reviews_100', name: 'Review Master', nameAr: 'سيد المراجعة', description: 'Complete 100 reviews', descriptionAr: 'أكمل 100 مراجعة', icon: '👑', category: 'review', requirement: 100, xpReward: 300, color: '#8B5CF6' },
  
  // إنجازات السلسلة
  { key: 'streak_3', name: 'Getting Started', nameAr: 'بداية رائعة', description: '3 day streak', descriptionAr: 'سلسلة 3 أيام', icon: '🔥', category: 'streak', requirement: 3, xpReward: 30, color: '#F97316' },
  { key: 'streak_7', name: 'Week Warrior', nameAr: 'محارب الأسبوع', description: '7 day streak', descriptionAr: 'سلسلة أسبوع', icon: '💪', category: 'streak', requirement: 7, xpReward: 70, color: '#EF4444' },
  { key: 'streak_30', name: 'Monthly Master', nameAr: 'سيد الشهر', description: '30 day streak', descriptionAr: 'سلسلة شهر', icon: '🏅', category: 'streak', requirement: 30, xpReward: 300, color: '#DC2626' },
  { key: 'streak_100', name: 'Unstoppable', nameAr: 'لا يمكن إيقافه', description: '100 day streak', descriptionAr: 'سلسلة 100 يوم', icon: '💎', category: 'streak', requirement: 100, xpReward: 1000, color: '#7C3AED' },
  
  // إنجازات الدقة
  { key: 'accuracy_80', name: 'Sharp Mind', nameAr: 'عقل حاد', description: 'Achieve 80% accuracy', descriptionAr: 'حقق دقة 80%', icon: '🎯', category: 'accuracy', requirement: 80, xpReward: 100, color: '#06B6D4' },
  { key: 'accuracy_90', name: 'Precision Expert', nameAr: 'خبير الدقة', description: 'Achieve 90% accuracy', descriptionAr: 'حقق دقة 90%', icon: '🎪', category: 'accuracy', requirement: 90, xpReward: 200, color: '#0891B2' },
  { key: 'accuracy_100', name: 'Perfect Score', nameAr: 'درجة كاملة', description: 'Achieve 100% accuracy in 10 reviews', descriptionAr: 'حقق دقة 100% في 10 مراجعات', icon: '✨', category: 'accuracy', requirement: 100, xpReward: 500, color: '#0D9488' },
  
  // إنجازات المستوى
  { key: 'level_5', name: 'Rising Star', nameAr: 'نجم صاعد', description: 'Reach level 5', descriptionAr: 'وصول المستوى 5', icon: '⬆️', category: 'level', requirement: 5, xpReward: 50, color: '#FBBF24' },
  { key: 'level_10', name: 'Skilled Learner', nameAr: 'متعلم مهاري', description: 'Reach level 10', descriptionAr: 'وصول المستوى 10', icon: '🚀', category: 'level', requirement: 10, xpReward: 100, color: '#F59E0B' },
  { key: 'level_25', name: 'Expert Scholar', nameAr: 'عالم خبير', description: 'Reach level 25', descriptionAr: 'وصول المستوى 25', icon: '🧠', category: 'level', requirement: 25, xpReward: 250, color: '#D97706' },
  { key: 'level_50', name: 'Legendary', nameAr: 'أسطوري', description: 'Reach level 50', descriptionAr: 'وصول المستوى 50', icon: '👑', category: 'level', requirement: 50, xpReward: 500, color: '#B45309' },
];

// حساب XP المطلوب للمستوى
function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// حساب المستوى من XP
function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;
  
  while (true) {
    xpNeeded += getXPForLevel(level);
    if (totalXP < xpNeeded) break;
    level++;
  }
  
  return level;
}

// التأكد من وجود الإنجازات في قاعدة البيانات
async function ensureAchievementsExist() {
  for (const achievement of ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { key: achievement.key },
      create: achievement,
      update: achievement,
    });
  }
}

// الحصول على أو إنشاء إحصائيات المستخدم
async function getOrCreateUserStats(userId: string) {
  let stats = await db.userStats.findUnique({
    where: { userId }
  });
  
  if (!stats) {
    stats = await db.userStats.create({
      data: { userId },
    });
  }
  
  return stats;
}

// GET - جلب ملف المستخدم والإنجازات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }
    
    await ensureAchievementsExist();
    const stats = await getOrCreateUserStats(userId);
    
    // جلب إنجازات المستخدم
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
    
    // جلب جميع الإنجازات
    const allAchievements = await db.achievement.findMany({
      orderBy: [{ category: 'asc' }, { requirement: 'asc' }],
    });
    
    // حساب المستوى الحالي
    const currentLevel = getLevelFromXP(stats.totalXP);
    const xpForCurrentLevel = getXPForLevel(currentLevel);
    const xpForNextLevel = getXPForLevel(currentLevel + 1);
    
    // حساب XP في المستوى الحالي
    let xpInPreviousLevels = 0;
    for (let i = 1; i < currentLevel; i++) {
      xpInPreviousLevels += getXPForLevel(i);
    }
    const xpInCurrentLevel = stats.totalXP - xpInPreviousLevels;
    const progressToNextLevel = Math.min(100, (xpInCurrentLevel / xpForCurrentLevel) * 100);
    
    // تحديث المستوى إذا لزم الأمر
    if (stats.level !== currentLevel) {
      await db.userStats.update({
        where: { userId },
        data: { level: currentLevel },
      });
    }
    
    // تجميع الإنجازات حسب الفئة
    const achievementsByCategory = allAchievements.reduce((acc, achievement) => {
      const earned = userAchievements.find(ua => ua.achievementId === achievement.id);
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push({
        ...achievement,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: stats.id,
          totalXP: stats.totalXP,
          level: currentLevel,
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
          totalWords: stats.totalWords,
          totalReviews: stats.totalReviews,
        },
        levelInfo: {
          currentLevel,
          xpForCurrentLevel,
          xpForNextLevel,
          xpInCurrentLevel,
          progressToNextLevel,
        },
        achievements: achievementsByCategory,
        earnedAchievements: userAchievements,
        totalAchievements: allAchievements.length,
        earnedCount: userAchievements.length,
      },
    });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gamification data' },
      { status: 500 }
    );
  }
}

// POST - إضافة XP والتحقق من الإنجازات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, value = 1, userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }
    
    await ensureAchievementsExist();
    const stats = await getOrCreateUserStats(userId);
    
    let xpToAdd = 0;
    const newAchievements: any[] = [];
    
    // حساب XP بناءً على الإجراء
    switch (action) {
      case 'add_word':
        xpToAdd = 10;
        await db.userStats.update({
          where: { userId },
          data: { 
            totalWords: { increment: 1 },
            totalXP: { increment: xpToAdd },
          },
        });
        break;
        
      case 'review_correct':
        xpToAdd = 5;
        await db.userStats.update({
          where: { userId },
          data: { 
            totalReviews: { increment: 1 },
            totalXP: { increment: xpToAdd },
          },
        });
        break;
        
      case 'review_wrong':
        xpToAdd = 1;
        await db.userStats.update({
          where: { userId },
          data: { 
            totalReviews: { increment: 1 },
            totalXP: { increment: xpToAdd },
          },
        });
        break;
        
      case 'complete_review_session':
        xpToAdd = value * 2;
        await db.userStats.update({
          where: { userId },
          data: { totalXP: { increment: xpToAdd } },
        });
        break;
        
      case 'daily_login':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let lastActivity = stats.lastActivityDate;
        let newStreak = stats.currentStreak;
        
        if (lastActivity) {
          const lastDate = new Date(lastActivity);
          lastDate.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak = stats.currentStreak + 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }
        
        const longestStreak = Math.max(stats.longestStreak, newStreak);
        const streakBonus = Math.min(newStreak * 2, 50);
        xpToAdd = 5 + streakBonus;
        
        await db.userStats.update({
          where: { userId },
          data: { 
            currentStreak: newStreak,
            longestStreak,
            lastActivityDate: today,
            totalXP: { increment: xpToAdd },
          },
        });
        break;
    }
    
    const updatedStats = await db.userStats.findUnique({
      where: { userId },
    });
    
    if (!updatedStats) {
      return NextResponse.json({ success: false, error: 'Stats not found' }, { status: 404 });
    }
    
    // التحقق من الإنجازات الجديدة
    const allAchievements = await db.achievement.findMany();
    const earnedAchievementKeys = (await db.userAchievement.findMany({
      where: { userId },
      select: { achievement: { select: { key: true } } },
    })).map(ua => ua.achievement.key);
    
    for (const achievement of allAchievements) {
      if (earnedAchievementKeys.includes(achievement.key)) continue;
      
      let shouldAward = false;
      
      switch (achievement.category) {
        case 'words':
          shouldAward = updatedStats.totalWords >= achievement.requirement;
          break;
        case 'review':
          shouldAward = updatedStats.totalReviews >= achievement.requirement;
          break;
        case 'streak':
          shouldAward = updatedStats.currentStreak >= achievement.requirement;
          break;
        case 'level':
          const currentLevel = getLevelFromXP(updatedStats.totalXP);
          shouldAward = currentLevel >= achievement.requirement;
          break;
      }
      
      if (shouldAward) {
        await db.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            xpEarned: achievement.xpReward,
          },
        });
        
        await db.userStats.update({
          where: { userId },
          data: { totalXP: { increment: achievement.xpReward } },
        });
        
        newAchievements.push(achievement);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        xpEarned: xpToAdd,
        newAchievements,
        profile: updatedStats,
      },
    });
  } catch (error) {
    console.error('Error updating gamification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update gamification' },
      { status: 500 }
    );
  }
}
