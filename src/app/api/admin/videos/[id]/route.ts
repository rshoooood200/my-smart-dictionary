import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// تحديث فيديو
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, titleAr, description, descriptionAr, url, thumbnail, category, type, ageGroup, difficulty, duration, order, isActive } = body

    const video = await prisma.adminVideo.update({
      where: { id },
      data: {
        title,
        titleAr,
        description,
        descriptionAr,
        url,
        thumbnail,
        category,
        type: type || 'video',
        ageGroup,
        difficulty: difficulty || 'easy',
        duration: duration || 0,
        order: order || 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('Error updating admin video:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث الفيديو' }, { status: 500 })
  }
}

// حذف فيديو
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.adminVideo.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin video:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الفيديو' }, { status: 500 })
  }
}
