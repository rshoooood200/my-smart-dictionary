import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get a single custom list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const list = await db.customList.findUnique({
      where: { id },
      include: {
        listWords: {
          include: {
            word: {
              include: {
                sentences: true,
                category: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    })

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    return NextResponse.json({ list })
  } catch (error) {
    console.error('Error fetching custom list:', error)
    return NextResponse.json({ error: 'Failed to fetch custom list' }, { status: 500 })
  }
}

// PUT - Update a custom list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, nameAr, description, color, icon, isPublic, isTemplate, tags, wordIds } = body

    // If wordIds provided, update the list words
    if (wordIds) {
      // Delete existing words
      await db.customListWord.deleteMany({
        where: { listId: id }
      })

      // Create new words
      await db.customListWord.createMany({
        data: wordIds.map((wordId: string, index: number) => ({
          listId: id,
          wordId,
          order: index
        }))
      })
    }

    const list = await db.customList.update({
      where: { id },
      data: {
        name,
        nameAr,
        description,
        color,
        icon,
        isPublic,
        isTemplate,
        tags: tags ? JSON.stringify(tags) : undefined,
        wordCount: wordIds?.length,
        updatedAt: new Date()
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
    console.error('Error updating custom list:', error)
    return NextResponse.json({ error: 'Failed to update custom list' }, { status: 500 })
  }
}

// DELETE - Delete a custom list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.customList.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom list:', error)
    return NextResponse.json({ error: 'Failed to delete custom list' }, { status: 500 })
  }
}

// PATCH - Add/remove words from list
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, wordId } = body

    if (action === 'add') {
      // Get current max order
      const maxOrder = await db.customListWord.findFirst({
        where: { listId: id },
        orderBy: { order: 'desc' },
        select: { order: true }
      })

      await db.customListWord.create({
        data: {
          listId: id,
          wordId,
          order: (maxOrder?.order || 0) + 1
        }
      })

      // Update word count
      await db.customList.update({
        where: { id },
        data: { wordCount: { increment: 1 } }
      })
    } else if (action === 'remove') {
      await db.customListWord.delete({
        where: {
          listId_wordId: { listId: id, wordId }
        }
      })

      // Update word count
      await db.customList.update({
        where: { id },
        data: { wordCount: { decrement: 1 } }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating list words:', error)
    return NextResponse.json({ error: 'Failed to update list words' }, { status: 500 })
  }
}
