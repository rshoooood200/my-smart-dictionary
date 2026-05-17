import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET - Get a single custom list (فقط قوائمك أو القوائم العامة)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

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

    // التحقق: فقط المالك أو القوائم العامة
    if (list.userId !== userId && !list.isPublic) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول لهذه القائمة' },
        { status: 403 }
      )
    }

    return NextResponse.json({ list })
  } catch (error) {
    console.error('Error fetching custom list:', error)
    return NextResponse.json({ error: 'Failed to fetch custom list' }, { status: 500 })
  }
}

// PUT - Update a custom list (فقط قوائمك)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { id } = await params

    // التحقق من الملكية
    const existing = await db.customList.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'غير مصرح لك بتعديل هذه القائمة' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, nameAr, description, color, icon, isPublic, isTemplate, tags, wordIds } = body

    // If wordIds provided, update the list words
    if (wordIds) {
      await db.customListWord.deleteMany({
        where: { listId: id }
      })

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

// DELETE - Delete a custom list (فقط قوائمك)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { id } = await params

    // التحقق من الملكية
    const existing = await db.customList.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'غير مصرح لك بحذف هذه القائمة' },
        { status: 403 }
      )
    }

    await db.customList.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom list:', error)
    return NextResponse.json({ error: 'Failed to delete custom list' }, { status: 500 })
  }
}

// PATCH - Add/remove words from list (فقط قوائمك)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { id } = await params

    // التحقق من الملكية
    const existing = await db.customList.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'غير مصرح لك بتعديل هذه القائمة' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, wordId } = body

    if (action === 'add') {
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
