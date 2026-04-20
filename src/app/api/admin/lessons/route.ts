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
    console.log('Received lesson data:', JSON.stringify(body, null, 2))

    const {
      title, titleAr, description, descriptionAr, content, contentAr,
      category, level, order, duration, isActive,
      // PDF fields
      pdfUrl, pdfTitle, pdfTitleAr, pdfPages, isPdfLesson
    } = body

    console.log('Extracted fields:', {
      title: !!title,
      titleAr: !!titleAr,
      category: !!category,
      content: !!content,
      isPdfLesson,
      pdfUrl: !!pdfUrl
    })

    if (!title || !titleAr || !category) {
      console.log('Validation failed: missing required fields')
      return NextResponse.json({
        error: 'يرجى ملء جميع الحقول المطلوبة',
        details: { title: !!title, titleAr: !!titleAr, category: !!category }
      }, { status: 400 })
    }

    // إذا لم يكن درس PDF، يجب أن يكون هناك محتوى
    if (!isPdfLesson && !content) {
      console.log('Validation failed: no content or PDF')
      return NextResponse.json({
        error: 'يرجى إضافة محتوى الدرس أو رفع ملف PDF',
        details: { isPdfLesson, hasContent: !!content }
      }, { status: 400 })
    }

    console.log('Creating lesson in database...')

    const lesson = await prisma.adminLesson.create({
      data: {
        title,
        titleAr,
        description: description || null,
        descriptionAr: descriptionAr || null,
        content: content || '',
        contentAr: contentAr || null,
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

    console.log('Lesson created successfully:', lesson.id)

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error creating admin lesson:', error)
    return NextResponse.json({
      error: 'حدث خطأ في إنشاء الدرس',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
