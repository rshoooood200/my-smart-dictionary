import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

// Force recompile
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
      },
    });

    // Create default categories for the user
    await db.category.createMany({
      data: [
        { name: 'General', nameAr: 'عام', color: '#10B981', icon: '📚', userId: user.id },
        { name: 'Verbs', nameAr: 'أفعال', color: '#3B82F6', icon: '🏃', userId: user.id },
        { name: 'Adjectives', nameAr: 'صفات', color: '#F59E0B', icon: '✨', userId: user.id },
        { name: 'Academic', nameAr: 'أكاديمي', color: '#8B5CF6', icon: '🎓', userId: user.id },
      ],
    });

    // Return user without password
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      },
    });

    // Set session cookie
    response.cookies.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}
