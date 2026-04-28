import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب مستخدم واحد (يتطلب userId)
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

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { words: true, categories: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        achievements: JSON.parse(user.achievements),
        lastActiveDate: user.lastActiveDate,
        createdAt: user.createdAt,
        _count: user._count,
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'الاسم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود مستخدم بنفس الاسم
    const existingUser = await db.user.findFirst({
      where: { name: name.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'يوجد مستخدم بهذا الاسم بالفعل!' },
        { status: 400 }
      );
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        avatar: avatar || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        achievements: JSON.parse(user.achievements),
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
