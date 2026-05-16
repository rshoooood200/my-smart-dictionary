import { NextRequest, NextResponse } from 'next/server'

// GET - Get class or list classes
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// POST - Create class
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// PUT - Update class
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// DELETE - Delete class (soft delete)
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}
