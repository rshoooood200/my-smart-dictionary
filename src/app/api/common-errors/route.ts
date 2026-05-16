import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/ai'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

interface CommonError {
  errorType: string
  errorTypeAr: string
  description: string
  wrongUsage: string
  correctUsage: string
  explanation: string
  tip: string
}

interface CommonErrorsResponse {
  word: string
  commonErrors: CommonError[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word } = body

    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { success: false, error: 'الكلمة مطلوبة' },
        { status: 400 }
      )
    }

    const wordText = word.toLowerCase().trim()

    // Check if user has a Gemini API key stored
    let userApiKey: string | undefined
    try {
      const config = await db.geminiConfig.findUnique({
        where: { userId }
      })
      if (config?.apiKey) {
        userApiKey = config.apiKey
        console.log('[Common-Errors] Using user\'s Gemini API key')
      }
    } catch {
      console.log('[Common-Errors] Could not fetch user API key, using server key')
    }

    const prompt = `Analyze the English word "${wordText}" and identify the most common mistakes that Arabic-speaking learners make when using this word.

Generate 5-8 common errors covering these categories:
- Spelling mistakes (إملائي): Common misspellings
- Grammar mistakes (نحوي): Incorrect grammar usage
- Wrong prepositions (حروف الجر): Incorrect preposition combinations
- Confusion with similar words (خلط): Mixing up with similar-looking or similar-meaning words
- Pronunciation mistakes (نطق): Common pronunciation errors

Return JSON in this exact format:
{
  "word": "${wordText}",
  "commonErrors": [
    {
      "errorType": "Spelling",
      "errorTypeAr": "إملائي",
      "description": "وصف الخطأ بالعربية",
      "wrongUsage": "Example of wrong usage in English",
      "correctUsage": "Example of correct usage in English",
      "explanation": "شرح بالعربية لماذا هذا الخطأ شائع",
      "tip": "نصيحة سريعة لتذكر الاستخدام الصحيح"
    }
  ]
}

IMPORTANT:
- Each error must have a different errorType (try to cover all 5 categories)
- errorType must be one of: "Spelling", "Grammar", "Preposition", "Confusion", "Pronunciation"
- errorTypeAr must be the Arabic equivalent: "إملائي", "نحوي", "حروف الجر", "خلط", "نطق"
- description and explanation must be in Arabic
- wrongUsage and correctUsage must be in English
- tip must be in Arabic
- Make the errors realistic and specific to Arabic learners of English
- Include at least one error from each category

Word: "${wordText}"
JSON:`

    const data = await callGeminiJSON<CommonErrorsResponse>(prompt, undefined, userApiKey)

    // Validate the response
    if (!data.commonErrors || !Array.isArray(data.commonErrors)) {
      return NextResponse.json(
        { success: false, error: 'فشل في تحليل الأخطاء الشائعة' },
        { status: 500 }
      )
    }

    const validErrorTypes = ['Spelling', 'Grammar', 'Preposition', 'Confusion', 'Pronunciation']
    const validErrorTypesAr: Record<string, string> = {
      'Spelling': 'إملائي',
      'Grammar': 'نحوي',
      'Preposition': 'حروف الجر',
      'Confusion': 'خلط',
      'Pronunciation': 'نطق',
    }

    const validatedErrors = data.commonErrors
      .filter((err): err is CommonError =>
        err &&
        typeof err.errorType === 'string' &&
        typeof err.description === 'string' &&
        typeof err.wrongUsage === 'string' &&
        typeof err.correctUsage === 'string' &&
        typeof err.explanation === 'string'
      )
      .map((err) => ({
        errorType: validErrorTypes.includes(err.errorType) ? err.errorType : 'Grammar',
        errorTypeAr: validErrorTypesAr[err.errorType] || err.errorTypeAr || 'نحوي',
        description: err.description || '',
        wrongUsage: err.wrongUsage || '',
        correctUsage: err.correctUsage || '',
        explanation: err.explanation || '',
        tip: err.tip || '',
      }))

    return NextResponse.json({
      success: true,
      data: {
        word: wordText,
        commonErrors: validatedErrors,
      }
    })
  } catch (error: any) {
    console.error('[Common-Errors] Error:', error)

    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      return NextResponse.json(
        {
          success: false,
          error: 'ميزة الذكاء الاصطناعي غير مفعّلة. يرجى إضافة مفتاح API في الإعدادات.',
          needsApiKey: true
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على الأخطاء الشائعة' },
      { status: 500 }
    )
  }
}
