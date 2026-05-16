import { NextRequest, NextResponse } from 'next/server'

// GET - جلب سمة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// PUT - تحديث سمة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// DELETE - حذف سمة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// PATCH - تحديث جزئي أو إجراء خاص
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}
