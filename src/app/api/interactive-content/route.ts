import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch interactive content
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// POST - Create new interactive content
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// PUT - Update interactive content
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// DELETE - Delete interactive content
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}
