import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default achievements to seed
const defaultAchievements = [
  // Learning achievements
  { key: 'first_word', name: 'First Steps', nameAr: 'الخطوات الأولى', description: 'Add your first word', descriptionAr: 'أضف أول كلمة', icon: '🌱', category: 'learning', tier: 'bronze', xpReward: 10, requirement: 1 },
  { key: 'words_10', name: 'Vocabulary Builder', nameAr: 'باني المفردات', description: 'Learn 10 words', descriptionAr: 'تعلم 10 كلمات', icon: '📚', category: 'learning', tier: 'bronze', xpReward: 25, requirement: 10 },
  { key: 'words_50', name: 'Word Collector', nameAr: 'جامع الكلمات', description: 'Learn 50 words', descriptionAr: 'تعلم 50 كلمة', icon: '📖', category: 'learning', tier: 'silver', xpReward: 100, requirement: 50 },
  { key: 'words_100', name: 'Vocabulary Master', nameAr: 'سيد المفردات', description: 'Learn 100 words', descriptionAr: 'تعلم 100 كلمة', icon: '🎓', category: 'learning', tier: 'gold', xpReward: 250, requirement: 100 },
  { key: 'words_500', name: 'Lexicon Legend', nameAr: 'أساطين القاموس', description: 'Learn 500 words', descriptionAr: 'تعلم 500 كلمة', icon: '👑', category: 'learning', tier: 'platinum', xpReward: 1000, requirement: 500 },
  
  // Streak achievements
  { key: 'streak_3', name: 'Consistent Learner', nameAr: 'متعلم منتظم', description: '3-day streak', descriptionAr: 'سلسلة 3 أيام', icon: '🔥', category: 'streak', tier: 'bronze', xpReward: 15, requirement: 3 },
  { key: 'streak_7', name: 'Weekly Warrior', nameAr: 'محارب أسبوعي', description: '7-day streak', descriptionAr: 'سلسلة أسبوع', icon: '⚡', category: 'streak', tier: 'silver', xpReward: 50, requirement: 7 },
  { key: 'streak_30', name: 'Monthly Master', nameAr: 'سيد الشهر', description: '30-day streak', descriptionAr: 'سلسلة شهر', icon: '🌟', category: 'streak', tier: 'gold', xpReward: 200, requirement: 30 },
  { key: 'streak_100', name: 'Unstoppable', nameAr: 'لا يُوقف', description: '100-day streak', descriptionAr: 'سلسلة 100 يوم', icon: '💎', category: 'streak', tier: 'platinum', xpReward: 1000, requirement: 100 },
  
  // Review achievements
  { key: 'review_10', name: 'Quick Reviewer', nameAr: 'مراجع سريع', description: 'Complete 10 reviews', descriptionAr: 'أكمل 10 مراجعات', icon: '🔄', category: 'review', tier: 'bronze', xpReward: 20, requirement: 10 },
  { key: 'review_50', name: 'Review Regular', nameAr: 'مراجع منتظم', description: 'Complete 50 reviews', descriptionAr: 'أكمل 50 مراجعة', icon: '✅', category: 'review', tier: 'silver', xpReward: 75, requirement: 50 },
  { key: 'review_100', name: 'Review Champion', nameAr: 'بطل المراجعة', description: 'Complete 100 reviews', descriptionAr: 'أكمل 100 مراجعة', icon: '🏆', category: 'review', tier: 'gold', xpReward: 200, requirement: 100 },
  
  // Accuracy achievements
  { key: 'accuracy_80', name: 'Sharp Mind', nameAr: 'عقل حاد', description: '80% accuracy in 50+ reviews', descriptionAr: 'دقة 80% في 50+ مراجعة', icon: '🎯', category: 'accuracy', tier: 'silver', xpReward: 100, requirement: 80 },
  { key: 'accuracy_90', name: 'Precision Master', nameAr: 'سيد الدقة', description: '90% accuracy in 100+ reviews', descriptionAr: 'دقة 90% في 100+ مراجعة', icon: '🎪', category: 'accuracy', tier: 'gold', xpReward: 250, requirement: 90 },
  { key: 'accuracy_95', name: 'Perfectionist', nameAr: 'كمالي', description: '95% accuracy in 200+ reviews', descriptionAr: 'دقة 95% في 200+ مراجعة', icon: '🎖️', category: 'accuracy', tier: 'platinum', xpReward: 500, requirement: 95 },
  
  // Game achievements
  { key: 'game_win_10', name: 'Game Enthusiast', nameAr: 'شغوف الألعاب', description: 'Win 10 games', descriptionAr: 'اربح 10 ألعاب', icon: '🎮', category: 'games', tier: 'bronze', xpReward: 30, requirement: 10 },
  { key: 'game_win_50', name: 'Game Master', nameAr: 'سيد الألعاب', description: 'Win 50 games', descriptionAr: 'اربح 50 لعبة', icon: '🕹️', category: 'games', tier: 'silver', xpReward: 100, requirement: 50 },
  { key: 'perfect_game', name: 'Perfect Score', nameAr: 'نتيجة مثالية', description: 'Get 100% in a game', descriptionAr: 'احصل على 100% في لعبة', icon: '💯', category: 'games', tier: 'gold', xpReward: 50, requirement: 1 },
  
  // Story achievements
  { key: 'story_5', name: 'Story Reader', nameAr: 'قارئ القصص', description: 'Read 5 stories', descriptionAr: 'اقرأ 5 قصص', icon: '📕', category: 'stories', tier: 'bronze', xpReward: 25, requirement: 5 },
  { key: 'story_20', name: 'Bookworm', nameAr: 'دودة الكتب', description: 'Read 20 stories', descriptionAr: 'اقرأ 20 قصة', icon: '📗', category: 'stories', tier: 'silver', xpReward: 100, requirement: 20 },
  { key: 'story_quiz_10', name: 'Quiz Master', nameAr: 'سيد الاختبارات', description: 'Pass 10 story quizzes', descriptionAr: 'اجتز 10 اختبارات قصص', icon: '📝', category: 'stories', tier: 'gold', xpReward: 150, requirement: 10 },
]

