import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// API لتحديث قاعدة البيانات بإضافة أعمدة PDF
// يمكن استدعاؤه مرة واحدة فقط: /api/admin/update-schema?key=founderandmanager
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    // التحقق من المفتاح
    if (key !== 'founderandmanager') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    console.log('Starting database schema update...')

    // إضافة أعمدة PDF إلى جدول AdminLesson باستخدام SQL خام
    const queries = [
      `ALTER TABLE "AdminLesson" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT`,
      `ALTER TABLE "AdminLesson" ADD COLUMN IF NOT EXISTS "pdfTitle" TEXT`,
      `ALTER TABLE "AdminLesson" ADD COLUMN IF NOT EXISTS "pdfTitleAr" TEXT`,
      `ALTER TABLE "AdminLesson" ADD COLUMN IF NOT EXISTS "pdfPages" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "AdminLesson" ADD COLUMN IF NOT EXISTS "isPdfLesson" BOOLEAN NOT NULL DEFAULT false`,
    ]

    const results = []

    for (const query of queries) {
      try {
        await prisma.$executeRawUnsafe(query)
        results.push({ query, success: true })
        console.log('Success:', query)
      } catch (error: any) {
        // إذا العمود موجود مسبقاً، نعتبره نجاح
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          results.push({ query, success: true, note: 'Column already exists' })
        } else {
          results.push({ query, success: false, error: error.message })
          console.error('Error:', query, error.message)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث قاعدة البيانات',
      results
    })
  } catch (error) {
    console.error('Schema update error:', error)
    return NextResponse.json({
      error: 'حدث خطأ في تحديث قاعدة البيانات',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
