import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

interface DictMeaning {
  definitions: { definition: string }[]
}

interface DictResponse {
  word: string
  meanings?: DictMeaning[]
}

interface SuggestionResponse {
  suggestions?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word } = body

    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth

    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return NextResponse.json({ error: 'word is required' }, { status: 400 })
    }

    const cleanWord = word.trim().toLowerCase()

    // Skip spell check for very short words or multi-word phrases
    if (cleanWord.length < 2 || cleanWord.includes(' ')) {
      return NextResponse.json({ valid: true, word: cleanWord })
    }

    // Check against Free Dictionary API
    const dictResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`, {
      signal: AbortSignal.timeout(8000)
    })

    if (dictResponse.ok) {
      // Word exists in dictionary - it's correctly spelled
      const data = await dictResponse.json() as DictResponse[]
      return NextResponse.json({
        valid: true,
        word: cleanWord,
        exists: true
      })
    }

    // Word not found - try to get suggestions
    let suggestions: string[] = []

    try {
      const suggestResponse = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&max=5`, {
        signal: AbortSignal.timeout(5000)
      })
      if (suggestResponse.ok) {
        const suggestData = await suggestResponse.json() as { word: string; score: number }[]
        suggestions = suggestData.map(s => s.word)
      }
    } catch {
      // If suggestion API fails, try simple approach
    }

    // If no suggestions from datamuse, try fuzzy matching with common patterns
    if (suggestions.length === 0) {
      // Generate basic suggestions based on common misspellings
      suggestions = generateBasicSuggestions(cleanWord)
    }

    return NextResponse.json({
      valid: false,
      word: cleanWord,
      suggestions,
      message: `الكلمة "${cleanWord}" غير موجودة في القاموس. هل كنت تقصد:`
    })

  } catch (error) {
    console.error('Spell check error:', error)
    // On error, allow the word through (don't block)
    return NextResponse.json({ valid: true, word: '', fallback: true })
  }
}

// Basic suggestion generator for common spelling mistakes
function generateBasicSuggestions(word: string): string[] {
  const suggestions: string[] = []
  const vowels = 'aeiou'

  // Try removing duplicate letters
  for (let i = 0; i < word.length - 1; i++) {
    if (word[i] === word[i + 1]) {
      suggestions.push(word.slice(0, i) + word.slice(i + 1))
    }
  }

  // Try swapping adjacent letters
  for (let i = 0; i < word.length - 1; i++) {
    suggestions.push(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2))
  }

  // Try replacing each letter with vowels
  for (let i = 0; i < word.length; i++) {
    for (const v of vowels) {
      if (word[i] !== v) {
        suggestions.push(word.slice(0, i) + v + word.slice(i + 1))
      }
    }
  }

  // Try adding a letter
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i <= word.length; i++) {
    for (const c of alphabet) {
      suggestions.push(word.slice(0, i) + c + word.slice(i))
    }
  }

  // Try removing a letter
  for (let i = 0; i < word.length; i++) {
    suggestions.push(word.slice(0, i) + word.slice(i + 1))
  }

  // Deduplicate and limit
  return [...new Set(suggestions)].slice(0, 8)
}
