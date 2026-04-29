import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/ai';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, userId } = body;

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ success: false, error: 'Word is required' }, { status: 400 });
    }

    const wordText = word.toLowerCase().trim();

    let userApiKey: string | undefined;
    if (userId) {
      try {
        const config = await db.geminiConfig.findUnique({ where: { userId } });
        if (config?.apiKey) {
          userApiKey = config.apiKey;
        }
      } catch (dbError) {
        console.log('[Mind-Map] Could not fetch user API key');
      }
    }

    const prompt = `You are a professional English-Arabic dictionary AI.
Generate a mind map for the English word: "${wordText}".

Return ONLY a valid JSON object. No markdown, no extra text.
{
  "center_word": "${wordText}",
  "branches": [
    {
      "category_name": "Synonyms",
      "arabic_category": "المرادفات",
      "words": ["syn1", "syn2", "syn3"]
    },
    {
      "category_name": "Antonyms",
      "arabic_category": "الأضداد",
      "words": ["ant1", "ant2"]
    },
    {
      "category_name": "Related Verbs",
      "arabic_category": "أفعال مرتبطة",
      "words": ["verb1", "verb2"]
    },
    {
      "category_name": "Contexts",
      "arabic_category": "سياقات الاستخدام",
      "words": ["context1", "context2"]
    },
    {
      "category_name": "Derived Forms",
      "arabic_category": "مشتقات الكلمة",
      "words": ["form1", "form2"]
    }
  ]
}

STRICT RULES:
1. Provide 4 to 6 branches maximum.
2. Each branch must have 2 to 4 related words.
3. The "words" arrays must contain English words only.
4. Output ONLY raw valid JSON.

Word: "${wordText}"`;

    const mapData = await callGeminiJSON<any>(prompt, undefined, userApiKey);

    if (!mapData || !mapData.branches) {
      return NextResponse.json({ success: false, error: 'Failed to generate mind map from AI' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapData });

  } catch (error: any) {
    console.error('Error generating mind map:', error);
    
    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      return NextResponse.json(
        { success: false, error: 'ميزة الذكاء الاصطناعي غير مفعّلة. يرجى إضافة مفتاح API في الإعدادات.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في توليد الخريطة الذهنية' },
      { status: 500 }
    );
  }
}
