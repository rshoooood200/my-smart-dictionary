import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/ai';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    let userApiKey: string | undefined;
    if (userId) {
      try {
        const config = await db.geminiConfig.findUnique({ where: { userId } });
        if (config?.apiKey) userApiKey = config.apiKey;
      } catch (e) { console.log(e) }
    }

    const prompt = `You are an expert English teacher for Arabic speakers.
Generate a list of 5 common mistakes Arabic speakers make when learning English.
For each mistake, provide:
1. "incorrect": The incorrect usage or confused word.
2. "correct": The correct usage or word.
3. "explanation": A brief explanation in Arabic of why it's wrong and the difference.
4. "example_incorrect": A short sentence showing the wrong usage.
5. "example_correct": A short sentence showing the correct usage.
6. "quiz_question": A fill-in-the-blank question to test the user.
7. "quiz_answer": The correct word for the blank.

Return ONLY valid JSON array. No markdown.
[
  {
    "incorrect": "Do a mistake",
    "correct": "Make a mistake",
    "explanation": "في الإنجليزية نستخدم Make مع Mistake وليس Do، لأن Mistake تعتبر شيئاً يتم صنعه/تكوينه وليس أداءً.",
    "example_incorrect": "I did a mistake.",
    "example_correct": "I made a mistake.",
    "quiz_question": "She _____ a mistake on the test. (Did / Made)",
    "quiz_answer": "Made"
  }
]`;

    const data = await callGeminiJSON<any>(prompt, undefined, userApiKey);

    if (!data) return NextResponse.json({ success: false, error: 'Failed to generate' }, { status: 500 });
    return NextResponse.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
