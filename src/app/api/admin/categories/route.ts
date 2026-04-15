import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// جلب جميع الفئات الإدارية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    // بناء شرط البحث
    const where: { type?: string } = {}
    if (type) where.type = type

    // Always fetch all categories to know which ones are deleted
    const categories = await prisma.adminCategory.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })
    
    // Filter in response if needed
    const result = includeInactive ? categories : categories.filter(c => c.isActive !== false)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching admin categories:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الفئات' }, { status: 500 })
  }
}

// إضافة فئة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, nameAr, description, descriptionAr, icon, color, type, order, isActive } = body

    if (!name || !nameAr) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    // إذا كان هناك id محدد، تحقق من وجوده أولاً
    if (id) {
      const existing = await prisma.adminCategory.findUnique({
        where: { id }
      })
      
      if (existing) {
        // تحديث الفئة الموجودة
        const updated = await prisma.adminCategory.update({
          where: { id },
          data: {
            name,
            nameAr,
            description,
            descriptionAr,
            icon,
            color,
            type: type || 'general',
            order: order || 0,
            isActive: isActive ?? true
          }
        })
        return NextResponse.json(updated)
      }
      
      // إنشاء فئة جديدة بالـ id المحدد
      const category = await prisma.adminCategory.create({
        data: {
          id,  // استخدام الـ id المحدد
          name,
          nameAr,
          description,
          descriptionAr,
          icon,
          color,
          type: type || 'general',
          order: order || 0,
          isActive: isActive ?? true
        }
      })
      return NextResponse.json(category)
    }

    // إنشاء فئة جديدة بدون id محدد
    const category = await prisma.adminCategory.create({
      data: {
        name,
        nameAr,
        description,
        descriptionAr,
        icon,
        color,
        type: type || 'general',
        order: order || 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating admin category:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الفئة' }, { status: 500 })
  }
}
