import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/ai'

// POST - Generate Smart Tests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      weakWords, 
      testType, 
      difficulty,
      count,
      category
    } = body

    let prompt = ''

    switch (testType) {
      case 'vocabulary':
        prompt = generateVocabularyTestPrompt(weakWords, difficulty, count, category)
        break
      case 'grammar':
        prompt = generateGrammarTestPrompt(difficulty, count)
        break
      case 'listening':
        prompt = generateListeningTestPrompt(weakWords, count)
        break
      case 'writing':
        prompt = generateWritingTestPrompt(weakWords, difficulty)
        break
      case 'conversation':
        prompt = generateConversationTestPrompt(difficulty)
        break
      default:
        prompt = generateVocabularyTestPrompt(weakWords, difficulty, count, category)
    }

    const systemPrompt = `أنت معلم لغة إنجليزية متخصص في إنشاء اختبارات تعليمية.
يجب أن تُرجع الاستجابة بتنسيق JSON فقط بدون أي نص إضافي.
كل اختبار يجب أن يكون تعليمياً ومناسباً للمستوى المحدد.`

    const testData = await callGeminiJSON(prompt, systemPrompt)

    return NextResponse.json({ 
      test: testData,
      testType,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI Tests error:', error)
    return NextResponse.json({ 
      test: generateFallbackTest('vocabulary', [], 5),
      fallback: true
    })
  }
}

function generateVocabularyTestPrompt(weakWords: string[], difficulty: string, count: number, category: string | null): string {
  return `أنشئ اختبار مفردات بالمواصفات التالية:
- الكلمات المستهدفة: ${weakWords?.slice(0, 10).join(', ') || 'كلمات عامة'}
- المستوى: ${difficulty || 'beginner'}
- عدد الأسئلة: ${count || 5}
- التصنيف: ${category || 'عام'}

أرجع JSON بهذا التنسيق:
{
  "title": "عنوان الاختبار",
  "titleAr": "عنوان الاختبار بالعربية",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "السؤال بالإنجليزية",
      "questionAr": "السؤال بالعربية",
      "word": "الكلمة المستهدفة",
      "options": ["خيار1", "خيار2", "خيار3", "خيار4"],
      "correctAnswer": 0,
      "explanation": "شرح الإجابة الصحيحة"
    }
  ]
}`
}

function generateGrammarTestPrompt(difficulty: string, count: number): string {
  return `أنشئ اختبار قواعد نحوية بالمواصفات التالية:
- المستوى: ${difficulty || 'beginner'}
- عدد الأسئلة: ${count || 5}

أرجع JSON بهذا التنسيق:
{
  "title": "Grammar Test",
  "titleAr": "اختبار القواعد",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "type": "fill_blank",
      "question": "جملة مع فراغ _____ للمستخدم",
      "questionAr": "ترجمة الجملة",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "الإجابة الصحيحة",
      "rule": "القاعدة النحوية",
      "explanation": "شرح القاعدة"
    }
  ]
}`
}

function generateListeningTestPrompt(weakWords: string[], count: number): string {
  return `أنشئ اختبار استماع بالمواصفات التالية:
- الكلمات المستهدفة: ${weakWords?.slice(0, 5).join(', ') || 'كلمات عامة'}
- عدد الأسئلة: ${count || 3}

أرجع JSON بهذا التنسيق:
{
  "title": "Listening Test",
  "titleAr": "اختبار الاستماع",
  "questions": [
    {
      "id": 1,
      "type": "listening",
      "textToSpeak": "النص الذي سيُنطق",
      "question": "سؤال عن النص",
      "questionAr": "السؤال بالعربية",
      "options": ["خيار1", "خيار2", "خيار3", "خيار4"],
      "correctAnswer": 0
    }
  ]
}`
}

function generateWritingTestPrompt(weakWords: string[], difficulty: string): string {
  return `أنشئ اختبار كتابة بالمواصفات التالية:
- الكلمات المطلوب استخدامها: ${weakWords?.slice(0, 5).join(', ') || 'كلمات عامة'}
- المستوى: ${difficulty || 'beginner'}

أرجع JSON بهذا التنسيق:
{
  "title": "Writing Test",
  "titleAr": "اختبار الكتابة",
  "tasks": [
    {
      "id": 1,
      "type": "sentence",
      "instruction": "اكتب جملة باستخدام الكلمات التالية",
      "instructionAr": "تعليمات بالعربية",
      "requiredWords": ["word1", "word2"],
      "minLength": 5,
      "rubric": "معايير التصحيح"
    }
  ]
}`
}

function generateConversationTestPrompt(difficulty: string): string {
  return `أنشئ سيناريو محادثة للممارسة:
- المستوى: ${difficulty || 'beginner'}

أرجع JSON بهذا التنسيق:
{
  "title": "Conversation Practice",
  "titleAr": "تدريب المحادثة",
  "scenario": {
    "setting": "المكان/السياق",
    "settingAr": "السياق بالعربية",
    "role": "دور المستخدم",
    "roleAr": "الدور بالعربية",
    "starterPrompt": "جملة البداية",
    "objectives": ["هدف1", "هدف2"],
    "vocabulary": ["كلمة1", "كلمة2"],
    "phrases": ["عبارة1", "عبارة2"]
  }
}`
}

function generateFallbackTest(testType: string, weakWords: string[], count: number): Record<string, unknown> {
  const defaultWords = ['book', 'read', 'write', 'learn', 'study', 'practice', 'improve', 'understand']
  const words = weakWords?.length > 0 ? weakWords : defaultWords

  return {
    title: 'Vocabulary Quiz',
    titleAr: 'اختبار المفردات',
    difficulty: 'beginner',
    questions: words.slice(0, count || 5).map((word, index) => ({
      id: index + 1,
      type: 'multiple_choice',
      question: `What is the Arabic meaning of "${word}"?`,
      questionAr: `ما معنى كلمة "${word}" بالعربية؟`,
      word,
      options: ['معنى 1', 'معنى 2', 'معنى 3', 'معنى 4'],
      correctAnswer: 0,
      explanation: `${word} تعني ...`
    }))
  }
}
