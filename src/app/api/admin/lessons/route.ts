import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// جلب جميع الدروس الإدارية
export async function GET() {
  try {
    const lessons = await prisma.adminLesson.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })
    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching admin lessons:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الدروس' }, { status: 500 })
  }
}

// إضافة درس جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title, titleAr, description, descriptionAr, content, contentAr,
      category, level, order, duration, isActive,
      // PDF fields
      pdfUrl, pdfTitle, pdfTitleAr, pdfPages, isPdfLesson
    } = body

    if (!title || !titleAr || !category) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    // إذا لم يكن درس PDF، يجب أن يكون هناك محتوى
    if (!isPdfLesson && !content) {
      return NextResponse.json({ error: 'يرجى إضافة محتوى الدرس أو رفع ملف PDF' }, { status: 400 })
    }

    const lesson = await prisma.adminLesson.create({
      data: {
        title,
        titleAr,
        description,
        descriptionAr,
        content: content || '',
        contentAr,
        category,
        level: level || 'beginner',
        order: order || 0,
        duration: duration || 15,
        isActive: isActive ?? true,
        // PDF fields
        pdfUrl: pdfUrl || null,
        pdfTitle: pdfTitle || null,
        pdfTitleAr: pdfTitleAr || null,
        pdfPages: pdfPages || 0,
        isPdfLesson: isPdfLesson || false
      }
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error creating admin lesson:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الدرس' }, { status: 500 })
  }
}
