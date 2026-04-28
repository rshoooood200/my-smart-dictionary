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
    
    // بناء كائن البيانات للتحديث فقط الحقول الموجودة
    const updateData: Record<string, unknown> = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.titleAr !== undefined) updateData.titleAr = body.titleAr
    if (body.description !== undefined) updateData.description = body.description
    if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr
    if (body.url !== undefined) updateData.url = body.url
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail
    if (body.category !== undefined) updateData.category = body.category
    if (body.type !== undefined) updateData.type = body.type || 'video'
    if (body.ageGroup !== undefined) updateData.ageGroup = body.ageGroup
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty || 'easy'
    if (body.duration !== undefined) updateData.duration = body.duration || 0
    if (body.order !== undefined) updateData.order = body.order
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const video = await prisma.adminVideo.update({
      where: { id },
      data: updateData
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
