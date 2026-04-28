import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Save game result and award XP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { score, total, correct, wrong, xpEarned, timeSpent, gameType, userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // Update user stats
    const userStats = await db.userStats.findUnique({
      where: { userId }
    })
    
    if (!userStats) {
      // Create stats if not exists
      await db.userStats.create({
        data: {
          userId,
          totalXP: xpEarned,
          totalReviews: correct,
        }
      })
    } else {
      await db.userStats.update({
        where: { userId },
        data: {
          totalXP: { increment: xpEarned },
          totalReviews: { increment: correct },
        }
      })
    }

    // Update daily stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await db.dailyStats.upsert({
      where: { 
        userId_date: { 
          userId, 
          date: today 
        } 
      },
      create: {
        userId,
        date: today,
        wordsReviewed: correct,
        correctAnswers: correct,
        wrongAnswers: wrong,
        xpEarned: xpEarned,
      },
      update: {
        wordsReviewed: { increment: correct },
        correctAnswers: { increment: correct },
        wrongAnswers: { increment: wrong },
        xpEarned: { increment: xpEarned },
      }
    })

    // Create review session record
    await db.reviewSession.create({
      data: {
        userId,
        totalWords: total,
        correctCount: correct,
        wrongCount: wrong,
        duration: timeSpent,
        sessionType: gameType || 'game',
        xpEarned: xpEarned,
      }
    })

    // Check for achievements
    const achievements = await checkAchievements(userId, correct, total)

    return NextResponse.json({
      success: true,
      data: {
        xpEarned,
        newAchievements: achievements,
      }
    })
  } catch (error) {
    console.error('Error saving game result:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حفظ نتيجة اللعبة' },
      { status: 500 }
    )
  }
}

async function checkAchievements(userId: string, correct: number, total: number) {
  const earnedAchievements: string[] = []

  // Get user with achievements
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        include: {
          achievement: true
        }
      }
    }
  })

  if (!user) return earnedAchievements

  const earnedKeys = user.achievements.map(a => a.achievement.key)

  // Check for first game achievement
  if (!earnedKeys.includes('first_game')) {
    const achievement = await db.achievement.findUnique({
      where: { key: 'first_game' }
    })
    
    if (achievement) {
      await db.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          xpEarned: achievement.xpReward
        }
      })
      earnedAchievements.push(achievement.nameAr)
    }
  }

  // Check for perfect score achievement
  if (correct === total && total >= 5 && !earnedKeys.includes('perfect_score')) {
    const achievement = await db.achievement.findUnique({
      where: { key: 'perfect_score' }
    })
    
    if (achievement) {
      await db.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          xpEarned: achievement.xpReward
        }
      })
      earnedAchievements.push(achievement.nameAr)
    }
  }

  return earnedAchievements
}
