import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/ai'
import { requireAuth } from '@/lib/auth-helpers'

interface GrammarExample {
  en: string
  ar: string
}

interface GrammarStructure {
  title: string
  titleAr: string
  explanation: string
  examples: GrammarExample[]
  tips: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
}

interface GrammarResponse {
  word: string
  grammarStructures: GrammarStructure[]
}

// POST - AI Grammar Explorer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word } = body

    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    if (!word || typeof word !== 'string' || !word.trim()) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال كلمة' },
        { status: 400 }
      )
    }

    const sanitizedWord = word.trim().slice(0, 100)

    const systemPrompt = `You are an expert English grammar teacher helping Arabic-speaking learners. Your task is to generate comprehensive grammar structures and rules related to a given English word.

You MUST respond with valid JSON only. No markdown, no explanation outside JSON.

The JSON must follow this exact structure:
{
  "word": "the input word",
  "grammarStructures": [
    {
      "title": "Grammar rule title in English",
      "titleAr": "عنوان القاعدة بالعربية",
      "explanation": "شرح تفصيلي بالعربية للقاعدة اللغوية - Detailed Arabic explanation of the grammar rule for the learner",
      "examples": [
        { "en": "English example sentence using the word", "ar": "الترجمة العربية للجملة" }
      ],
      "tips": ["Practical tip in English for using this grammar", "Another tip"],
      "difficulty": "beginner|intermediate|advanced",
      "category": "Tenses|Sentence Structure|Word Order|Conditionals|Passive Voice|Modal Verbs|Prepositions|Articles|Comparisons|Conjunctions|Collocations"
    }
  ]
}

Requirements:
1. Generate 4-7 grammar structures related to the word
2. Each structure must have exactly 2-3 example sentences (English with Arabic translation)
3. Each structure must have 2-3 practical tips
4. Include a mix of difficulty levels (beginner, intermediate, advanced)
5. Cover diverse grammar categories relevant to the word:
   - How the word is used in different tenses
   - Sentence structures with this word
   - Grammar rules that apply to this word
   - Common patterns and collocations
6. The "title" and "tips" fields must be in English
7. The "titleAr" and "explanation" fields must be in Arabic (for the Arabic learner)
8. The "examples" must have English sentences with Arabic translations
9. Make examples natural, practical, and commonly used
10. Ensure tips are actionable and helpful for learners
11. The word must appear naturally in every example sentence`

    const prompt = `Generate comprehensive grammar structures and rules for the English word: "${sanitizedWord}"

Include:
- How "${sanitizedWord}" is used in different tenses (present, past, future, etc.)
- Sentence structures where "${sanitizedWord}" commonly appears
- Grammar rules that specifically apply to "${sanitizedWord}"
- Common collocations and patterns with "${sanitizedWord}"
- Any special usage notes or irregularities

Remember: Return ONLY valid JSON starting with { and ending with }`

    const data = await callGeminiJSON<GrammarResponse>(prompt, systemPrompt)

    // Validate the response has the expected structure
    if (!data || !data.grammarStructures || !Array.isArray(data.grammarStructures)) {
      return NextResponse.json(
        { success: false, error: 'فشل في توليد التراكيب اللغوية' },
        { status: 500 }
      )
    }

    // Ensure the word field is set correctly
    data.word = sanitizedWord

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Grammar API error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء توليد التراكيب اللغوية' },
      { status: 500 }
    )
  }
}
