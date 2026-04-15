import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/ai';
import { db } from '@/lib/db';

// POST - توليد جمل لكلمة معينة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wordId, word, translation, count = 5 } = body;

    if (!word || !translation) {
      return NextResponse.json(
        { success: false, error: 'الكلمة والترجمة مطلوبان' },
        { status: 400 }
      );
    }

    const systemPrompt = `أنت مدرس لغة إنجليزية محترف. مهمتك إنشاء جمل تعليمية واضحة ومفيدة للمتعلمين العرب.

قواعد إنشاء الجمل:
1. الجمل يجب أن تكون بسيطة وواضحة للمتعلمين
2. استخدم الكلمة في سياقات مختلفة (رسمية، غير رسمية، يومية)
3. الجمل يجب أن تكون عملية ومفيدة في الحياة اليومية
4. يجب أن تترجم كل جملة للعربية بشكل دقيق
5. أرجع JSON فقط`;

    const prompt = `أنشئ ${count} جمل مختلفة باستخدام الكلمة "${word}" التي تعني "${translation}".

كل جملة يجب أن تكون في سياق مختلف لتوضيح معنى الكلمة.

أرجع النتيجة بهذا الشكل:
{
  "sentences": [
    {"sentence": "English sentence in everyday context", "translation": "الترجمة العربية"},
    {"sentence": "Formal context sentence", "translation": "الترجمة العربية"},
    {"sentence": "Informal context sentence", "translation": "الترجمة العربية"},
    {"sentence": "Common phrase with this word", "translation": "الترجمة العربية"},
    {"sentence": "Professional context sentence", "translation": "الترجمة العربية"}
  ]
}`;

    const result = await callGeminiJSON<{ sentences: { sentence: string; translation: string }[] }>(prompt, systemPrompt);

    const sentences = result.sentences;

    // إذا كان هناك wordId، احفظ الجمل في قاعدة البيانات
    if (wordId && sentences) {
      await db.sentence.createMany({
        data: sentences.map((s) => ({
          sentence: s.sentence,
          translation: s.translation,
          wordId: wordId,
          isAiGenerated: true,
        })),
      });

      // استرجع الكلمة مع الجمل الجديدة
      const updatedWord = await db.word.findUnique({
        where: { id: wordId },
        include: { sentences: true },
      });

      return NextResponse.json({
        success: true,
        data: updatedWord?.sentences || sentences
      });
    }

    return NextResponse.json({ success: true, data: sentences });
  } catch (error) {
    console.error('Error generating sentences:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في توليد الجمل' },
      { status: 500 }
    );
  }
}
