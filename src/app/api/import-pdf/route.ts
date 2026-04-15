import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { execSync } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // تحويل الملف إلى buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // حفظ مؤقت للملف
    const tempPath = `/tmp/import-${Date.now()}.pdf`
    fs.writeFileSync(tempPath, buffer)

    try {
      // استخراج النص من PDF
      const text = await extractTextFromPDF(tempPath)
      
      // تحليل النص لاستخراج الكلمات
      const words = parseVocabularyText(text)

      return NextResponse.json({ words })
    } finally {
      // حذف الملف المؤقت
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
    }
  } catch (error) {
    console.error('PDF import error:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}

// استخراج النص من PDF باستخدام Python
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  const script = `
import pdfplumber
import sys

with pdfplumber.open('${pdfPath}') as pdf:
    text = ''
    for page in pdf.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + '\\n'
    print(text)
`
  
  try {
    const result = execSync(`python3 -c "${script.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    })
    return result
  } catch (error) {
    console.error('PDF extraction error:', error)
    return ''
  }
}

// تحليل النص لاستخراج الكلمات
function parseVocabularyText(text: string): unknown[] {
  const words: unknown[] = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    // محاولة استخراج كلمة وترجمتها
    // أنماط مختلفة للتعرف على تنسيقات القواميس
    
    // نمط: word - translation
    let match = line.match(/^([a-zA-Z\s]+)\s*[-–:]\s*(.+)$/)
    if (match) {
      words.push(createWord(match[1].trim(), match[2].trim()))
      continue
    }
    
    // نمط: number. word translation
    match = line.match(/^\d+\.?\s*([a-zA-Z\s]+)\s+(.+)$/)
    if (match) {
      const word = match[1].trim()
      const rest = match[2].trim()
      // البحث عن الترجمة العربية
      const arabicMatch = rest.match(/^(.+?)\s*[\u0600-\u06FF]/)
      if (arabicMatch) {
        words.push(createWord(word, rest))
        continue
      }
    }
    
    // نمط: word (translation) أو word [translation]
    match = line.match(/^([a-zA-Z\s]+)\s*[\(\[](.+?)[\)\]]/)
    if (match) {
      words.push(createWord(match[1].trim(), match[2].trim()))
      continue
    }
  }
  
  return words
}

interface ImportedWord {
  id: string
  word: string
  translation: string
  pronunciation: string
  definition: string
  partOfSpeech: string
  level: string
  isLearned: boolean
  isFavorite: boolean
  reviewCount: number
  correctCount: number
  categoryId: string
  sentences: unknown[]
  createdAt: Date
  updatedAt: Date
}

function createWord(word: string, translation: string): ImportedWord {
  return {
    id: `pdf-import-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    word: word,
    translation: translation,
    pronunciation: '',
    definition: '',
    partOfSpeech: 'noun',
    level: guessLevel(word),
    isLearned: false,
    isFavorite: false,
    reviewCount: 0,
    correctCount: 0,
    categoryId: '',
    sentences: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function guessLevel(word: string): string {
  // تقدير مستوى الكلمة بناءً على طولها وتعقيدها
  if (word.length <= 4) return 'beginner'
  if (word.length <= 7) return 'intermediate'
  return 'advanced'
}
