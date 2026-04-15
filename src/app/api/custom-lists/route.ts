import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get all custom lists for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const publicOnly = searchParams.get('public') === 'true'
    const templates = searchParams.get('templates') === 'true'

    if (!userId && !publicOnly && !templates) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {}
    
    if (publicOnly) {
      where.isPublic = true
    } else if (templates) {
      where.isTemplate = true
    } else if (userId) {
      where.userId = userId
    }

    const lists = await db.customList.findMany({
      where,
      include: {
        listWords: {
          include: {
            word: {
              include: {
                sentences: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        user: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ lists })
  } catch (error) {
    console.error('Error fetching custom lists:', error)
    return NextResponse.json({ error: 'Failed to fetch custom lists' }, { status: 500 })
  }
}

// POST - Create a new custom list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, nameAr, description, color, icon, isPublic, isTemplate, tags, wordIds } = body

    if (!userId || !name) {
      return NextResponse.json({ error: 'userId and name are required' }, { status: 400 })
    }

    // Create list with words
    const list = await db.customList.create({
      data: {
        userId,
        name,
        nameAr,
        description,
        color: color || '#10B981',
        icon,
        isPublic: isPublic || false,
        isTemplate: isTemplate || false,
        tags: JSON.stringify(tags || []),
        wordCount: wordIds?.length || 0,
        listWords: wordIds ? {
          create: wordIds.map((wordId: string, index: number) => ({
            wordId,
            order: index
          }))
        } : undefined
      },
      include: {
        listWords: {
          include: {
            word: true
          }
        }
      }
    })

    return NextResponse.json({ list })
  } catch (error) {
    console.error('Error creating custom list:', error)
    return NextResponse.json({ error: 'Failed to create custom list' }, { status: 500 })
  }
}
