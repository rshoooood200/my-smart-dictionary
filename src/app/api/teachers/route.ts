import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET - Get teacher profile or list teachers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const schoolId = searchParams.get('schoolId')
    const teacherId = searchParams.get('teacherId')

    if (teacherId) {
      // Get specific teacher
      const teacher = await db.teacher.findUnique({
        where: { id: teacherId },
        include: {
          school: true,
          classes: {
            where: { isActive: true },
            include: {
              _count: {
                select: { enrollments: true, assignments: true, lessons: true }
              }
            }
          },
          _count: {
            select: { classes: true, students: true, assignments: true }
          }
        }
      })
      return NextResponse.json(teacher)
    }

    if (userId) {
      // Get teacher by user ID
      const teacher = await db.teacher.findUnique({
        where: { userId },
        include: {
          school: true,
          classes: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { classes: true, students: true }
          }
        }
      })
      return NextResponse.json(teacher)
    }

    if (schoolId) {
      // List teachers in school
      const teachers = await db.teacher.findMany({
        where: { schoolId, isActive: true },
        include: {
          _count: {
            select: { classes: true, students: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(teachers)
    }

    // List all teachers (admin only)
    const teachers = await db.teacher.findMany({
      where: { isActive: true },
      include: {
        school: { select: { id: true, name: true, nameAr: true } },
        _count: {
          select: { classes: true, students: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create teacher profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, schoolId, department, subjects, bio, bioAr, employeeId } = body

    // Check if teacher already exists
    const existingTeacher = await db.teacher.findUnique({
      where: { userId }
    })

    if (existingTeacher) {
      return NextResponse.json({ error: 'Teacher profile already exists' }, { status: 400 })
    }

    const teacher = await db.teacher.create({
      data: {
        userId,
        schoolId,
        department,
        subjects: JSON.stringify(subjects || []),
        bio,
        bioAr,
        employeeId
      },
      include: {
        school: true
      }
    })

    // Update school stats if applicable
    if (schoolId) {
      await db.school.update({
        where: { id: schoolId },
        data: { totalTeachers: { increment: 1 } }
      })
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error creating teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update teacher profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, department, subjects, bio, bioAr, employeeId, isActive } = body

    const teacher = await db.teacher.update({
      where: id ? { id } : { userId },
      data: {
        department,
        subjects: subjects ? JSON.stringify(subjects) : undefined,
        bio,
        bioAr,
        employeeId,
        isActive
      },
      include: {
        school: true
      }
    })

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error updating teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete teacher profile
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id && !userId) {
      return NextResponse.json({ error: 'Teacher ID or User ID required' }, { status: 400 })
    }

    const teacher = await db.teacher.findUnique({
      where: id ? { id } : { userId: userId! }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Soft delete
    await db.teacher.update({
      where: { id: teacher.id },
      data: { isActive: false }
    })

    // Update school stats
    if (teacher.schoolId) {
      await db.school.update({
        where: { id: teacher.schoolId },
        data: { totalTeachers: { decrement: 1 } }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
