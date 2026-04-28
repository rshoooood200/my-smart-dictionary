import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET - Get school or list schools
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')

    if (schoolId) {
      // Get specific school
      const school = await db.school.findUnique({
        where: { id: schoolId },
        include: {
          admins: true,
          _count: {
            select: { teachers: true, classes: true }
          }
        }
      })
      return NextResponse.json(school)
    }

    if (userId) {
      // Get schools where user is admin
      const adminSchools = await db.schoolAdmin.findMany({
        where: { userId, isActive: true },
        include: {
          school: {
            include: {
              _count: {
                select: { teachers: true, classes: true }
              }
            }
          }
        }
      })
      return NextResponse.json(adminSchools.map(a => a.school))
    }

    // List schools
    const schools = await db.school.findMany({
      where: {
        isActive: true,
        ...(type ? { type } : {})
      },
      include: {
        _count: {
          select: { teachers: true, classes: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return NextResponse.json(schools)
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create school
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, nameAr, logo, coverImage, description, descriptionAr,
      email, phone, website, address, city, country,
      type, subscription, maxTeachers, maxStudents, maxClasses,
      features, settings, adminId
    } = body

    const school = await db.school.create({
      data: {
        name,
        nameAr,
        logo,
        coverImage,
        description,
        descriptionAr,
        email,
        phone,
        website,
        address,
        city,
        country: country || 'Saudi Arabia',
        type: type || 'school',
        subscription: subscription || 'free',
        maxTeachers: maxTeachers || 5,
        maxStudents: maxStudents || 100,
        maxClasses: maxClasses || 20,
        features: JSON.stringify(features || []),
        settings: JSON.stringify(settings || {})
      }
    })

    // Add creator as admin
    if (adminId) {
      await db.schoolAdmin.create({
        data: {
          schoolId: school.id,
          userId: adminId,
          role: 'owner',
          permissions: JSON.stringify(['all']),
          joinedAt: new Date()
        }
      })
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error creating school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update school
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, nameAr, logo, coverImage, description, descriptionAr,
            email, phone, website, address, city, country,
            type, subscription, maxTeachers, maxStudents, maxClasses,
            features, settings, isActive, isVerified } = body

    const school = await db.school.update({
      where: { id },
      data: {
        name,
        nameAr,
        logo,
        coverImage,
        description,
        descriptionAr,
        email,
        phone,
        website,
        address,
        city,
        country,
        type,
        subscription,
        maxTeachers,
        maxStudents,
        maxClasses,
        features: features ? JSON.stringify(features) : undefined,
        settings: settings ? JSON.stringify(settings) : undefined,
        isActive,
        isVerified,
        verifiedAt: isVerified ? new Date() : undefined
      }
    })

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error updating school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete school (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 })
    }

    // Soft delete
    await db.school.update({
      where: { id },
      data: { isActive: false }
    })

    // Deactivate all teachers
    await db.teacher.updateMany({
      where: { schoolId: id },
      data: { isActive: false }
    })

    // Deactivate all classes
    await db.class.updateMany({
      where: { schoolId: id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
