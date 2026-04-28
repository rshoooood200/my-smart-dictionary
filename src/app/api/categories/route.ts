import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب جميع التصنيفات لمستخدم معين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    const categories = await db.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { words: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - إضافة تصنيف جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameAr, color, icon, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود التصنيف مسبقاً لنفس المستخدم
    const existingCategory = await db.category.findFirst({
      where: { 
        name: name.toLowerCase().trim(),
        userId 
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'هذا التصنيف موجود مسبقاً!' },
        { status: 400 }
      );
    }

    const newCategory = await db.category.create({
      data: {
        name: name.toLowerCase().trim(),
        nameAr: nameAr?.trim() || null,
        color: color || '#10B981',
        icon: icon || null,
        userId,
      },
    });

    return NextResponse.json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
