import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// تحديث ملاحظة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, titleAr, content, contentAr, category, color, isPinned } = body

    const note = await prisma.adminNote.update({
      where: { id },
      data: {
        title,
        titleAr,
        content,
        contentAr,
        category,
        color,
        isPinned
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating admin note:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث الملاحظة' }, { status: 500 })
  }
}

// حذف ملاحظة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.adminNote.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin note:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الملاحظة' }, { status: 500 })
  }
}
