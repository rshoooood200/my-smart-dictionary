import { NextRequest, NextResponse } from 'next/server'

// GET - جلب جميع السمات
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// POST - إنشاء سمة جديدة
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}
