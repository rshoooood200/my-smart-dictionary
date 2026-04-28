import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'weekly'
    const category = searchParams.get('category') || 'general'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get leaderboard entries
    const leaderboard = await db.leaderboard.findMany({
      where: {
        period,
        category
      },
      include: {
        user: {
          select: { id: true, name: true, level: true, avatar: true }
        }
      },
      orderBy: [
        { rank: 'asc' }
      ],
      take: limit
    })

    // Get current user's rank
    let userRank = null
    if (userId) {
      const userEntry = await db.leaderboard.findUnique({
        where: {
          userId_period_category: {
            userId,
            period,
            category
          }
        }
      })
      
      if (userEntry) {
        // Get surrounding entries
        const surrounding = await db.leaderboard.findMany({
          where: { period, category },
          orderBy: { rank: 'asc' }
        })
        
        const userIndex = surrounding.findIndex(e => e.userId === userId)
        userRank = {
          ...userEntry,
          position: userIndex + 1,
          total: surrounding.length
        }
      }
    }

    // Get top 3 for podium
    const topThree = leaderboard.slice(0, 3)

    return NextResponse.json({
      leaderboard,
      topThree,
      userRank,
      period,
      category
    })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update leaderboard (called internally when user earns XP)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, xpEarned, wordsLearned, streakDays } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const now = new Date()
    const periods = ['daily', 'weekly', 'monthly', 'all-time']

    for (const period of periods) {
      // Check if entry exists for this period
      let entry = await db.leaderboard.findUnique({
        where: {
          userId_period_category: {
            userId,
            period,
            category: 'general'
          }
        }
      })

      if (entry) {
        // Update existing entry
        await db.leaderboard.update({
          where: { id: entry.id },
          data: {
            score: { increment: xpEarned || 0 },
            wordsLearned: { increment: wordsLearned || 0 },
            streakDays: Math.max(entry.streakDays, streakDays || 0)
          }
        })
      } else {
        // Create new entry
        await db.leaderboard.create({
          data: {
            userId,
            period,
            category: 'general',
            score: xpEarned || 0,
            wordsLearned: wordsLearned || 0,
            streakDays: streakDays || 0,
            rank: 0
          }
        })
      }
    }

    // Recalculate ranks for all periods
    for (const period of periods) {
      const entries = await db.leaderboard.findMany({
        where: { period, category: 'general' },
        orderBy: { score: 'desc' }
      })

      for (let i = 0; i < entries.length; i++) {
        await db.leaderboard.update({
          where: { id: entries[i].id },
          data: { rank: i + 1 }
        })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Leaderboard POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
