import { NextRequest, NextResponse } from 'next/server'

// GET - جلب إعدادات إمكانية الوصول واللغة
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// POST - إنشاء إعدادات جديدة
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// PUT - تحديث الإعدادات
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// DELETE - إعادة تعيين الإعدادات
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}
