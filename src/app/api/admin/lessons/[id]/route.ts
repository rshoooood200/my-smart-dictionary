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
    const {
      title, titleAr, description, descriptionAr, content, contentAr,
      category, level, order, duration, isActive,
      // PDF fields - نخزنها في حقول موجودة
      pdfUrl, pdfTitle, pdfTitleAr, pdfPages, isPdfLesson
    } = body

    // Build update data object with only provided fields
    const updateData: Record<string, any> = {}

    if (title !== undefined) updateData.title = title
    if (titleAr !== undefined) updateData.titleAr = titleAr
    if (category !== undefined) updateData.category = category
    if (level !== undefined) updateData.level = level
    if (order !== undefined) updateData.order = order
    if (duration !== undefined) updateData.duration = duration
    if (isActive !== undefined) updateData.isActive = isActive

    // تخزين بيانات PDF في حقول موجودة
    if (isPdfLesson) {
      if (pdfUrl !== undefined) updateData.content = `[PDF]${pdfUrl}`
      if (pdfTitle !== undefined) updateData.description = pdfTitle
      if (pdfTitleAr !== undefined) updateData.descriptionAr = pdfTitleAr
    } else {
      if (content !== undefined) updateData.content = content
      if (description !== undefined) updateData.description = description
      if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr
      if (contentAr !== undefined) updateData.contentAr = contentAr
    }

    const lesson = await prisma.adminLesson.update({
      where: { id },
      data: updateData
    })

    // استخراج بيانات PDF من الحقول
    const lessonResponse: any = { ...lesson }
    if (lesson.content?.startsWith('[PDF]')) {
      lessonResponse.pdfUrl = lesson.content.replace('[PDF]', '')
      lessonResponse.pdfTitle = lesson.description
      lessonResponse.pdfTitleAr = lesson.descriptionAr
      lessonResponse.isPdfLesson = true
    } else {
      lessonResponse.isPdfLesson = false
    }

    return NextResponse.json(lessonResponse)
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
