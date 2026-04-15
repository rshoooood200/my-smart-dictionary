import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch flashcards
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const ageGroup = searchParams.get('ageGroup')

    const where: any = { isActive: true }
    if (category) where.category = category
    if (ageGroup) where.ageGroup = ageGroup

    const flashcards = await db.kidsFlashcard.findMany({
      where,
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(flashcards)
  } catch (error) {
    console.error('Error fetching flashcards:', error)
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 })
  }
}

// POST - Create a new flashcard (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const flashcard = await db.kidsFlashcard.create({
      data: {
        word: body.word,
        wordAr: body.wordAr,
        translation: body.translation,
        translationAr: body.translationAr,
        imageUrl: body.imageUrl,
        audioUrl: body.audioUrl,
        category: body.category,
        ageGroup: body.ageGroup || '5-7',
        example: body.example,
        exampleAr: body.exampleAr,
        order: body.order || 0,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json(flashcard)
  } catch (error) {
    console.error('Error creating flashcard:', error)
    return NextResponse.json({ error: 'Failed to create flashcard' }, { status: 500 })
  }
}
