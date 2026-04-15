import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch interactive content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const contentId = searchParams.get('contentId')
    const isPublic = searchParams.get('isPublic') === 'true'

    // Fetch single content
    if (contentId) {
      const content = await db.interactiveContent.findUnique({
        where: { id: contentId },
        include: {
          questions: { orderBy: { order: 'asc' } },
          progress: userId ? { where: { userId } } : false
        }
      })

      if (!content) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }

      return NextResponse.json({ content })
    }

    // Build filter
    const where: any = { isActive: true }
    if (userId && !isPublic) {
      where.userId = userId
    }
    if (isPublic) {
      where.isPublic = true
    }
    if (type) {
      where.type = type
    }

    const content = await db.interactiveContent.findMany({
      where,
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { progress: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error fetching interactive content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new interactive content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      title,
      titleAr,
      description,
      descriptionAr,
      type = 'flashcard',
      category,
      difficulty = 'beginner',
      content,
      settings,
      hints,
      feedback,
      images,
      audioUrl,
      videoUrl,
      xpReward = 10,
      coinsReward = 5,
      timeLimit,
      attemptsLimit = 3,
      isPublic = false,
      questions
    } = body

    if (!userId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create content with questions
    const newContent = await db.interactiveContent.create({
      data: {
        userId,
        title,
        titleAr,
        description,
        descriptionAr,
        type,
        category,
        difficulty,
        content: content || '{}',
        settings: settings || '{}',
        hints: hints || '[]',
        feedback: feedback || '{}',
        images: images || '[]',
        audioUrl,
        videoUrl,
        xpReward,
        coinsReward,
        timeLimit,
        attemptsLimit,
        isPublic,
        questions: questions ? {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            questionAr: q.questionAr,
            type: q.type || 'multiple_choice',
            options: JSON.stringify(q.options || []),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            explanationAr: q.explanationAr,
            points: q.points || 10,
            order: index,
            mediaUrl: q.mediaUrl,
            hint: q.hint,
            hintAr: q.hintAr
          }))
        } : undefined
      },
      include: {
        questions: true
      }
    })

    return NextResponse.json({ content: newContent })
  } catch (error) {
    console.error('Error creating interactive content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update interactive content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, ...updateData } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.interactiveContent.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updated = await db.interactiveContent.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        questions: true
      }
    })

    return NextResponse.json({ content: updated })
  } catch (error) {
    console.error('Error updating interactive content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete interactive content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.interactiveContent.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.interactiveContent.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting interactive content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
