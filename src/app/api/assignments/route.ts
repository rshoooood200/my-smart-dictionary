import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get assignment or list assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    const classId = searchParams.get('classId')
    const teacherId = searchParams.get('teacherId')
    const userId = searchParams.get('userId') // For student's assignments
    const status = searchParams.get('status')

    if (assignmentId) {
      // Get specific assignment
      const assignment = await db.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          class: {
            include: {
              teacher: true,
              school: { select: { id: true, name: true } }
            }
          },
          teacher: true,
          _count: {
            select: { submissions: true }
          }
        }
      })
      return NextResponse.json(assignment)
    }

    if (classId) {
      // List assignments for class
      const assignments = await db.assignment.findMany({
        where: {
          classId,
          status: status || { in: ['published', 'closed'] }
        },
        include: {
          teacher: true,
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { dueAt: 'asc' }
      })
      return NextResponse.json(assignments)
    }

    if (teacherId) {
      // List teacher's assignments
      const assignments = await db.assignment.findMany({
        where: { teacherId },
        include: {
          class: {
            include: {
              school: { select: { id: true, name: true } }
            }
          },
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
      return NextResponse.json(assignments)
    }

    if (userId) {
      // Get student's assignments with submission status
      const enrollments = await db.classEnrollment.findMany({
        where: { userId, status: 'active' },
        select: { classId: true }
      })

      const classIds = enrollments.map(e => e.classId)

      const assignments = await db.assignment.findMany({
        where: {
          classId: { in: classIds },
          status: 'published'
        },
        include: {
          class: {
            include: {
              teacher: true
            }
          },
          submissions: {
            where: { userId },
            orderBy: { attemptNumber: 'desc' },
            take: 1
          }
        },
        orderBy: { dueAt: 'asc' }
      })

      return NextResponse.json(assignments)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      classId, teacherId, title, titleAr, description, descriptionAr,
      instructions, instructionsAr, attachments, type,
      wordIds, categoryIds, listIds, requiredWords, requiredAccuracy,
      requiredTime, totalPoints, passingScore, allowRetake, maxAttempts,
      dueAt, lateSubmissionAllowed, latePenalty
    } = body

    const assignment = await db.assignment.create({
      data: {
        classId,
        teacherId,
        title,
        titleAr,
        description,
        descriptionAr,
        instructions,
        instructionsAr,
        attachments: JSON.stringify(attachments || []),
        type: type || 'homework',
        wordIds: JSON.stringify(wordIds || []),
        categoryIds: JSON.stringify(categoryIds || []),
        listIds: JSON.stringify(listIds || []),
        requiredWords: requiredWords || 0,
        requiredAccuracy: requiredAccuracy || 0,
        requiredTime: requiredTime || 0,
        totalPoints: totalPoints || 100,
        passingScore: passingScore || 60,
        allowRetake: allowRetake ?? true,
        maxAttempts: maxAttempts || 3,
        dueAt: dueAt ? new Date(dueAt) : null,
        lateSubmissionAllowed: lateSubmissionAllowed || false,
        latePenalty: latePenalty || 0,
        status: 'draft'
      },
      include: {
        class: true,
        teacher: true
      }
    })

    // Update teacher stats
    await db.teacher.update({
      where: { id: teacherId },
      data: { totalAssignments: { increment: 1 } }
    })

    // Update class stats
    await db.class.update({
      where: { id: classId },
      data: { totalAssignments: { increment: 1 } }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update assignment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, titleAr, description, descriptionAr,
            instructions, instructionsAr, attachments,
            wordIds, categoryIds, listIds, requiredWords, requiredAccuracy,
            requiredTime, totalPoints, passingScore, allowRetake, maxAttempts,
            dueAt, lateSubmissionAllowed, latePenalty, status } = body

    const updateData: Record<string, unknown> = {}

    if (title !== undefined) updateData.title = title
    if (titleAr !== undefined) updateData.titleAr = titleAr
    if (description !== undefined) updateData.description = description
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr
    if (instructions !== undefined) updateData.instructions = instructions
    if (instructionsAr !== undefined) updateData.instructionsAr = instructionsAr
    if (attachments !== undefined) updateData.attachments = JSON.stringify(attachments)
    if (wordIds !== undefined) updateData.wordIds = JSON.stringify(wordIds)
    if (categoryIds !== undefined) updateData.categoryIds = JSON.stringify(categoryIds)
    if (listIds !== undefined) updateData.listIds = JSON.stringify(listIds)
    if (requiredWords !== undefined) updateData.requiredWords = requiredWords
    if (requiredAccuracy !== undefined) updateData.requiredAccuracy = requiredAccuracy
    if (requiredTime !== undefined) updateData.requiredTime = requiredTime
    if (totalPoints !== undefined) updateData.totalPoints = totalPoints
    if (passingScore !== undefined) updateData.passingScore = passingScore
    if (allowRetake !== undefined) updateData.allowRetake = allowRetake
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null
    if (lateSubmissionAllowed !== undefined) updateData.lateSubmissionAllowed = lateSubmissionAllowed
    if (latePenalty !== undefined) updateData.latePenalty = latePenalty

    if (status) {
      updateData.status = status
      if (status === 'published') {
        updateData.publishedAt = new Date()
      } else if (status === 'closed') {
        updateData.closedAt = new Date()
      }
    }

    const assignment = await db.assignment.update({
      where: { id },
      data: updateData,
      include: {
        class: true,
        teacher: true
      }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    }

    const assignment = await db.assignment.findUnique({
      where: { id }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Delete assignment and all submissions
    await db.assignmentSubmission.deleteMany({
      where: { assignmentId: id }
    })

    await db.assignment.delete({
      where: { id }
    })

    // Update teacher stats
    await db.teacher.update({
      where: { id: assignment.teacherId },
      data: { totalAssignments: { decrement: 1 } }
    })

    // Update class stats
    await db.class.update({
      where: { id: assignment.classId },
      data: { totalAssignments: { decrement: 1 } }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
