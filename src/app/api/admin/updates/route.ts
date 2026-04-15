import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// جلب جميع التحديثات الإدارية
export async function GET() {
  try {
    const updates = await prisma.adminUpdate.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    })
    return NextResponse.json(updates)
  } catch (error) {
    console.error('Error fetching admin updates:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب التحديثات' }, { status: 500 })
  }
}

// إضافة تحديث جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, titleAr, content, contentAr, type, priority, isPublished, publishedAt, expiresAt } = body

    if (!title || !titleAr || !content) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    const update = await prisma.adminUpdate.create({
      data: {
        title,
        titleAr,
        content,
        contentAr,
        type: type || 'update',
        priority: priority || 'normal',
        isPublished: isPublished ?? true,
        publishedAt: publishedAt ? new Date(publishedAt) : (isPublished ? new Date() : null),
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })

    return NextResponse.json(update)
  } catch (error) {
    console.error('Error creating admin update:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء التحديث' }, { status: 500 })
  }
}
