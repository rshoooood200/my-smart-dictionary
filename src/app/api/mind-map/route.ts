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

    const prompt = `You are a professional English dictionary AI.
First, check if the word "${wordText}" is spelled correctly in English.

If it is MISSPELLED, return ONLY this JSON structure:
{
  "is_correct": false,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "center_word": "${wordText}",
  "branches": []
}

If it is CORRECT, generate a mind map and return ONLY this JSON structure:
{
  "is_correct": true,
  "suggestions": [],
  "center_word": "${wordText}",
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
1. Return ONLY valid JSON. No markdown, no extra text.
2. All text must be in English only. No Arabic.
3. If correct, provide 4 to 6 branches with 2 to 4 words each.
4. Double check the spelling before generating branches.

Word: "${wordText}"`;

    const mapData = await callGeminiJSON<any>(prompt, undefined, userApiKey);

    if (!mapData) {
      return NextResponse.json({ success: false, error: 'Failed to generate mind map from AI' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapData });

  } catch (error: any) {
    console.error('Error generating mind map:', error);
    
    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      return NextResponse.json(
        { success: false, error: 'AI feature is not enabled. Please add an API key in settings.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate mind map' },
      { status: 500 }
    );
  }
}
