import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch a single flashcard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const flashcard = await db.kidsFlashcard.findUnique({
      where: { id }
    })

    if (!flashcard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 })
    }

    return NextResponse.json(flashcard)
  } catch (error) {
    console.error('Error fetching flashcard:', error)
    return NextResponse.json({ error: 'Failed to fetch flashcard' }, { status: 500 })
  }
}

// PUT - Update a flashcard
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const flashcard = await db.kidsFlashcard.update({
      where: { id },
      data: {
        word: body.word,
        wordAr: body.wordAr,
        translation: body.translation,
        translationAr: body.translationAr,
        imageUrl: body.imageUrl,
        audioUrl: body.audioUrl,
        category: body.category,
        ageGroup: body.ageGroup,
        example: body.example,
        exampleAr: body.exampleAr,
        order: body.order,
        isActive: body.isActive
      }
    })

    return NextResponse.json(flashcard)
  } catch (error) {
    console.error('Error updating flashcard:', error)
    return NextResponse.json({ error: 'Failed to update flashcard' }, { status: 500 })
  }
}

// DELETE - Delete a flashcard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.kidsFlashcard.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flashcard:', error)
    return NextResponse.json({ error: 'Failed to delete flashcard' }, { status: 500 })
  }
}
