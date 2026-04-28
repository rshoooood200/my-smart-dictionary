import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch user's content progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const contentId = searchParams.get('contentId')
    const status = searchParams.get('status')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch progress for specific content
    if (contentId) {
      const progress = await db.contentProgress.findUnique({
        where: {
          userId_contentId: { userId, contentId }
        },
        include: {
          content: {
            include: { questions: true }
          }
        }
      })

      return NextResponse.json({ progress })
    }

    // Build filter
    const where: any = { userId }
    if (status) {
      where.status = status
    }

    const progress = await db.contentProgress.findMany({
      where,
      include: {
        content: {
          include: { questions: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 100
    })

    // Calculate stats
    const stats = {
      total: progress.length,
      completed: progress.filter(p => p.status === 'completed').length,
      mastered: progress.filter(p => p.status === 'mastered').length,
      inProgress: progress.filter(p => p.status === 'in_progress').length,
      totalScore: progress.reduce((sum, p) => sum + p.score, 0),
      averageScore: progress.length > 0 
        ? progress.reduce((sum, p) => sum + p.bestScore, 0) / progress.length 
        : 0,
      totalTime: progress.reduce((sum, p) => sum + p.timeSpent, 0)
    }

    return NextResponse.json({ progress, stats })
  } catch (error) {
    console.error('Error fetching content progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      contentId,
      score = 0,
      correctAnswers = 0,
      wrongAnswers = 0,
      timeSpent = 0,
      hintsUsed = 0,
      answers = [],
      mistakes = []
    } = body

    if (!userId || !contentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if progress exists
    const existing = await db.contentProgress.findUnique({
      where: {
        userId_contentId: { userId, contentId }
      }
    })

    // Determine status
    const totalQuestions = correctAnswers + wrongAnswers
    let status = 'not_started'
    let masteryLevel = 0

    if (existing) {
      if (score >= 90 && existing.attempts >= 3) {
        status = 'mastered'
        masteryLevel = Math.min(5, existing.masteryLevel + 1)
      } else if (score >= 70) {
        status = 'completed'
        masteryLevel = Math.min(5, Math.floor(score / 20))
      } else if (existing.attempts > 0 || correctAnswers > 0 || wrongAnswers > 0) {
        status = 'in_progress'
      }

      // Update existing progress
      const updated = await db.contentProgress.update({
        where: {
          userId_contentId: { userId, contentId }
        },
        data: {
          status,
          score,
          bestScore: Math.max(existing.bestScore, score),
          attempts: existing.attempts + 1,
          correctAnswers: existing.correctAnswers + correctAnswers,
          wrongAnswers: existing.wrongAnswers + wrongAnswers,
          timeSpent: existing.timeSpent + timeSpent,
          hintsUsed: existing.hintsUsed + hintsUsed,
          answers: JSON.stringify([
            ...JSON.parse(existing.answers || '[]'),
            ...answers
          ]),
          mistakes: JSON.stringify([
            ...JSON.parse(existing.mistakes || '[]'),
            ...mistakes
          ]),
          masteryLevel,
          lastAttemptAt: new Date(),
          completedAt: status === 'completed' || status === 'mastered' ? new Date() : existing.completedAt,
          masteredAt: status === 'mastered' ? new Date() : existing.masterizedAt
        }
      })

      // Update content stats
      await db.interactiveContent.update({
        where: { id: contentId },
        data: {
          attempts: { increment: 1 },
          completions: status === 'completed' ? { increment: 1 } : undefined,
          averageScore: (existing.score + score) / 2,
          averageTime: (existing.timeSpent + timeSpent) / 2
        }
      })

      return NextResponse.json({ progress: updated, isNew: false })
    } else {
      // Create new progress
      if (score >= 70) {
        status = score >= 90 ? 'mastered' : 'completed'
        masteryLevel = Math.floor(score / 20)
      } else if (correctAnswers > 0 || wrongAnswers > 0) {
        status = 'in_progress'
      }

      const newProgress = await db.contentProgress.create({
        data: {
          userId,
          contentId,
          status,
          score,
          bestScore: score,
          attempts: 1,
          correctAnswers,
          wrongAnswers,
          timeSpent,
          hintsUsed,
          answers: JSON.stringify(answers),
          mistakes: JSON.stringify(mistakes),
          masteryLevel,
          lastAttemptAt: new Date(),
          completedAt: status === 'completed' ? new Date() : null,
          masteredAt: status === 'mastered' ? new Date() : null
        }
      })

      // Update content stats
      await db.interactiveContent.update({
        where: { id: contentId },
        data: {
          attempts: { increment: 1 },
          completions: status === 'completed' ? { increment: 1 } : undefined,
          averageScore: score,
          averageTime: timeSpent
        }
      })

      return NextResponse.json({ progress: newProgress, isNew: true })
    }
  } catch (error) {
    console.error('Error updating content progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update specific progress record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, contentId, ...updateData } = body

    if (!userId || !contentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updated = await db.contentProgress.update({
      where: {
        userId_contentId: { userId, contentId }
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ progress: updated })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Reset progress
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const contentId = searchParams.get('contentId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (contentId) {
      // Delete specific progress
      await db.contentProgress.delete({
        where: {
          userId_contentId: { userId, contentId }
        }
      })
    } else {
      // Delete all user progress
      await db.contentProgress.deleteMany({
        where: { userId }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
