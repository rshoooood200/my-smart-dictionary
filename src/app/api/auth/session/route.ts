import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const cookieValue = request.cookies.get('session')?.value;
    const userId = await getUserIdFromSession(cookieValue);

    if (!userId) {
      return NextResponse.json({ success: false, user: null });
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
      return NextResponse.json({ success: false, user: null });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        achievements: JSON.parse(user.achievements || '[]'),
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    // Don't return error details that might cause client-side logout
    // Return a neutral response
    return NextResponse.json({ success: false, user: null });
  }
}
