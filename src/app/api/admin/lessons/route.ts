import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// جلب جميع الدروس الإدارية
export async function GET() {
  try {
    const lessons = await prisma.adminLesson.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })

    // استخراج بيانات PDF من الحقول الموجودة
    const lessonsWithPdf = lessons.map(lesson => {
      const lessonData: any = { ...lesson }
      if (lesson.content?.startsWith('[PDF]')) {
        lessonData.pdfUrl = lesson.content.replace('[PDF]', '')
        lessonData.pdfTitle = lesson.description
        lessonData.pdfTitleAr = lesson.descriptionAr
        lessonData.isPdfLesson = true
      } else {
        lessonData.isPdfLesson = false
      }
      return lessonData
    })

    return NextResponse.json(lessonsWithPdf)
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
      // PDF fields - نخزنها في حقول موجودة
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

    // تخزين بيانات PDF في حقول موجودة:
    // - content: نستخدمه للمحتوى العادي أو نضع رابط PDF
    // - description: نستخدمه لعنوان الكتاب
    // - contentAr: نستخدمه لعنوان الكتاب بالعربية
    const lessonData: any = {
      title,
      titleAr,
      description: isPdfLesson ? pdfTitle : (description || null),
      descriptionAr: isPdfLesson ? pdfTitleAr : (descriptionAr || null),
      content: isPdfLesson ? `[PDF]${pdfUrl}` : (content || ''),
      contentAr: contentAr || null,
      category,
      level: level || 'beginner',
      order: order || 0,
      duration: duration || 15,
      isActive: isActive ?? true
    }

    const lesson = await prisma.adminLesson.create({
      data: lessonData
    })

    console.log('Lesson created successfully:', lesson.id)

    // نرجع البيانات بالشكل المتوقع
    return NextResponse.json({
      ...lesson,
      // نضيف حقول PDF للرد
      pdfUrl: isPdfLesson ? pdfUrl : null,
      pdfTitle: isPdfLesson ? pdfTitle : null,
      pdfTitleAr: isPdfLesson ? pdfTitleAr : null,
      isPdfLesson: isPdfLesson || false
    })
  } catch (error) {
    console.error('Error creating admin lesson:', error)
    return NextResponse.json({
      error: 'حدث خطأ في إنشاء الدرس',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
