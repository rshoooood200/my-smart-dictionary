import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// تحديث تحديث
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, titleAr, content, contentAr, type, priority, isPublished, publishedAt, expiresAt } = body

    const update = await prisma.adminUpdate.update({
      where: { id },
      data: {
        title,
        titleAr,
        content,
        contentAr,
        type,
        priority,
        isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })

    return NextResponse.json(update)
  } catch (error) {
    console.error('Error updating admin update:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث التحديث' }, { status: 500 })
  }
}

// حذف تحديث
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.adminUpdate.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin update:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف التحديث' }, { status: 500 })
  }
}