// GET - Get achievements for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Ensure achievements exist
    const existingAchievements = await db.achievement.findMany()
    if (existingAchievements.length === 0) {
      await db.achievement.createMany({
        data: defaultAchievements
      })
    }

    // Get all achievements
    const achievements = await db.achievement.findMany({
      orderBy: [{ category: 'asc' }, { tier: 'asc' }]
    })

    // Get user's unlocked achievements
    let userAchievements: { achievementId: string }[] = []
    if (userId) {
      userAchievements = await db.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true }
      })
    }

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))

    // Calculate progress for each achievement
    let userStats = {
      totalWords: 0,
      learnedWords: 0,
      reviewCount: 0,
      correctCount: 0,
      currentStreak: 0,
      gamesWon: 0,
      storiesRead: 0,
      quizzesPassed: 0
    }

    if (userId) {
      const words = await db.word.findMany({ where: { userId } })
      const reviewSessions = await db.reviewSession.findMany({ where: { userId } })
      const user = await db.user.findUnique({ where: { id: userId } })
      const stories = await db.story.findMany({ where: { userId, isRead: true } })

      userStats = {
        totalWords: words.length,
        learnedWords: words.filter(w => w.isLearned).length,
        reviewCount: reviewSessions.reduce((sum, s) => sum + s.totalWords, 0),
        correctCount: reviewSessions.reduce((sum, s) => sum + s.correctCount, 0),
        currentStreak: user?.currentStreak || 0,
        gamesWon: Math.floor(reviewSessions.length / 2), // Approximate
        storiesRead: stories.length,
        quizzesPassed: Math.floor(stories.length / 2) // Approximate
      }
    }

    const achievementsWithProgress = achievements.map(a => {
      let currentProgress = 0
      switch (a.key.split('_')[0]) {
        case 'words':
          currentProgress = userStats.learnedWords
          break
        case 'streak':
          currentProgress = userStats.currentStreak
          break
        case 'review':
          currentProgress = userStats.reviewCount
          break
        case 'accuracy':
          currentProgress = userStats.reviewCount > 0 
            ? Math.round((userStats.correctCount / userStats.reviewCount) * 100)
            : 0
          break
        case 'game':
          currentProgress = userStats.gamesWon
          break
        case 'story':
          currentProgress = a.key.includes('quiz') ? userStats.quizzesPassed : userStats.storiesRead
          break
        case 'first':
          currentProgress = userStats.totalWords
          break
        default:
          currentProgress = 0
      }

      const progress = Math.min(100, Math.round((currentProgress / a.requirement) * 100))

      return {
        ...a,
        isUnlocked: unlockedIds.has(a.id),
        currentProgress,
        progress
      }
    })

    return NextResponse.json({ 
      achievements: achievementsWithProgress,
      stats: userStats
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
  }
}

// POST - Unlock an achievement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, achievementKey } = body

    if (!userId || !achievementKey) {
      return NextResponse.json({ error: 'userId and achievementKey are required' }, { status: 400 })
    }

    const achievement = await db.achievement.findUnique({
      where: { key: achievementKey }
    })

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }

    // Check if already unlocked
    const existing = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId: achievement.id }
      }
    })

    if (existing) {
      return NextResponse.json({ alreadyUnlocked: true })
    }

    // Unlock achievement
    const userAchievement = await db.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id
      }
    })

    // Award XP
    await db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: achievement.xpReward }
      }
    })

    return NextResponse.json({ 
      success: true, 
      achievement: {
        ...achievement,
        unlockedAt: userAchievement.unlockedAt
      }
    })
  } catch (error) {
    console.error('Error unlocking achievement:', error)
    return NextResponse.json({ error: 'Failed to unlock achievement' }, { status: 500 })
  }
}
