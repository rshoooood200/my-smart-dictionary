import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/ai';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, userId } = body;
    if (!word) return NextResponse.json({ success: false, error: 'Word is required' }, { status: 400 });

    let userApiKey: string | undefined;
    if (userId) {
      try {
        const config = await db.geminiConfig.findUnique({ where: { userId } });
        if (config?.apiKey) userApiKey = config.apiKey;
      } catch (e) { console.log(e) }
    }

    const prompt = `You are an English Collocations expert.
For the word "${word}", provide its common collocations (words that naturally go with it).
Return ONLY valid JSON. No markdown.
{
  "center_word": "${word}",
  "branches": [
    {
      "category_name": "Verbs",
      "words": ["verb1", "verb2"]
    },
    {
      "category_name": "Adjectives",
      "words": ["adj1", "adj2"]
    },
    {
      "category_name": "Prepositions",
      "words": ["prep1", "prep2"]
    },
    {
      "category_name": "Nouns",
      "words": ["noun1", "noun2"]
    }
  ]
}

STRICT RULES:
1. Provide 2 to 4 words per category.
2. All text in English only.
3. Output ONLY raw valid JSON.

Word: "${word}"`;

    const data = await callGeminiJSON<any>(prompt, undefined, userApiKey);
    if (!data) return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
