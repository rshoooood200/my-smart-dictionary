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
        if (config?.apiKey) userApiKey = config.apiKey;
      } catch (dbError) {
        console.log('[Mind-Map] Could not fetch user API key');
      }
    }

    // تعديل: إجبار الـ AI بتوليد الخريطة حتى لو كانت الكلمة خاطئة
    const prompt = `You are a professional English dictionary AI.
Analyze the word: "${wordText}"

1. If "${wordText}" is MISSPELLED, figure out the correct spelling. Put the correct spelling in "center_word", set "is_correct" to false, and provide "suggestions". STILL GENERATE the mind map branches for the CORRECTED word.
2. If "${wordText}" is spelled CORRECTLY, set "is_correct" to true, leave suggestions empty, and generate the mind map.

Return ONLY a valid JSON object. No markdown, no extra text.
{
  "is_correct": boolean,
  "suggestions": string[],
  "center_word": string,
  "branches": [
    {
      "category_name": "Synonyms",
      "words": ["syn1", "syn2", "syn3"]
    },
    {
      "category_name": "Antonyms",
      "words": ["ant1", "ant2"]
    },
    {
      "category_name": "Related Verbs",
      "words": ["verb1", "verb2"]
    },
    {
      "category_name": "Contexts",
      "words": ["context1", "context2"]
    },
    {
      "category_name": "Derived Forms",
      "words": ["form1", "form2"]
    }
  ]
}

STRICT RULES:
1. "branches" array MUST always contain 4 to 6 objects, even if the input was misspelled (generate them for the corrected word).
2. Return ONLY valid JSON.
3. All text must be in English only. No Arabic.

Word: "${wordText}"`;

    const mapData = await callGeminiJSON<any>(prompt, undefined, userApiKey);

    if (!mapData || !mapData.branches || mapData.branches.length === 0) {
      return NextResponse.json({ success: false, error: 'Failed to generate mind map. AI returned empty data.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapData });

  } catch (error: any) {
    console.error('Error generating mind map:', error);
    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      return NextResponse.json({ success: false, error: 'AI feature is not enabled.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to generate mind map' }, { status: 500 });
  }
}
