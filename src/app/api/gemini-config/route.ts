import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callGemini } from '@/lib/gemini';

// GET - التحقق من وجود مفتاح Gemini
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

    // البحث عن إعدادات Gemini للمستخدم
    const config = await db.geminiConfig.findUnique({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      hasKey: !!config?.apiKey,
      keyPreview: config?.apiKey ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}` : null
    });
  } catch (error) {
    console.error('Error checking Gemini config:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في التحقق من الإعدادات' },
      { status: 500 }
    );
  }
}

// POST - حفظ مفتاح Gemini
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, apiKey } = body;

    console.log('Saving Gemini config:', { userId, keyPrefix: apiKey?.slice(0, 6) });

    if (!userId || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'userId و apiKey مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من صيغة المفتاح (يبدأ بـ AIza)
    if (!apiKey.startsWith('AIza')) {
      return NextResponse.json(
        { success: false, error: 'صيغة المفتاح غير صحيحة. مفاتيح Gemini تبدأ بـ "AIza"' },
        { status: 400 }
      );
    }

    // حفظ أو تحديث المفتاح
    const config = await db.geminiConfig.upsert({
      where: { userId },
      create: {
        userId,
        apiKey
      },
      update: {
        apiKey
      }
    });

    console.log('Gemini config saved successfully');

    return NextResponse.json({
      success: true,
      message: 'تم حفظ المفتاح بنجاح',
      keyPreview: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    });
  } catch (error) {
    console.error('Error saving Gemini config:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حفظ المفتاح' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مفتاح Gemini
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    await db.geminiConfig.delete({
      where: { userId }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'تم حذف المفتاح بنجاح'
    });
  } catch (error) {
    console.error('Error deleting Gemini config:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المفتاح' },
      { status: 500 }
    );
  }
}

// التحقق من صحة مفتاح Gemini
async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await callGemini(
      apiKey,
      'Say "OK" if you can read this.',
      'You are a validator. Just respond with OK.'
    );
    return response.length > 0;
  } catch {
    return false;
  }
}
