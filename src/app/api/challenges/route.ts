import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get challenges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'my-challenges'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'my-challenges') {
      // Get user's challenges
      const challenges = await db.challenge.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { opponentId: userId }
          ]
        },
        include: {
          creator: {
            select: { id: true, name: true, level: true, xp: true, avatar: true }
          },
          opponent: {
            select: { id: true, name: true, level: true, xp: true, avatar: true }
          },
          winner: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ challenges })
    }

    if (type === 'open-challenges') {
      // Get open challenges that user can join
      const challenges = await db.challenge.findMany({
        where: {
          status: 'open',
          creatorId: { not: userId }
        },
        include: {
          creator: {
            select: { id: true, name: true, level: true, xp: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      return NextResponse.json({ challenges })
    }

    if (type === 'challenge-detail') {
      const challengeId = searchParams.get('challengeId')
      if (!challengeId) {
        return NextResponse.json({ error: 'challengeId is required' }, { status: 400 })
      }

      const challenge = await db.challenge.findUnique({
        where: { id: challengeId },
        include: {
          creator: {
            select: { id: true, name: true, level: true, xp: true, avatar: true }
          },
          opponent: {
            select: { id: true, name: true, level: true, xp: true, avatar: true }
          },
          winner: {
            select: { id: true, name: true }
          },
          attempts: {
            include: {
              user: { select: { id: true, name: true, level: true } }
            }
          }
        }
      })

      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }

      return NextResponse.json({ challenge })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Challenges API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or join challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, data } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'create-challenge') {
      const { title, titleAr, description, type: challengeType, difficulty, opponentId, xpReward, wordCount, timeLimit } = data

      // If opponent specified, create direct challenge
      // Otherwise, create open challenge
      const challenge = await db.challenge.create({
        data: {
          title,
          titleAr,
          description,
          type: challengeType || 'vocabulary',
          difficulty: difficulty || 'medium',
          creatorId: userId,
          opponentId: opponentId || null,
          status: opponentId ? 'active' : 'open',
          xpReward: xpReward || 50,
          wordCount: wordCount || 10,
          timeLimit,
          startDate: opponentId ? new Date() : null
        },
        include: {
          creator: { select: { id: true, name: true, level: true } }
        }
      })

      return NextResponse.json({ challenge, success: true })
    }

    if (type === 'join-challenge') {
      const { challengeId } = data

      const challenge = await db.challenge.findUnique({
        where: { id: challengeId }
      })

      if (!challenge || challenge.status !== 'open') {
        return NextResponse.json({ error: 'Challenge not available' }, { status: 400 })
      }

      const updatedChallenge = await db.challenge.update({
        where: { id: challengeId },
        data: {
          opponentId: userId,
          status: 'active',
          startDate: new Date()
        },
        include: {
          creator: { select: { id: true, name: true, level: true } },
          opponent: { select: { id: true, name: true, level: true } }
        }
      })

      return NextResponse.json({ challenge: updatedChallenge, success: true })
    }

    if (type === 'submit-attempt') {
      const { challengeId, score, correctCount, wrongCount, timeSpent } = data

      const challenge = await db.challenge.findUnique({
        where: { id: challengeId }
      })

      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }

      // Check if user already attempted
      const existingAttempt = await db.challengeAttempt.findUnique({
        where: { challengeId_userId: { challengeId, userId } }
      })

      if (existingAttempt) {
        return NextResponse.json({ error: 'Already attempted' }, { status: 400 })
      }

      // Create attempt
      const attempt = await db.challengeAttempt.create({
        data: {
          challengeId,
          userId,
          score,
          correctCount,
          wrongCount,
          timeSpent
        }
      })

      // Update challenge scores
      const isCreator = challenge.creatorId === userId
      const updateData: any = {}
      
      if (isCreator) {
        updateData.creatorScore = score
      } else {
        updateData.opponentScore = score
      }

      // Check if both players have attempted
      const attempts = await db.challengeAttempt.findMany({
        where: { challengeId }
      })

      if (attempts.length === 2) {
        // Determine winner
        const creatorAttempt = attempts.find(a => a.userId === challenge.creatorId)
        const opponentAttempt = attempts.find(a => a.userId !== challenge.creatorId)

        if (creatorAttempt && opponentAttempt) {
          let winnerId = null
          if (creatorAttempt.score > opponentAttempt.score) {
            winnerId = challenge.creatorId
          } else if (opponentAttempt.score > creatorAttempt.score) {
            winnerId = challenge.opponentId
          }

          updateData.winnerId = winnerId
          updateData.status = 'completed'
          updateData.endDate = new Date()

          // Award XP to winner
          if (winnerId) {
            await db.user.update({
              where: { id: winnerId },
              data: { xp: { increment: challenge.xpReward } }
            })
          }
        }
      }

      await db.challenge.update({
        where: { id: challengeId },
        data: updateData
      })

      return NextResponse.json({ attempt, success: true })
    }

    if (type === 'cancel-challenge') {
      const { challengeId } = data

      await db.challenge.deleteMany({
        where: {
          id: challengeId,
          creatorId: userId,
          status: 'open'
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Challenges POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
