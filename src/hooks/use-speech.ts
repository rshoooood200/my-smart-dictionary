'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseSpeechOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

interface UseSpeechReturn {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
  isSupported: boolean
}

// Check if speech synthesis is supported (runs once on module load)
const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const { rate = 0.9, pitch = 1, volume = 1, lang = 'en-US' } = options
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!isSpeechSupported) {
      console.warn('Speech synthesis is not supported')
      return
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    utterance.lang = lang

    // Try to find an English voice
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Google')
    ) || voices.find(voice => 
      voice.lang.startsWith('en')
    )
    
    if (englishVoice) {
      utterance.voice = englishVoice
    }

    utterance.onstart = () => isMounted.current && setIsSpeaking(true)
    utterance.onend = () => isMounted.current && setIsSpeaking(false)
    utterance.onerror = () => isMounted.current && setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [rate, pitch, volume, lang])

  const stop = useCallback(() => {
    if (isSpeechSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return { speak, stop, isSpeaking, isSupported: isSpeechSupported }
}

// Simple speak function for one-off use
export function speakWord(word: string, options: UseSpeechOptions = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  const { rate = 0.9, pitch = 1, volume = 1, lang = 'en-US' } = options

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(word)
  utterance.rate = rate
  utterance.pitch = pitch
  utterance.volume = volume
  utterance.lang = lang

  const voices = window.speechSynthesis.getVoices()
  const englishVoice = voices.find(voice => 
    voice.lang.startsWith('en') && voice.name.includes('Google')
  ) || voices.find(voice => 
    voice.lang.startsWith('en')
  )
  
  if (englishVoice) {
    utterance.voice = englishVoice
  }

  window.speechSynthesis.speak(utterance)
}
