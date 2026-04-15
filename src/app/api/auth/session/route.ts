import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ success: false, user: null });
    }

    const user = await db.user.findUnique({
      where: { id: sessionId },
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
    return NextResponse.json({ success: false, user: null });
  }
}
