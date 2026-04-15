import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get a single learning path with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const path = await db.learningPath.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        },
        progress: userId ? {
          where: { userId }
        } : false
      }
    })

    if (!path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 })
    }

    // Calculate overall progress
    const totalLessons = path.lessons.length
    const progressData = path.progress || []
    const completedLessons = progressData.filter(p => p.status === 'completed').length
    const inProgressLessons = progressData.filter(p => p.status === 'in_progress').length

    const pathWithProgress = {
      ...path,
      progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      completedLessons,
      inProgressLessons,
      totalLessons
    }

    return NextResponse.json({ path: pathWithProgress })
  } catch (error) {
    console.error('Error fetching learning path:', error)
    return NextResponse.json({ error: 'Failed to fetch learning path' }, { status: 500 })
  }
}

// PUT - Update a learning path
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      title, titleAr, description, descriptionAr, 
      level, category, icon, color, isPublic, isTemplate, 
      estimatedDays, lessons 
    } = body

    // If lessons provided, delete existing and create new
    if (lessons) {
      await db.learningLesson.deleteMany({
        where: { pathId: id }
      })

      await db.learningLesson.createMany({
        data: lessons.map((lesson: Record<string, unknown>, index: number) => ({
          pathId: id,
          title: lesson.title as string,
          titleAr: lesson.titleAr as string | undefined,
          description: lesson.description as string | undefined,
          descriptionAr: lesson.descriptionAr as string | undefined,
          order: index,
          duration: (lesson.duration as number) || 15,
          wordCount: (lesson.wordCount as number) || 0,
          content: JSON.stringify(lesson.content || {})
        }))
      })
    }

    const path = await db.learningPath.update({
      where: { id },
      data: {
        title,
        titleAr,
        description,
        descriptionAr,
        level,
        category,
        icon,
        color,
        isPublic,
        isTemplate,
        estimatedDays,
        totalLessons: lessons?.length,
        totalWords: lessons?.reduce((sum: number, l: { wordCount?: number }) => sum + (l.wordCount || 0), 0),
        updatedAt: new Date()
      },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({ path })
  } catch (error) {
    console.error('Error updating learning path:', error)
    return NextResponse.json({ error: 'Failed to update learning path' }, { status: 500 })
  }
}

// DELETE - Delete a learning path
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.learningPath.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting learning path:', error)
    return NextResponse.json({ error: 'Failed to delete learning path' }, { status: 500 })
  }
}

// PATCH - Update lesson progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { lessonId, userId, status, progress, score } = body

    if (!lessonId || !userId) {
      return NextResponse.json({ error: 'lessonId and userId are required' }, { status: 400 })
    }

    const existingProgress = await db.learningProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId }
      }
    })

    if (existingProgress) {
      // Update existing progress
      const updatedProgress = await db.learningProgress.update({
        where: { id: existingProgress.id },
        data: {
          status: status || existingProgress.status,
          progress: progress ?? existingProgress.progress,
          score: score ?? existingProgress.score,
          startedAt: status === 'in_progress' && !existingProgress.startedAt ? new Date() : existingProgress.startedAt,
          completedAt: status === 'completed' ? new Date() : existingProgress.completedAt
        }
      })
      return NextResponse.json({ progress: updatedProgress })
    } else {
      // Create new progress
      const newProgress = await db.learningProgress.create({
        data: {
          pathId: id,
          lessonId,
          userId,
          status: status || 'in_progress',
          progress: progress || 0,
          score: score || 0,
          startedAt: new Date()
        }
      })
      return NextResponse.json({ progress: newProgress })
    }
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
