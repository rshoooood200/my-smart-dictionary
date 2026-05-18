import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromSession } from '@/lib/session';

// ضمان عدم التخزين المؤقت لهذا الـ endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const cookieValue = request.cookies.get('session')?.value;
    const userId = await getUserIdFromSession(cookieValue);

    if (!userId) {
      return NextResponse.json(
        { success: false, user: null, reason: 'no_cookie' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        achievements: true,
      },
    });

    if (!user) {
      // الجلسة غير صالحة - المستخدم غير موجود
      const response = NextResponse.json(
        { success: false, user: null, reason: 'invalid_session' },
        { status: 401 }
      );
      // مسح الكوكي غير الصالح
      response.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    // تحديث آخر نشاط للمستخدم (بشكل غير محجوب)
    db.user.update({
      where: { id: user.id },
      data: { lastActiveDate: new Date() },
    }).catch(() => {}); // تجاهل الأخطاء هنا

    const response = NextResponse.json({
      success: true,
      user: {
        ...user,
        achievements: JSON.parse(user.achievements || '[]'),
      },
    });

    // تجديد صلاحية الكوكي عند كل فحص ناجح
    // هذا يضمن أن الجلسة لا تنتهي ما دام المستخدم يستخدم التطبيق
    if (cookieValue) {
      response.cookies.set('session', cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 يوم من آخر نشاط
        path: '/',
      });
    }

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('[Auth] Session check error:', error);

    // خطأ في قاعدة البيانات - نعيد حالة خطأ مميزة
    // لا نعيد 401 لأن الجلسة قد تكون صالحة ولكن هناك مشكلة مؤقتة
    const response = NextResponse.json(
      { success: false, user: null, reason: 'server_error' },
      { status: 503 } // Service Unavailable
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
