'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface SpellCheckResult {
  valid: boolean
  word: string
  suggestions?: string[]
  message?: string
}

export function useSpellCheck() {
  const [spellError, setSpellError] = useState<SpellCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkWord = useCallback(async (word: string): Promise<boolean> => {
    const cleanWord = word.trim().toLowerCase()

    // Skip spell check for multi-word phrases or very short
    if (cleanWord.includes(' ') || cleanWord.length < 2) {
      setSpellError(null)
      return true
    }

    setIsChecking(true)
    try {
      const response = await fetch('/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleanWord })
      })

      if (!response.ok) {
        // If spell check fails, allow the word through
        setSpellError(null)
        return true
      }

      const data: SpellCheckResult = await response.json()

      if (data.valid) {
        setSpellError(null)
        return true
      }

      // Word is misspelled
      setSpellError(data)

      // Show toast with suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        toast.error(`خطأ إملائي! الكلمة "${cleanWord}" غير صحيحة`, {
          description: `هل كنت تقصد: ${data.suggestions.slice(0, 3).join('، ')}؟`,
          duration: 5000,
          action: {
            label: data.suggestions[0],
            onClick: () => {
              // The component should handle this
            }
          }
        })
      } else {
        toast.error(`خطأ إملائي! الكلمة "${cleanWord}" غير موجودة في القاموس`, {
          duration: 4000
        })
      }

      return false
    } catch {
      // On error, allow the word through
      setSpellError(null)
      return true
    } finally {
      setIsChecking(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setSpellError(null)
  }, [])

  return { spellError, isChecking, checkWord, clearError }
}
