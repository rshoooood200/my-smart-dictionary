import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب مستخدم واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await db.user.findUnique({
      where: { id },
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

// DELETE - حذف مستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // حذف المستخدم (سيتم حذف جميع البيانات المرتبطة تلقائياً بسبب onDelete: Cascade)
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف المستخدم بنجاح' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// PUT - تحديث مستخدم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, avatar, xp, level, currentStreak, longestStreak, achievements } = body;

    const user = await db.user.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(avatar !== undefined && { avatar }),
        ...(xp !== undefined && { xp }),
        ...(level !== undefined && { level }),
        ...(currentStreak !== undefined && { currentStreak }),
        ...(longestStreak !== undefined && { longestStreak }),
        ...(achievements !== undefined && { achievements: JSON.stringify(achievements) }),
        lastActiveDate: new Date(),
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
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
