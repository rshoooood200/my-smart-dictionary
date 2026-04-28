import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch a single quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const quiz = await db.kidsQuiz.findUnique({
      where: { id },
      include: {
        _count: {
          select: { attempts: true }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 })
  }
}

// PUT - Update a quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const quiz = await db.kidsQuiz.update({
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
        timeLimit: body.timeLimit,
        questions: typeof body.questions === 'string' ? body.questions : JSON.stringify(body.questions || []),
        order: body.order,
        isActive: body.isActive
      }
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 })
  }
}

// DELETE - Delete a quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.kidsQuiz.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
  }
}
