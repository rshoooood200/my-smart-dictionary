import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// جلب جميع الملاحظات الإدارية
export async function GET() {
  try {
    const notes = await prisma.adminNote.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    })
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching admin notes:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الملاحظات' }, { status: 500 })
  }
}

// إضافة ملاحظة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, titleAr, content, contentAr, category, color, isPinned } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    const note = await prisma.adminNote.create({
      data: {
        title,
        titleAr,
        content,
        contentAr,
        category,
        color: color || '#10B981',
        isPinned: isPinned || false
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating admin note:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الملاحظة' }, { status: 500 })
  }
}
