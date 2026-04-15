import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// تحديث درس
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, titleAr, description, descriptionAr, content, contentAr, category, level, order, duration, isActive } = body

    const lesson = await prisma.adminLesson.update({
      where: { id },
      data: {
        title,
        titleAr,
        description,
        descriptionAr,
        content,
        contentAr,
        category,
        level,
        order,
        duration,
        isActive
      }
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error updating admin lesson:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث الدرس' }, { status: 500 })
  }
}

// حذف درس
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.adminLesson.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin lesson:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الدرس' }, { status: 500 })
  }
}
