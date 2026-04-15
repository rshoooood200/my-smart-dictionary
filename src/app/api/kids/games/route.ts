import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all games
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const ageGroup = searchParams.get('ageGroup')
    const type = searchParams.get('type')

    const where: any = { isActive: true }
    if (category) where.category = category
    if (ageGroup) where.ageGroup = ageGroup
    if (type) where.type = type

    const games = await db.kidsGame.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { scores: true }
        }
      }
    })

    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

// POST - Create a new game (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle config - it might be a string or object
    let configStr = '{}'
    if (body.config) {
      if (typeof body.config === 'string') {
        configStr = body.config
      } else {
        configStr = JSON.stringify(body.config)
      }
    }
    
    const game = await db.kidsGame.create({
      data: {
        title: body.title,
        titleAr: body.titleAr,
        description: body.description,
        descriptionAr: body.descriptionAr,
        category: body.category,
        type: body.type || 'memory',
        difficulty: body.difficulty || 'easy',
        ageGroup: body.ageGroup || '5-7',
        xpReward: body.xpReward !== undefined ? body.xpReward : 15,
        config: configStr,
        thumbnail: body.thumbnail,
        order: body.order || 0,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}
