import { NextRequest, NextResponse } from 'next/server'

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = 'qwen/qwen-2-vl-7b-instruct'; // Vision model for image analysis

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  return key;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // تحويل الملف إلى base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const apiKey = getApiKey()
    
    // استخدام OpenRouter مع نموذج الرؤية
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vocabulary-app.com',
        'X-Title': 'Vocabulary Learning App',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and extract English vocabulary words with their Arabic translations.
                
Return a JSON array of objects with this format:
[{"word": "English word", "translation": "Arabic translation", "level": "beginner/intermediate/advanced"}]

Rules:
- Only include vocabulary words (not other text)
- If no clear word-translation pairs found, return empty array
- Determine level based on word difficulty
- Return ONLY the JSON array, no other text`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vision API error:', response.status, errorText)
      return NextResponse.json({ words: [] })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '[]'
    
    // استخراج JSON من الرد
    let words = []
    try {
      // البحث عن JSON array في الرد
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        words = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e)
    }

    // تنسيق الكلمات
    const formattedWords = words.map((w: any, index: number) => ({
      id: `img-import-${Date.now()}-${index}`,
      word: w.word || '',
      translation: w.translation || '',
      pronunciation: '',
      definition: '',
      partOfSpeech: 'noun',
      level: w.level || 'beginner',
      isLearned: false,
      isFavorite: false,
      reviewCount: 0,
      correctCount: 0,
      categoryId: '',
      sentences: [],
      createdAt: new Date(),
      updatedAt: new Date()
    })).filter((w: any) => w.word && w.translation)

    return NextResponse.json({ words: formattedWords })
  } catch (error) {
    console.error('Image import error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}
