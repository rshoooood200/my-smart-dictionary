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
    const { name, nameAr, description, descriptionAr, icon, color, type, order, isActive } = body

    const category = await prisma.adminCategory.update({
      where: { id },
      data: {
        name,
        nameAr,
        description,
        descriptionAr,
        icon,
        color,
        type,
        order,
        isActive
      }
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
