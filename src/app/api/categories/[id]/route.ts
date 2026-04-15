import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyCategoryOwnership, unauthorizedResponse } from '@/lib/auth-helpers'

// GET /api/categories/[id] - Get a single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { words: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      )
    }

    // التحقق من الملكية
    if (userId && category.userId !== userId) {
      return unauthorizedResponse()
    }

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, name, nameAr, color, icon } = body

    // التحقق من الملكية
    const existingCategory = await verifyCategoryOwnership(id, userId)
    if (!existingCategory) {
      return unauthorizedResponse()
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.toLowerCase().trim()
    if (nameAr !== undefined) updateData.nameAr = nameAr?.trim() || null
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon || null

    const category = await db.category.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // التحقق من الملكية
    const existingCategory = await verifyCategoryOwnership(id, userId || '')
    if (!existingCategory) {
      return unauthorizedResponse()
    }

    // Unlink words from category
    await db.word.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    })

    await db.category.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
