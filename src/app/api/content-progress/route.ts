import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's content progress
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// POST - Create or update progress
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// PUT - Update specific progress record
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}

// DELETE - Reset progress
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'هذه الميزة غير متاحة حالياً' },
    { status: 501 }
  )
}
