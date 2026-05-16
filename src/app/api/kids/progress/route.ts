import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET - Fetch user progress
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    // Get user's quiz attempts
    const quizAttempts = await db.kidsQuizAttempt.findMany({
      where: { userId }
    })

    // Get user's game scores
    const gameScores = await db.kidsGameScore.findMany({
      where: { userId }
    })

    // Calculate total XP
    const totalXP = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) +
                    gameScores.reduce((sum, score) => sum + score.score, 0)

    // Calculate level (every 100 XP = 1 level)
    const level = Math.floor(totalXP / 100) + 1

    // Get user certificates
    const certificates = await db.kidsUserCertificate.findMany({
      where: { userId },
      include: {
        certificate: true
      }
    })

    return NextResponse.json({
      xp: totalXP,
      level,
      streak: 0, // TODO: Calculate streak
      totalQuizzes: quizAttempts.length,
      totalGames: gameScores.length,
      totalVideos: 0, // TODO: Track video watches
      achievements: certificates.map(c => ({
        id: c.certificateId,
        title: c.certificate.title,
        titleAr: c.certificate.titleAr,
        icon: c.certificate.icon,
        issuedAt: c.issuedAt
      })),
      coins: totalXP // 1 coin per XP
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}

// POST - Update user progress (submit quiz, save game score, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    if (type === 'quiz') {
      const attempt = await db.kidsQuizAttempt.create({
        data: {
          quizId: data.quizId,
          userId,
          score: data.score,
          totalPoints: data.totalPoints,
          correctCount: data.correctCount,
          wrongCount: data.wrongCount,
          timeSpent: data.timeSpent,
          answers: JSON.stringify(data.answers || [])
        }
      })
      return NextResponse.json(attempt)
    }

    if (type === 'game') {
      const score = await db.kidsGameScore.create({
        data: {
          gameId: data.gameId,
          userId,
          score: data.score,
          level: data.level || 1,
          timeSpent: data.timeSpent
        }
      })
      return NextResponse.json(score)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
