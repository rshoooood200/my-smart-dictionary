import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch daily challenges
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    
    const challenges = await db.kidsDailyChallenge.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(challenges)
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

// POST - Create a new challenge (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const challenge = await db.kidsDailyChallenge.create({
      data: {
        title: body.title,
        titleAr: body.titleAr,
        description: body.description,
        descriptionAr: body.descriptionAr,
        type: body.type || 'quiz',
        targetCount: body.targetCount || 1,
        xpReward: body.xpReward || 20,
        coinsReward: body.coinsReward || 10,
        icon: body.icon,
        color: body.color || '#F59E0B',
        validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json(challenge)
  } catch (error) {
    console.error('Error creating challenge:', error)
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
  }
}
