import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get all learning paths
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const publicOnly = searchParams.get('public') === 'true'
    const templates = searchParams.get('templates') === 'true'

    const where: Record<string, unknown> = {}
    
    if (publicOnly) {
      where.isPublic = true
    } else if (templates) {
      where.isTemplate = true
    } else if (userId) {
      where.OR = [
        { userId },
        { isPublic: true }
      ]
    }

    const paths = await db.learningPath.findMany({
      where,
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        },
        progress: userId ? {
          where: { userId }
        } : false
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate progress for each path
    const pathsWithProgress = paths.map(path => {
      const totalLessons = path.lessons.length
      const completedLessons = path.progress?.filter(p => p.status === 'completed').length || 0
      const inProgressLessons = path.progress?.filter(p => p.status === 'in_progress').length || 0
      
      return {
        ...path,
        progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        completedLessons,
        inProgressLessons,
        totalLessons
      }
    })

    return NextResponse.json({ paths: pathsWithProgress })
  } catch (error) {
    console.error('Error fetching learning paths:', error)
    return NextResponse.json({ error: 'Failed to fetch learning paths' }, { status: 500 })
  }
}

// POST - Create a new learning path
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, title, titleAr, description, descriptionAr, 
      level, category, icon, color, isPublic, isTemplate, 
      estimatedDays, lessons 
    } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const path = await db.learningPath.create({
      data: {
        userId,
        title,
        titleAr,
        description,
        descriptionAr,
        level: level || 'beginner',
        category,
        icon,
        color: color || '#10B981',
        isPublic: isPublic || false,
        isTemplate: isTemplate || false,
        estimatedDays: estimatedDays || 30,
        totalLessons: lessons?.length || 0,
        totalWords: lessons?.reduce((sum: number, l: { wordCount?: number }) => sum + (l.wordCount || 0), 0) || 0,
        lessons: lessons ? {
          create: lessons.map((lesson: Record<string, unknown>, index: number) => ({
            title: lesson.title as string,
            titleAr: lesson.titleAr as string | undefined,
            description: lesson.description as string | undefined,
            descriptionAr: lesson.descriptionAr as string | undefined,
            order: index,
            duration: (lesson.duration as number) || 15,
            wordCount: (lesson.wordCount as number) || 0,
            content: JSON.stringify(lesson.content || {})
          }))
        } : undefined
      },
      include: {
        lessons: true
      }
    })

    return NextResponse.json({ path })
  } catch (error) {
    console.error('Error creating learning path:', error)
    return NextResponse.json({ error: 'Failed to create learning path' }, { status: 500 })
  }
}
