import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notes - Get all notes for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const notes = await db.note.findMany({
      where: {
        userId,
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, data: notes })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, content, color, tags } = body

    if (!userId || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'userId, title, and content are required' },
        { status: 400 }
      )
    }

    const note = await db.note.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        color: color || '#10B981',
        tags: JSON.stringify(tags || [])
      }
    })

    return NextResponse.json({ success: true, data: note }, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
