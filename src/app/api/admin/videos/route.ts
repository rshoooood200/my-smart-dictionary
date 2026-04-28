import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// جلب جميع الفيديوهات الإدارية
export async function GET() {
  try {
    const videos = await prisma.adminVideo.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })
    return NextResponse.json(videos)
  } catch (error) {
    console.error('Error fetching admin videos:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الفيديوهات' }, { status: 500 })
  }
}

// إضافة فيديو جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, titleAr, description, descriptionAr, url, thumbnail, category, type, ageGroup, difficulty, duration, order, isActive } = body

    if (!title || !titleAr || !url || !category) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    const video = await prisma.adminVideo.create({
      data: {
        title,
        titleAr,
        description,
        descriptionAr,
        url,
        thumbnail,
        category,
        type: type || 'video',
        ageGroup,
        difficulty: difficulty || 'easy',
        duration: duration || 0,
        order: order || 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('Error creating admin video:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الفيديو' }, { status: 500 })
  }
}
