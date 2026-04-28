import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyNoteOwnership, unauthorizedResponse } from '@/lib/auth-helpers'

// GET /api/notes/[id] - Get a single note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const note = await db.note.findUnique({
      where: { id }
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'الملاحظة غير موجودة' },
        { status: 404 }
      )
    }

    // التحقق من الملكية
    if (userId && note.userId !== userId) {
      return unauthorizedResponse()
    }

    return NextResponse.json({ success: true, data: note })
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch note' },
      { status: 500 }
    )
  }
}

// PUT /api/notes/[id] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, title, content, color, isPinned, isArchived, tags } = body

    // التحقق من الملكية
    const existingNote = await verifyNoteOwnership(id, userId)
    if (!existingNote) {
      return unauthorizedResponse()
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content.trim()
    if (color !== undefined) updateData.color = color
    if (isPinned !== undefined) updateData.isPinned = isPinned
    if (isArchived !== undefined) updateData.isArchived = isArchived
    if (tags !== undefined) updateData.tags = JSON.stringify(tags)

    const note = await db.note.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, data: note })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update note' },
      { status: 500 }
    )
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // التحقق من الملكية
    const existingNote = await verifyNoteOwnership(id, userId || '')
    if (!existingNote) {
      return unauthorizedResponse()
    }

    await db.note.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}
