import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Generate unique join code
function generateJoinCode(): string {
  return nanoid(8).toUpperCase()
}

// GET - Get class or list classes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const teacherId = searchParams.get('teacherId')
    const schoolId = searchParams.get('schoolId')
    const joinCode = searchParams.get('joinCode')
    const userId = searchParams.get('userId') // For student's enrolled classes

    if (classId) {
      // Get specific class
      const classData = await db.class.findUnique({
        where: { id: classId },
        include: {
          teacher: true,
          school: true,
          enrollments: {
            include: {
              _count: true
            }
          },
          _count: {
            select: { enrollments: true, assignments: true, lessons: true }
          }
        }
      })
      return NextResponse.json(classData)
    }

    if (joinCode) {
      // Get class by join code
      const classData = await db.class.findUnique({
        where: { joinCode },
        include: {
          teacher: true,
          school: true,
          _count: {
            select: { enrollments: true }
          }
        }
      })
      return NextResponse.json(classData)
    }

    if (teacherId) {
      // List teacher's classes
      const classes = await db.class.findMany({
        where: { teacherId, isActive: true },
        include: {
          school: { select: { id: true, name: true, nameAr: true } },
          _count: {
            select: { enrollments: true, assignments: true, lessons: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(classes)
    }

    if (schoolId) {
      // List school's classes
      const classes = await db.class.findMany({
        where: { schoolId, isActive: true },
        include: {
          teacher: true,
          _count: {
            select: { enrollments: true, assignments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(classes)
    }

    if (userId) {
      // Get student's enrolled classes
      const enrollments = await db.classEnrollment.findMany({
        where: { userId, status: 'active' },
        include: {
          class: {
            include: {
              teacher: true,
              school: { select: { id: true, name: true, nameAr: true } },
              _count: {
                select: { enrollments: true, assignments: true }
              }
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      })
      return NextResponse.json(enrollments.map(e => e.class))
    }

    // List all classes (admin only)
    const classes = await db.class.findMany({
      where: { isActive: true },
      include: {
        teacher: { select: { id: true, userId: true } },
        school: { select: { id: true, name: true } },
        _count: {
          select: { enrollments: true, assignments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      teacherId, schoolId, name, nameAr, description, descriptionAr,
      grade, subject, academicYear, semester, room,
      maxStudents, isPublic, allowStudentInvite, requireApproval
    } = body

    const classData = await db.class.create({
      data: {
        teacherId,
        schoolId,
        name,
        nameAr,
        description,
        descriptionAr,
        grade,
        subject,
        academicYear,
        semester,
        room,
        maxStudents: maxStudents || 50,
        isPublic: isPublic || false,
        allowStudentInvite: allowStudentInvite || false,
        requireApproval: requireApproval ?? true,
        joinCode: generateJoinCode()
      },
      include: {
        teacher: true,
        school: true
      }
    })

    // Update teacher stats
    await db.teacher.update({
      where: { id: teacherId },
      data: { totalClasses: { increment: 1 } }
    })

    // Update school stats
    if (schoolId) {
      await db.school.update({
        where: { id: schoolId },
        data: { totalClasses: { increment: 1 } }
      })
    }

    return NextResponse.json(classData)
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update class
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, nameAr, description, descriptionAr, grade, subject,
            academicYear, semester, room, maxStudents, isPublic,
            allowStudentInvite, requireApproval, isActive } = body

    const classData = await db.class.update({
      where: { id },
      data: {
        name,
        nameAr,
        description,
        descriptionAr,
        grade,
        subject,
        academicYear,
        semester,
        room,
        maxStudents,
        isPublic,
        allowStudentInvite,
        requireApproval,
        isActive
      },
      include: {
        teacher: true,
        school: true
      }
    })

    return NextResponse.json(classData)
  } catch (error) {
    console.error('Error updating class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete class (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
    }

    const classData = await db.class.findUnique({
      where: { id }
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Soft delete
    await db.class.update({
      where: { id },
      data: { isActive: false, archivedAt: new Date() }
    })

    // Update teacher stats
    await db.teacher.update({
      where: { id: classData.teacherId },
      data: { totalClasses: { decrement: 1 } }
    })

    // Update school stats
    if (classData.schoolId) {
      await db.school.update({
        where: { id: classData.schoolId },
        data: { totalClasses: { decrement: 1 } }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
