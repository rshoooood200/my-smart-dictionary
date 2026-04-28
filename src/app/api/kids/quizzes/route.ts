import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all quizzes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const ageGroup = searchParams.get('ageGroup')
    const type = searchParams.get('type')

    const where: any = { isActive: true }
    if (category) where.category = category
    if (ageGroup) where.ageGroup = ageGroup
    if (type) where.type = type

    const quizzes = await db.kidsQuiz.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { attempts: true }
        }
      }
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}

// POST - Create a new quiz (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const quiz = await db.kidsQuiz.create({
      data: {
        title: body.title,
        titleAr: body.titleAr,
        description: body.description,
        descriptionAr: body.descriptionAr,
        category: body.category,
        type: body.type || 'multiple_choice',
        difficulty: body.difficulty || 'easy',
        ageGroup: body.ageGroup || '5-7',
        xpReward: body.xpReward !== undefined ? body.xpReward : 10,
        timeLimit: body.timeLimit,
        questions: JSON.stringify(body.questions),
        order: body.order || 0,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
