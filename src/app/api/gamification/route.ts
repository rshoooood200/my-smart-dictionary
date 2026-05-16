import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// تعريف الإنجازات
const ACHIEVEMENTS = [
  // إنجازات الكلمات
  { key: 'first_word', name: 'First Steps', nameAr: 'الخطوة الأولى', description: 'Add your first word', descriptionAr: 'أضف أول كلمة', icon: '🌱', category: 'words', requirement: 1, xpReward: 10, tier: 'bronze' },
  { key: 'words_10', name: 'Word Collector', nameAr: 'جامع الكلمات', description: 'Learn 10 words', descriptionAr: 'تعلم 10 كلمات', icon: '📚', category: 'words', requirement: 10, xpReward: 50, tier: 'bronze' },
  { key: 'words_50', name: 'Vocabulary Builder', nameAr: 'بناء المفردات', description: 'Learn 50 words', descriptionAr: 'تعلم 50 كلمة', icon: '📖', category: 'words', requirement: 50, xpReward: 100, tier: 'silver' },
  { key: 'words_100', name: 'Word Master', nameAr: 'سيد الكلمات', description: 'Learn 100 words', descriptionAr: 'تعلم 100 كلمة', icon: '🎓', category: 'words', requirement: 100, xpReward: 200, tier: 'gold' },
  { key: 'words_500', name: 'Vocabulary Genius', nameAr: 'عبقري المفردات', description: 'Learn 500 words', descriptionAr: 'تعلم 500 كلمة', icon: '🏆', category: 'words', requirement: 500, xpReward: 500, tier: 'platinum' },
  
  // إنجازات المراجعة
  { key: 'first_review', name: 'Quick Review', nameAr: 'مراجعة سريعة', description: 'Complete your first review', descriptionAr: 'أكمل أول مراجعة', icon: '🔄', category: 'review', requirement: 1, xpReward: 15, tier: 'bronze' },
  { key: 'reviews_10', name: 'Dedicated Learner', nameAr: 'متعلم ملتزم', description: 'Complete 10 reviews', descriptionAr: 'أكمل 10 مراجعات', icon: '⭐', category: 'review', requirement: 10, xpReward: 50, tier: 'bronze' },
  { key: 'reviews_50', name: 'Review Champion', nameAr: 'بطل المراجعة', description: 'Complete 50 reviews', descriptionAr: 'أكمل 50 مراجعة', icon: '🌟', category: 'review', requirement: 50, xpReward: 150, tier: 'silver' },
  { key: 'reviews_100', name: 'Review Master', nameAr: 'سيد المراجعة', description: 'Complete 100 reviews', descriptionAr: 'أكمل 100 مراجعة', icon: '👑', category: 'review', requirement: 100, xpReward: 300, tier: 'gold' },
  
  // إنجازات السلسلة
  { key: 'streak_3', name: 'Getting Started', nameAr: 'بداية رائعة', description: '3 day streak', descriptionAr: 'سلسلة 3 أيام', icon: '🔥', category: 'streak', requirement: 3, xpReward: 30, tier: 'bronze' },
  { key: 'streak_7', name: 'Week Warrior', nameAr: 'محارب الأسبوع', description: '7 day streak', descriptionAr: 'سلسلة أسبوع', icon: '💪', category: 'streak', requirement: 7, xpReward: 70, tier: 'silver' },
  { key: 'streak_30', name: 'Monthly Master', nameAr: 'سيد الشهر', description: '30 day streak', descriptionAr: 'سلسلة شهر', icon: '🏅', category: 'streak', requirement: 30, xpReward: 300, tier: 'gold' },
  { key: 'streak_100', name: 'Unstoppable', nameAr: 'لا يمكن إيقافه', description: '100 day streak', descriptionAr: 'سلسلة 100 يوم', icon: '💎', category: 'streak', requirement: 100, xpReward: 1000, tier: 'platinum' },
  
  // إنجازات الدقة
  { key: 'accuracy_80', name: 'Sharp Mind', nameAr: 'عقل حاد', description: 'Achieve 80% accuracy', descriptionAr: 'حقق دقة 80%', icon: '🎯', category: 'accuracy', requirement: 80, xpReward: 100, tier: 'silver' },
  { key: 'accuracy_90', name: 'Precision Expert', nameAr: 'خبير الدقة', description: 'Achieve 90% accuracy', descriptionAr: 'حقق دقة 90%', icon: '🎪', category: 'accuracy', requirement: 90, xpReward: 200, tier: 'gold' },
  { key: 'accuracy_100', name: 'Perfect Score', nameAr: 'درجة كاملة', description: 'Achieve 100% accuracy in 10 reviews', descriptionAr: 'حقق دقة 100% في 10 مراجعات', icon: '✨', category: 'accuracy', requirement: 100, xpReward: 500, tier: 'platinum' },
  
  // إنجازات المستوى
  { key: 'level_5', name: 'Rising Star', nameAr: 'نجم صاعد', description: 'Reach level 5', descriptionAr: 'وصول المستوى 5', icon: '⬆️', category: 'level', requirement: 5, xpReward: 50, tier: 'bronze' },
  { key: 'level_10', name: 'Skilled Learner', nameAr: 'متعلم مهاري', description: 'Reach level 10', descriptionAr: 'وصول المستوى 10', icon: '🚀', category: 'level', requirement: 10, xpReward: 100, tier: 'silver' },
  { key: 'level_25', name: 'Expert Scholar', nameAr: 'عالم خبير', description: 'Reach level 25', descriptionAr: 'وصول المستوى 25', icon: '🧠', category: 'level', requirement: 25, xpReward: 250, tier: 'gold' },
  { key: 'level_50', name: 'Legendary', nameAr: 'أسطوري', description: 'Reach level 50', descriptionAr: 'وصول المستوى 50', icon: '👑', category: 'level', requirement: 50, xpReward: 500, tier: 'platinum' },
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

// GET - جلب ملف المستخدم والإنجازات
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;
    
    await ensureAchievementsExist();
    
    // جلب بيانات المستخدم مباشرة من User model
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        achievements: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // حساب إجمالي المراجعات والكلمات من البيانات الفعلية
    const [totalWords, totalReviewsResult] = await Promise.all([
      db.word.count({ where: { userId, isLearned: true } }),
      db.dailyAnalytics.aggregate({
        where: { userId },
        _sum: { wordsReviewed: true },
      }),
    ]);

    const totalReviews = totalReviewsResult._sum.wordsReviewed || 0;
    
    // جلب إنجازات المستخدم
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
    
    // جلب جميع الإنجازات
    const allAchievements = await db.achievement.findMany({
      orderBy: [{ category: 'asc' }, { requirement: 'asc' }],
    });
    
    // حساب المستوى الحالي
    const currentLevel = getLevelFromXP(user.xp);
    const xpForCurrentLevel = getXPForLevel(currentLevel);
    const xpForNextLevel = getXPForLevel(currentLevel + 1);
    
    // حساب XP في المستوى الحالي
    let xpInPreviousLevels = 0;
    for (let i = 1; i < currentLevel; i++) {
      xpInPreviousLevels += getXPForLevel(i);
    }
    const xpInCurrentLevel = user.xp - xpInPreviousLevels;
    const progressToNextLevel = Math.min(100, (xpInCurrentLevel / xpForCurrentLevel) * 100);
    
    // تحديث المستوى إذا لزم الأمر
    if (user.level !== currentLevel) {
      await db.user.update({
        where: { id: userId },
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
        unlockedAt: earned?.unlockedAt || null,
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    return NextResponse.json({
      success: true,
      data: {
        profile: {
          totalXP: user.xp,
          level: currentLevel,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          totalWords,
          totalReviews,
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
    const { action, value = 1 } = body;
    
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;
    
    await ensureAchievementsExist();
    
    // جلب بيانات المستخدم الحالية
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }
    
    let xpToAdd = 0;
    const newAchievements: any[] = [];
    
    // حساب XP بناءً على الإجراء
    switch (action) {
      case 'add_word':
        xpToAdd = 10;
        await db.user.update({
          where: { id: userId },
          data: { 
            xp: { increment: xpToAdd },
          },
        });
        break;
        
      case 'review_correct':
        xpToAdd = 5;
        await db.user.update({
          where: { id: userId },
          data: { 
            xp: { increment: xpToAdd },
          },
        });
        break;
        
      case 'review_wrong':
        xpToAdd = 1;
        await db.user.update({
          where: { id: userId },
          data: { 
            xp: { increment: xpToAdd },
          },
        });
        break;
        
      case 'complete_review_session':
        xpToAdd = value * 2;
        await db.user.update({
          where: { id: userId },
          data: { xp: { increment: xpToAdd } },
        });
        break;
        
      case 'daily_login':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let lastActivity = user.lastActiveDate;
        let newStreak = user.currentStreak;
        
        if (lastActivity) {
          const lastDate = new Date(lastActivity);
          lastDate.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak = user.currentStreak + 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }
        
        const longestStreak = Math.max(user.longestStreak, newStreak);
        const streakBonus = Math.min(newStreak * 2, 50);
        xpToAdd = 5 + streakBonus;
        
        await db.user.update({
          where: { id: userId },
          data: { 
            currentStreak: newStreak,
            longestStreak,
            lastActiveDate: today,
            xp: { increment: xpToAdd },
          },
        });
        break;
    }
    
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
    });
    
    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get current stats for achievement checking
    const [totalWords, totalReviewsResult] = await Promise.all([
      db.word.count({ where: { userId, isLearned: true } }),
      db.dailyAnalytics.aggregate({
        where: { userId },
        _sum: { wordsReviewed: true },
      }),
    ]);

    const totalReviews = totalReviewsResult._sum.wordsReviewed || 0;
    
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
          shouldAward = totalWords >= achievement.requirement;
          break;
        case 'review':
          shouldAward = totalReviews >= achievement.requirement;
          break;
        case 'streak':
          shouldAward = updatedUser.currentStreak >= achievement.requirement;
          break;
        case 'level':
          const currentLevel = getLevelFromXP(updatedUser.xp);
          shouldAward = currentLevel >= achievement.requirement;
          break;
      }
      
      if (shouldAward) {
        await db.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });
        
        await db.user.update({
          where: { id: userId },
          data: { xp: { increment: achievement.xpReward } },
        });
        
        newAchievements.push(achievement);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        xpEarned: xpToAdd,
        newAchievements,
        profile: {
          totalXP: updatedUser.xp,
          level: getLevelFromXP(updatedUser.xp),
          currentStreak: updatedUser.currentStreak,
          longestStreak: updatedUser.longestStreak,
          totalWords,
          totalReviews,
        },
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
