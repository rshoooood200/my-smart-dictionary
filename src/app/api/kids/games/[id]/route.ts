import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch a single game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const game = await db.kidsGame.findUnique({
      where: { id },
      include: {
        _count: {
          select: { scores: true }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}

// PUT - Update a game
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    
    const game = await db.kidsGame.update({
      where: { id },
      data: {
        title: body.title,
        titleAr: body.titleAr,
        description: body.description,
        descriptionAr: body.descriptionAr,
        category: body.category,
        type: body.type,
        difficulty: body.difficulty,
        ageGroup: body.ageGroup,
        xpReward: body.xpReward,
        config: configStr,
        thumbnail: body.thumbnail,
        order: body.order,
        isActive: body.isActive
      }
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}

// DELETE - Delete a game
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.kidsGame.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}
