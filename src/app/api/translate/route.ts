import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang = 'ar' } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'النص مطلوب' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a professional translator. Translate the given text accurately and naturally.

Rules:
1. If targetLang is 'ar', translate from English to Arabic
2. If targetLang is 'en', translate from Arabic to English
3. Return ONLY the translation, no explanations
4. Keep the same tone and style as the original
5. Handle idioms and expressions appropriately`;

    const prompt = `Translate this text to ${targetLang === 'ar' ? 'Arabic' : 'English'}:

"${text}"

Return ONLY the translation:`;

    const translation = await callGemini(prompt, systemPrompt);

    if (!translation) {
      throw new Error('No translation received');
    }

    return NextResponse.json({
      success: true,
      translation: translation.trim()
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الترجمة' },
      { status: 500 }
    );
  }
}
