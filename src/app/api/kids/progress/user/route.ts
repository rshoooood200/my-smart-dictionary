import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch user's kids progress
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      // Return default progress for non-logged in users
      return NextResponse.json({
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        coins: 0,
        gems: 0,
        totalVideosWatched: 0,
        totalQuizzesCompleted: 0,
        totalGamesPlayed: 0,
        totalLessonsRead: 0,
        totalFlashcardsViewed: 0,
        totalCorrectAnswers: 0,
        totalWrongAnswers: 0,
        totalTimeSpent: 0,
        lastActiveDate: null,
        isNew: true
      })
    }

    let progress = await db.kidsProgress.findUnique({
      where: { userId }
    })

    if (!progress) {
      // Create new progress for user
      progress = await db.kidsProgress.create({
        data: { userId }
      })
    }

    // Check and update streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (progress.lastActiveDate) {
      const lastActive = new Date(progress.lastActiveDate)
      lastActive.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        // Continue streak
        const newStreak = progress.currentStreak + 1
        progress = await db.kidsProgress.update({
          where: { userId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, progress.longestStreak),
            lastActiveDate: today
          }
        })
      } else if (diffDays > 1) {
        // Reset streak
        progress = await db.kidsProgress.update({
          where: { userId },
          data: {
            currentStreak: 1,
            lastActiveDate: today
          }
        })
      }
    } else {
      // First activity
      progress = await db.kidsProgress.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today
        }
      })
    }

    return NextResponse.json({
      ...progress,
      isNew: false
    })
  } catch (error) {
    console.error('Error fetching kids progress:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}

// POST - Update user's kids progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, data } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let progress = await db.kidsProgress.findUnique({
      where: { userId }
    })

    if (!progress) {
      progress = await db.kidsProgress.create({
        data: { userId }
      })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    switch (action) {
      case 'watch_video':
        updateData.xp = progress.xp + 5
        updateData.coins = progress.coins + 2
        updateData.totalVideosWatched = progress.totalVideosWatched + 1
        break
      
      case 'complete_quiz':
        updateData.xp = progress.xp + (data?.xpReward || 10)
        updateData.coins = progress.coins + (data?.coinsReward || 5)
        updateData.totalQuizzesCompleted = progress.totalQuizzesCompleted + 1
        if (data?.correctCount) {
          updateData.totalCorrectAnswers = progress.totalCorrectAnswers + data.correctCount
        }
        if (data?.wrongCount) {
          updateData.totalWrongAnswers = progress.totalWrongAnswers + data.wrongCount
        }
        break
      
      case 'play_game':
        updateData.xp = progress.xp + (data?.xpReward || 15)
        updateData.coins = progress.coins + (data?.coinsReward || 8)
        updateData.totalGamesPlayed = progress.totalGamesPlayed + 1
        break
      
      case 'read_lesson':
        updateData.xp = progress.xp + 3
        updateData.coins = progress.coins + 1
        updateData.totalLessonsRead = progress.totalLessonsRead + 1
        break
      
      case 'view_flashcard':
        updateData.totalFlashcardsViewed = progress.totalFlashcardsViewed + 1
        break
      
      case 'spend_coins':
        if (progress.coins < (data?.amount || 0)) {
          return NextResponse.json({ error: 'Not enough coins' }, { status: 400 })
        }
        updateData.coins = progress.coins - (data?.amount || 0)
        break

      case 'update':
        // Direct update of progress fields (for frontend sync)
        if (data?.xp !== undefined) updateData.xp = data.xp
        if (data?.coins !== undefined) updateData.coins = data.coins
        if (data?.streak !== undefined) updateData.currentStreak = data.streak
        if (data?.level !== undefined) updateData.level = data.level
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Calculate new level based on XP
    if (updateData.xp) {
      updateData.level = Math.floor(updateData.xp / 100) + 1
    }

    const updated = await db.kidsProgress.update({
      where: { userId },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating kids progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
