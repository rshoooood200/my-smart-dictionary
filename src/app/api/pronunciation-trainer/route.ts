import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/ai'
import { requireAuth } from '@/lib/auth-helpers'

interface PhoneticBreakdown {
  sound: string
  description: string
  arabicDescription: string
}

interface SimilarWord {
  word: string
  difference: string
}

interface ArabicSpeakerMistake {
  mistake: string
  mistakeAr: string
  correction: string
  correctionAr: string
}

interface PronunciationResult {
  word: string
  pronunciation: {
    ipa: string
    syllables: string
    stressPattern: string
    phoneticBreakdown: PhoneticBreakdown[]
    similarWords: SimilarWord[]
    arabicSpeakerMistakes: ArabicSpeakerMistake[]
    practiceSentences: string[]
    tonguePosition: string
  }
}

// POST - AI Pronunciation Training
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word } = body

    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { success: false, error: 'الكلمة مطلوبة' },
        { status: 400 }
      )
    }

    const trimmedWord = word.trim().toLowerCase()
    if (trimmedWord.length < 1 || trimmedWord.length > 50) {
      return NextResponse.json(
        { success: false, error: 'الكلمة غير صالحة' },
        { status: 400 }
      )
    }

    const systemPrompt = `أنت خبير في علم الأصوات والنطق الإنجليزي، متخصص في مساعدة المتحدثين بالعربية على تحسين نطقهم للغة الإنجليزية.

قواعد مهمة:
1. قدم معلومات دقيقة عن النطق باستخدام الرموز الصوتية الدولية (IPA)
2. وصف موضع اللسان والشفاه بالعربي بشكل مفصل
3. ركز على الأخطاء الشائعة التي يرتكبها المتحدثون بالعربية
4. قدم كلمات مشابهة صوتياً (minimal pairs) للمقارنة
5. اجعل الجمل التدريبية بسيطة ومفيدة
6. جميع الأوصاف العربية يجب أن تكون واضحة ومفهومة`

    const prompt = `قم بتوليد بيانات تدريب نطق شاملة للكلمة الإنجليزية: "${trimmedWord}"

أعد البيانات بالصيغة التالية فقط (JSON صالح):
{
  "word": "${trimmedWord}",
  "pronunciation": {
    "ipa": "الرموز الصوتية الدولية للكلمة بين شرطتين مائلتين",
    "syllables": "تفكيك المقاطع الصوتية مفصولة بشرطات",
    "stressPattern": "وصف مكان التشديد بالعربية",
    "phoneticBreakdown": [
      {
        "sound": "الصوت IPA",
        "description": "وصف الصوت بالإنجليزية",
        "arabicDescription": "وصف الصوت بالعربي"
      }
    ],
    "similarWords": [
      {
        "word": "كلمة مشابهة صوتياً",
        "difference": "وصف الفرق بين الكلمتين بالعربي"
      }
    ],
    "arabicSpeakerMistakes": [
      {
        "mistake": "وصف الخطأ بالإنجليزية",
        "mistakeAr": "وصف الخطأ بالعربي",
        "correction": "كيفية التصحيح بالإنجليزية",
        "correctionAr": "كيفية التصحيح بالعربي"
      }
    ],
    "practiceSentences": [
      "جملة تدريبية تحتوي الكلمة"
    ],
    "tonguePosition": "وصف مفصل بالعربي لموضع اللسان والشفاه عند نطق هذه الكلمة"
  }
}

تأكد من:
- 3-5 عناصر في phoneticBreakdown لكل صوت مهم في الكلمة
- 2-4 كلمات مشابهة في similarWords
- 2-4 أخطاء شائعة في arabicSpeakerMistakes
- 3-5 جمل تدريبية في practiceSentences
- وصف دقيق لموضع اللسان في tonguePosition`

    const result = await callGeminiJSON<PronunciationResult>(prompt, systemPrompt)

    // Ensure the word in result matches input
    result.word = trimmedWord

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Pronunciation Trainer error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحليل النطق. حاول مرة أخرى.' },
      { status: 500 }
    )
  }
}
