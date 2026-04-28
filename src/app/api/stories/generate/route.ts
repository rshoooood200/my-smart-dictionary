import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/ai';
import { db } from '@/lib/db';

interface StoryResponse {
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  readingTime: number;
  wordCount: number;
  savedWordsUsed: string[];
  questions?: {
    question: string;
    questionAr?: string;
    options: string[];
    answer: number;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      topic,
      level = 'beginner',
      wordIds = [],
      storyLength = 'medium',
      includeQuiz = true
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    // جلب الكلمات المحفوظة للمستخدم
    let savedWords: { id: string; word: string; translation: string }[] = [];

    if (wordIds.length > 0) {
      const words = await db.word.findMany({
        where: {
          id: { in: wordIds },
          userId
        },
        select: {
          id: true,
          word: true,
          translation: true
        }
      });
      savedWords = words;
    } else {
      const words = await db.word.findMany({
        where: { userId },
        select: {
          id: true,
          word: true,
          translation: true
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      savedWords = words;
    }

    if (savedWords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد كلمات محفوظة. أضف بعض الكلمات أولاً.' },
        { status: 400 }
      );
    }

    // تحديد طول القصة
    const lengthMap: Record<string, string> = {
      short: '100-150 كلمة',
      medium: '200-300 كلمة',
      long: '400-500 كلمة'
    };

    const levelInstructions: Record<string, string> = {
      beginner: 'مفردات بسيطة وجمل قصيرة. مناسب للمبتدئين.',
      intermediate: 'مفردات متوسطة مع بعض الجمل المعقدة.',
      advanced: 'مفردات متقدمة وجمل معقدة.'
    };

    const systemPrompt = `أنت كاتب قصص إنجليزي محترف متخصص في إنشاء محتوى تعليمي للمتعلمين العرب.

القواعد:
1. أكتب قصة مشوقة ومفيدة
2. استخدم الكلمات المحددة بشكل طبيعي في القصة
3. ضع الكلمات المحددة بين **نجوم** مثل **word**
4. وفر ترجمة عربية كاملة للقصة
5. أرجع JSON فقط بدون أي نص إضافي`;

    const prompt = `أنشئ قصة إنجليزية تعليمية:

الموضوع: ${topic || 'مواقف الحياة اليومية'}
المستوى: ${level}
الطول: ${lengthMap[storyLength] || lengthMap.medium}
توجيهات المستوى: ${levelInstructions[level]}

الكلمات المطلوب استخدامها (يجب استخدامها جميعاً):
${savedWords.map(w => `- ${w.word} (${w.translation})`).join('\n')}

أرجع النتيجة بهذا الشكل:
{
  "title": "Story Title in English",
  "titleAr": "عنوان القصة بالعربية",
  "content": "The English story with **highlighted** vocabulary words. The story should be engaging and educational.",
  "contentAr": "الترجمة العربية الكاملة للقصة",
  "readingTime": 3,
  "wordCount": 250,
  "savedWordsUsed": ["word1", "word2"],
  "questions": [
    {
      "question": "Comprehension question in English",
      "questionAr": "السؤال بالعربية",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": 0
    }
  ]
}

أرجع 3-5 أسئلة فهم إذا كان includeQuiz مطلوباً.

كن مبدعاً واجعل القصة مشوقة ومفيدة!`;

    const storyData = await callGeminiJSON<StoryResponse>(prompt, systemPrompt);

    // البحث عن الكلمات المستخدمة
    const usedWords = savedWords.filter(w =>
      storyData.savedWordsUsed?.some(
        (used) => used.toLowerCase() === w.word.toLowerCase()
      )
    );

    // إنشاء القصة في قاعدة البيانات
    const story = await db.story.create({
      data: {
        title: storyData.title,
        titleAr: storyData.titleAr,
        content: storyData.content,
        contentAr: storyData.contentAr,
        level,
        readingTime: storyData.readingTime || Math.ceil(storyData.wordCount / 200),
        wordCount: storyData.wordCount || storyData.content.split(/\s+/).length,
        savedWordsCount: usedWords.length,
        isAiGenerated: true,
        userId,
        storyWords: {
          create: usedWords.map((w, index) => ({
            wordId: w.id,
            position: index
          }))
        }
      },
      include: {
        storyWords: {
          include: {
            word: true
          }
        }
      }
    });

    // إضافة الأسئلة إذا كانت موجودة
    if (includeQuiz && storyData.questions && storyData.questions.length > 0) {
      await db.storyQuestion.createMany({
        data: storyData.questions.map((q) => ({
          storyId: story.id,
          question: q.question,
          questionAr: q.questionAr,
          options: JSON.stringify(q.options),
          answer: q.answer
        }))
      });
    }

    // تحديث XP للمستخدم
    await db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: 15 },
        lastActiveDate: new Date()
      }
    });

    // جلب القصة الكاملة مع الأسئلة
    const fullStory = await db.story.findUnique({
      where: { id: story.id },
      include: {
        storyWords: {
          include: {
            word: true
          }
        },
        questions: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...fullStory,
        questions: fullStory?.questions?.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        })) || []
      }
    });

  } catch (error) {
    console.error('Error generating story:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate story' },
      { status: 500 }
    );
  }
}
