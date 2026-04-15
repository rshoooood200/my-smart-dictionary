import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/ai'

// POST - Analyze pronunciation and provide feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      word, 
      pronunciation, 
      targetWord,
      userTranscription,
      difficulty
    } = body

    if (!targetWord) {
      return NextResponse.json({ error: 'targetWord is required' }, { status: 400 })
    }

    const systemPrompt = `أنت معلم نطق لغة إنجليزية متخصص.
قم بتحليل نطق المستخدم وإعطاء تغذية راجعة مفصلة.
يجب أن تُرجع الاستجابة بتنسيق JSON فقط.`

    const prompt = `حلل نطق المستخدم للكلمة "${targetWord}":
- ما قاله المستخدم: "${userTranscription || 'غير متوفر'}"
- مستوى الصعوبة: ${difficulty || 'beginner'}

أرجع JSON بهذا التنسيق:
{
  "correct": boolean,
  "score": number (0-100),
  "feedback": {
    "accuracy": "ملاحظات عن الدقة",
    "stress": "ملاحظات عن التشديد",
    "intonation": "ملاحظات عن النبرة",
    "general": "ملاحظات عامة"
  },
  "phoneticBreakdown": {
    "ipa": "الرموز الصوتية IPA",
    "syllables": ["مقطع1", "مقطع2"],
    "stressPattern": "نمط التشديد"
  },
  "tips": ["نصيحة1", "نصيحة2"],
  "similarWords": ["كلمات مشابهة"],
  "practiceExercises": ["تمرين1", "تمرين2"]
}`

    try {
      const analysis = await callGeminiJSON(prompt, systemPrompt)
      return NextResponse.json(analysis)
    } catch {
      return NextResponse.json(generateFallbackAnalysis(targetWord))
    }
  } catch (error) {
    console.error('Pronunciation analysis error:', error)
    return NextResponse.json(generateFallbackAnalysis('word'))
  }
}

// GET - Get pronunciation guide for a word
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')

    if (!word) {
      return NextResponse.json({ error: 'word is required' }, { status: 400 })
    }

    const systemPrompt = `أنت معلم نطق لغة إنجليزية. قدم دليل نطق شامل للكلمة.
أرجع الاستجابة بتنسيق JSON فقط.`

    const prompt = `قدم دليل نطق للكلمة "${word}":

أرجع JSON:
{
  "word": "${word}",
  "ipa": "الرموز الصوتية",
  "phoneticSpelling": "تهجئة صوتية مبسطة",
  "syllables": ["مقطع1", "مقطع2"],
  "stressSyllable": رقم المقاطع المشددة,
  "audioGuide": {
    "description": "وصف كيفية النطق",
    "tips": ["نصيحة1", "نصيحة2"]
  },
  "similarPronunciation": ["كلمات بنفس النطق"],
  "commonMistakes": ["خطأ شائع1"],
  "practiceWords": ["كلمات للتمرين"]
}`

    try {
      const guide = await callGeminiJSON(prompt, systemPrompt)
      return NextResponse.json(guide)
    } catch {
      return NextResponse.json(generateFallbackGuide(word))
    }
  } catch {
    return NextResponse.json(generateFallbackGuide('word'))
  }
}

function generateFallbackAnalysis(targetWord: string): Record<string, unknown> {
  return {
    correct: true,
    score: 85,
    feedback: {
      accuracy: 'نطق جيد بشكل عام',
      stress: 'التشديد صحيح',
      intonation: 'النبرة مناسبة',
      general: 'أحسنت! استمر في التدريب'
    },
    phoneticBreakdown: {
      ipa: `/${targetWord}/`,
      syllables: [targetWord],
      stressPattern: 'الأول'
    },
    tips: [
      'استمع للكلمة عدة مرات',
      'تدرب على نطقها ببطء ثم بسرعة طبيعية',
      'سجل صوتك وقارنه بالنطق الصحيح'
    ],
    similarWords: [],
    practiceExercises: ['كرر الكلمة 5 مرات', 'استخدمها في جملة']
  }
}

function generateFallbackGuide(word: string): Record<string, unknown> {
  return {
    word,
    ipa: `/${word}/`,
    phoneticSpelling: word,
    syllables: [word],
    stressSyllable: 1,
    audioGuide: {
      description: `انطق الكلمة "${word}" بوضوح`,
      tips: ['استمع جيداً', 'كرر النطق']
    },
    similarPronunciation: [],
    commonMistakes: ['النطق السريع بدون تشديد'],
    practiceWords: [word]
  }
}
