import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// تحديث فئة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // بناء كائن البيانات للتحديث - فقط تحديث الحقول المرسلة
    const data: Record<string, unknown> = {}
    
    if (body.name !== undefined) data.name = body.name
    if (body.nameAr !== undefined) data.nameAr = body.nameAr
    if (body.description !== undefined) data.description = body.description
    if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr
    if (body.icon !== undefined) data.icon = body.icon
    if (body.color !== undefined) data.color = body.color
    if (body.type !== undefined) data.type = body.type
    if (body.order !== undefined) data.order = body.order
    if (body.isActive !== undefined) data.isActive = body.isActive

    const category = await prisma.adminCategory.update({
      where: { id },
      data
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating admin category:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث الفئة' }, { status: 500 })
  }
}

// حذف فئة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if category exists first
    const existing = await prisma.adminCategory.findUnique({
      where: { id }
    })
    
    if (!existing) {
      // Category doesn't exist, consider it as already deleted
      return NextResponse.json({ success: true, message: 'الفئة غير موجودة' })
    }
    
    await prisma.adminCategory.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin category:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الفئة' }, { status: 500 })
  }
}
