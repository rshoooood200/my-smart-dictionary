'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Sparkles, Clock, Heart, CheckCircle,
  ChevronLeft, ChevronRight, Volume2, VolumeX, X, Loader2,
  FileText, Trash2, Brain, Play, Pause, SkipBack, SkipForward,
  Settings, Languages, Bookmark, Edit2
} from 'lucide-react'
import { createVariationMap, generateVariations, getVariationTypeLabel } from '@/lib/word-variations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface StoryWord {
  id: string
  wordId: string
  position: number
  word: {
    id: string
    word: string
    translation: string
  }
}

interface StoryQuestion {
  id: string
  question: string
  questionAr?: string | null
  options: string[]
  answer: number
}

interface Story {
  id: string
  title: string
  titleAr?: string | null
  content: string
  contentAr?: string | null
  level: string
  readingTime: number
  wordCount: number
  savedWordsCount: number
  isAiGenerated: boolean
  isFavorite: boolean
  isRead: boolean
  storyWords: StoryWord[]
  questions?: StoryQuestion[]
  _count?: { questions: number }
  createdAt: string
}

interface Word {
  id: string
  word: string
  translation: string
  level: string
}

// Level config
const levelConfig: Record<string, { color: string; bg: string; label: string }> = {
  beginner: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'مبتدئ' },
  intermediate: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'متوسط' },
  advanced: { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'متقدم' },
}

interface StoriesSectionProps {
  currentUserId: string
  words: Word[]
}

// Speech manager class for better control
class SpeechManager {
  private utterance: SpeechSynthesisUtterance | null = null
  private words: string[] = []
  private currentWordIndex = 0
  private onWordChange: ((index: number) => void) | null = null
  private onEnd: (() => void) | null = null
  private onStart: (() => void) | null = null
  private rate = 1

  speak(text: string, options: {
    rate?: number
    onWordChange?: (index: number) => void
    onEnd?: () => void
    onStart?: () => void
    startFromWord?: number
  }) {
    this.cancel()
    
    this.words = text.split(/\s+/)
    this.currentWordIndex = options.startFromWord || 0
    this.onWordChange = options.onWordChange || null
    this.onEnd = options.onEnd || null
    this.onStart = options.onStart || null
    this.rate = options.rate || 1

    const textToSpeak = options.startFromWord 
      ? this.words.slice(options.startFromWord).join(' ')
      : text

    this.utterance = new SpeechSynthesisUtterance(textToSpeak)
    this.utterance.lang = 'en-US'
    this.utterance.rate = this.rate

    this.utterance.onstart = () => {
      if (this.onStart) this.onStart()
    }

    this.utterance.onend = () => {
      this.currentWordIndex = this.words.length
      if (this.onWordChange) this.onWordChange(this.currentWordIndex)
      if (this.onEnd) this.onEnd()
    }

    this.utterance.onboundary = (event) => {
      if (event.name === 'word') {
        this.currentWordIndex++
        if (this.onWordChange) {
          const actualIndex = (options.startFromWord || 0) + this.currentWordIndex - 1
          this.onWordChange(Math.min(actualIndex, this.words.length - 1))
        }
      }
    }

    window.speechSynthesis.speak(this.utterance)
  }

  pause() {
    window.speechSynthesis.pause()
  }

  resume() {
    window.speechSynthesis.resume()
  }

  cancel() {
    window.speechSynthesis.cancel()
    this.utterance = null
    this.currentWordIndex = 0
  }

  isSpeaking() {
    return window.speechSynthesis.speaking
  }

  isPaused() {
    return window.speechSynthesis.paused
  }

  getWordCount() {
    return this.words.length
  }
}

export function StoriesSection({ currentUserId, words }: StoriesSectionProps) {
  // State
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [isQuizMode, setIsQuizMode] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState({ correct: 0, wrong: 0 })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Translation state
  const [selectedText, setSelectedText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationPosition, setTranslationPosition] = useState({ x: 0, y: 0 })
  const [showTranslationPopup, setShowTranslationPopup] = useState(false)
  const [isTranslatingFullText, setIsTranslatingFullText] = useState(false)
  const [fullTranslation, setFullTranslation] = useState('')

  // Audio state - simplified
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speechRate, setSpeechRate] = useState(1)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // Refs
  const speechManagerRef = useRef<SpeechManager | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef = useRef(0)
  const currentWordRef = useRef(0)

  // Form state
  const [newStory, setNewStory] = useState({
    title: '',
    titleAr: '',
    content: '',
    contentAr: '',
    level: 'beginner',
    wordIds: [] as string[]
  })
  const [generateOptions, setGenerateOptions] = useState({
    topic: '',
    level: 'beginner',
    wordIds: [] as string[]
  })
  const [editStory, setEditStory] = useState({
    id: '',
    title: '',
    titleAr: '',
    content: '',
    contentAr: '',
    level: 'beginner'
  })

  // Initialize speech manager
  useEffect(() => {
    speechManagerRef.current = new SpeechManager()
    return () => {
      if (speechManagerRef.current) {
        speechManagerRef.current.cancel()
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // Start elapsed timer
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    
    timerIntervalRef.current = setInterval(() => {
      elapsedRef.current += 0.1
      setElapsedTime(elapsedRef.current)
    }, 100)
  }, [])

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  // Reset timer
  const resetTimer = useCallback(() => {
    stopTimer()
    elapsedRef.current = 0
    setElapsedTime(0)
  }, [stopTimer])

  // Create variation map from saved words (memoized for performance)
  const variationMap = useMemo(() => {
    return createVariationMap(words)
  }, [words])

  // Clean and sanitize content from any corrupted data or XSS
  const cleanAndSanitizeContent = useCallback((content: string): string => {
    if (!content) return ''
    
    let result = content

    // الخطوة 1: إزالة الأنماط المشوهة الكاملة
    // نمط: word' data-t='ترجمة' ... >word
    result = result.replace(/(\w+(?:\s+\w+)?)\s*['"]?\s*data-[a-z-]+\s*=\s*['"][^'"]*['"][^>]*>\s*\1/gi, '$1')

    // الخطوة 2: إزالة نمط: word">word أو word'>word أو word>word
    result = result.replace(/(\w+(?:\s+\w+)?)\s*["'>]+\s*\1\b/gi, '$1')

    // الخطوة 3: إزالة أي script tags أو كود خطير
    result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    result = result.replace(/javascript:/gi, '')
    result = result.replace(/on\w+\s*=/gi, 'data-blocked=')

    // الخطوة 4: إزالة HTML tags المتبقية (span, div, etc.)
    result = result.replace(/<\/?span[^>]*>/gi, '')
    result = result.replace(/<\/?div[^>]*>/gi, '')
    result = result.replace(/<\/?p[^>]*>/gi, '')
    result = result.replace(/<[^>]+>/g, '')

    // الخطوة 5: إزالة data-* attributes
    result = result
      .replace(/\s*data-[a-z-]+\s*=\s*"[^"]*"/gi, '')
      .replace(/\s*data-[a-z-]+\s*=\s*'[^']*'/gi, '')

    // الخطوة 6: إزالة class attributes
    result = result.replace(/\s*class\s*=\s*["'][^"']*["']/gi, '')

    // الخطوة 7: إزالة أي نص عربي داخل quotes (ترجمات عالقة)
    result = result.replace(/\s*['"][\u0600-\u06FF\s]+['"]/g, '')

    // الخطوة 8: إزالة بقايا quotes و brackets
    result = result
      .replace(/"\s*>/g, '')
      .replace(/'\s*>/g, '')
      .replace(/\s*>\s*/g, ' ')
      .replace(/["']/g, '')

    // الخطوة 9: تنظيف المسافات
    result = result
      .replace(/\s+/g, ' ')
      .trim()

    return result
  }, [])

  // Detect saved words in content - uses EXACT SAME logic as highlightAllWords
  const detectSavedWords = useCallback((content: string, savedWords: Word[], storyWords: StoryWord[] = []) => {
    const detected: { word: string; translation: string; id: string; matched?: string; variationType?: string }[] = []
    const foundForms = new Set<string>()
    
    // Helper function to create regex pattern - SAME as highlightAllWords
    const createRegex = (word: string) => {
      // للكلمات المركبة (تحتوي على مسافة) لا نستخدم \b
      if (word.includes(' ')) {
        return new RegExp(`(${escapeRegex(word)})`, 'gi')
      }
      // للكلمات المفردة نستخدم \b
      return new RegExp(`\\b(${escapeRegex(word)})\\b`, 'gi')
    }
    
    // تجميع مكونات الكلمات المركبة
    const multiWordComponents = new Set<string>()
    
    storyWords.forEach(sw => {
      const lowerWord = sw.word.word.toLowerCase()
      if (lowerWord.includes(' ')) {
        lowerWord.split(/\s+/).forEach(component => {
          if (component.length >= 2) {
            multiWordComponents.add(component)
          }
        })
      }
    })
    
    variationMap.forEach((wordInfo, form) => {
      if (form.includes(' ')) {
        form.split(/\s+/).forEach(component => {
          if (component.length >= 2) {
            multiWordComponents.add(component)
          }
        })
      }
    })
    
    // FIRST: Detect multi-word story words
    storyWords.filter(sw => sw.word.word.includes(' ')).forEach(sw => {
      const regex = createRegex(sw.word.word)
      content.replace(regex, (match) => {
        const matchedLower = match.toLowerCase()
        if (!foundForms.has(matchedLower)) {
          foundForms.add(matchedLower)
          detected.push({
            word: sw.word.word,
            translation: sw.word.translation,
            id: sw.word.id,
            matched: matchedLower,
            variationType: 'original'
          })
        }
        return match
      })
    })
    
    // SECOND: Detect multi-word saved words from variationMap
    const detectedMultiWordWords = new Set<string>()
    variationMap.forEach((wordInfo, form) => {
      if (!form.includes(' ')) return
      if (storyWords.some(sw => sw.word.word.toLowerCase() === wordInfo.word)) return
      if (detectedMultiWordWords.has(wordInfo.word)) return
      detectedMultiWordWords.add(wordInfo.word)
      
      const regex = createRegex(form)
      content.replace(regex, (match) => {
        const matchedLower = match.toLowerCase()
        if (!foundForms.has(matchedLower)) {
          foundForms.add(matchedLower)
          detected.push({
            word: wordInfo.word,
            translation: wordInfo.translation,
            id: wordInfo.id,
            matched: matchedLower,
            variationType: wordInfo.variationType
          })
        }
        return match
      })
    })
    
    // THIRD: Detect single-word story words (skip components of multi-word phrases)
    storyWords.filter(sw => !sw.word.word.includes(' ')).forEach(sw => {
      const lowerWord = sw.word.word.toLowerCase()
      if (multiWordComponents.has(lowerWord)) return
      
      const regex = createRegex(sw.word.word)
      content.replace(regex, (match) => {
        const matchedLower = match.toLowerCase()
        if (!foundForms.has(matchedLower)) {
          foundForms.add(matchedLower)
          detected.push({
            word: sw.word.word,
            translation: sw.word.translation,
            id: sw.word.id,
            matched: matchedLower,
            variationType: 'original'
          })
        }
        return match
      })
    })
    
    // FOURTH: Detect single-word saved words (skip components of multi-word phrases)
    variationMap.forEach((wordInfo, form) => {
      if (form.includes(' ')) return
      if (storyWords.some(sw => sw.word.word.toLowerCase() === wordInfo.word)) return
      if (multiWordComponents.has(form)) return
      
      const regex = createRegex(form)
      content.replace(regex, (match) => {
        const matchedLower = match.toLowerCase()
        if (!foundForms.has(matchedLower)) {
          foundForms.add(matchedLower)
          detected.push({
            word: wordInfo.word,
            translation: wordInfo.translation,
            id: wordInfo.id,
            matched: matchedLower,
            variationType: wordInfo.variationType
          })
        }
        return match
      })
    })
    
    return detected
  }, [variationMap])

  // Highlight all detected words in content - uses EXACT SAME logic as detectSavedWords
  const highlightAllWords = useCallback((content: string, savedWords: Word[], storyWords: StoryWord[] = []) => {
    // أولاً: تنظيف وتعقيم المحتوى
    let result = cleanAndSanitizeContent(content)
    
    // Helper function to create regex pattern
    const createRegex = (word: string) => {
      // للكلمات المركبة (تحتوي على مسافة) لا نستخدم \b
      if (word.includes(' ')) {
        return new RegExp(`(${escapeRegex(word)})`, 'gi')
      }
      // للكلمات المفردة نستخدم \b
      return new RegExp(`\\b(${escapeRegex(word)})\\b`, 'gi')
    }
    
    // تجميع مكونات الكلمات المركبة من storyWords و variationMap
    const multiWordComponents = new Set<string>()
    
    // من storyWords
    storyWords.forEach(sw => {
      const lowerWord = sw.word.word.toLowerCase()
      if (lowerWord.includes(' ')) {
        lowerWord.split(/\s+/).forEach(component => {
          if (component.length >= 2) {
            multiWordComponents.add(component)
          }
        })
      }
    })
    
    // من variationMap
    variationMap.forEach((wordInfo, form) => {
      if (form.includes(' ')) {
        form.split(/\s+/).forEach(component => {
          if (component.length >= 2) {
            multiWordComponents.add(component)
          }
        })
      }
    })
    
    // الخطوة 1: إبراز الكلمات المركبة من storyWords أولاً
    storyWords.filter(sw => sw.word.word.includes(' ')).forEach(sw => {
      const regex = createRegex(sw.word.word)
      result = result.replace(regex, (_, match) => {
        return `<span class="word-highlight story-word" data-word="${sw.word.word}" data-translation="${sw.word.translation}">${match}</span>`
      })
    })
    
    // الخطوة 2: إبراز الكلمات المركبة من variationMap
    const processedMultiWordForms = new Set<string>()
    variationMap.forEach((wordInfo, form) => {
      if (!form.includes(' ')) return
      if (storyWords.some(sw => sw.word.word.toLowerCase() === wordInfo.word)) return
      if (processedMultiWordForms.has(wordInfo.word)) return
      processedMultiWordForms.add(wordInfo.word)
      
      const regex = createRegex(form)
      result = result.replace(regex, (_, match) => {
        return `<span class="word-highlight saved-word" data-word="${wordInfo.word}" data-translation="${wordInfo.translation}" data-matched="${match}" data-variation="${wordInfo.variationType}">${match}</span>`
      })
    })
    
    // الخطوة 3: إبراز الكلمات المفردة من storyWords (تخطي مكونات الكلمات المركبة)
    storyWords.filter(sw => !sw.word.word.includes(' ')).forEach(sw => {
      const lowerWord = sw.word.word.toLowerCase()
      // تخطي إذا كان جزء من كلمة مركبة
      if (multiWordComponents.has(lowerWord)) return
      
      const regex = createRegex(sw.word.word)
      result = result.replace(regex, (_, match) => {
        return `<span class="word-highlight story-word" data-word="${sw.word.word}" data-translation="${sw.word.translation}">${match}</span>`
      })
    })
    
    // الخطوة 4: إبراز الكلمات المفردة من variationMap (تخطي مكونات الكلمات المركبة)
    variationMap.forEach((wordInfo, form) => {
      if (form.includes(' ')) return // تمت معالجتها أعلاه
      if (storyWords.some(sw => sw.word.word.toLowerCase() === wordInfo.word)) return
      // تخطي إذا كان جزء من كلمة مركبة
      if (multiWordComponents.has(form)) return
      
      const regex = createRegex(form)
      result = result.replace(regex, (_, match) => {
        return `<span class="word-highlight saved-word" data-word="${wordInfo.word}" data-translation="${wordInfo.translation}" data-matched="${match}" data-variation="${wordInfo.variationType}">${match}</span>`
      })
    })
    
    return result
  }, [variationMap, cleanAndSanitizeContent])

  // Helper function to escape regex special characters
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // Fetch stories
  const fetchStories = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/stories?userId=${currentUserId}`)
      const data = await response.json()
      if (data.success) {
        setStories(data.data.map((s: Story) => ({
          ...s,
          questions: s.questions || undefined
        })))
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error('فشل في تحميل القصص')
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    if (currentUserId) {
      fetchStories()
    }
  }, [currentUserId, fetchStories])

  // Toggle favorite
  const toggleFavorite = async (story: Story) => {
    try {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !story.isFavorite })
      })
      const data = await response.json()
      if (data.success) {
        setStories(prev => prev.map(s => 
          s.id === story.id ? { ...s, isFavorite: !s.isFavorite } : s
        ))
        if (selectedStory?.id === story.id) {
          setSelectedStory(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null)
        }
        toast.success(story.isFavorite ? 'تمت إزالة من المفضلة' : 'تمت الإضافة للمفضلة')
      }
    } catch {
      toast.error('فشل في تحديث المفضلة')
    }
  }

  // Mark as read
  const markAsRead = async (story: Story) => {
    if (story.isRead) return
    try {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })
      const data = await response.json()
      if (data.success) {
        setStories(prev => prev.map(s => 
          s.id === story.id ? { ...s, isRead: true } : s
        ))
        if (selectedStory?.id === story.id) {
          setSelectedStory(prev => prev ? { ...prev, isRead: true } : null)
        }
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Delete story
  const deleteStory = async (storyId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القصة؟')) return
    try {
      const response = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setStories(prev => prev.filter(s => s.id !== storyId))
        if (selectedStory?.id === storyId) {
          setSelectedStory(null)
          setIsReading(false)
        }
        toast.success('تم حذف القصة')
      }
    } catch {
      toast.error('فشل في حذف القصة')
    }
  }

  // Add story manually
  const handleAddStory = async () => {
    if (!newStory.title || !newStory.content) {
      toast.error('العنوان والمحتوى مطلوبان')
      return
    }
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStory,
          userId: currentUserId
        })
      })
      const data = await response.json()
      if (data.success) {
        setStories(prev => [data.data, ...prev])
        setIsAddDialogOpen(false)
        setNewStory({
          title: '',
          titleAr: '',
          content: '',
          contentAr: '',
          level: 'beginner',
          wordIds: []
        })
        toast.success('تمت إضافة القصة بنجاح')
      }
    } catch {
      toast.error('فشل في إضافة القصة')
    }
  }

  // Edit story
  const handleEditStory = async () => {
    if (!editStory.title || !editStory.content) {
      toast.error('العنوان والمحتوى مطلوبان')
      return
    }
    try {
      const response = await fetch(`/api/stories/${editStory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStory)
      })
      const data = await response.json()
      if (data.success) {
        setStories(prev => prev.map(s => s.id === editStory.id ? data.data : s))
        if (selectedStory?.id === editStory.id) {
          setSelectedStory(data.data)
        }
        setIsEditDialogOpen(false)
        setEditStory({
          id: '',
          title: '',
          titleAr: '',
          content: '',
          contentAr: '',
          level: 'beginner'
        })
        toast.success('تم تحديث القصة بنجاح')
      }
    } catch {
      toast.error('فشل في تحديث القصة')
    }
  }

  // Open edit dialog
  const openEditDialog = (story: Story) => {
    setEditStory({
      id: story.id,
      title: story.title,
      titleAr: story.titleAr || '',
      content: story.content,
      contentAr: story.contentAr || '',
      level: story.level
    })
    setIsEditDialogOpen(true)
  }

  // Generate story with AI
  const handleGenerateStory = async () => {
    if (!generateOptions.topic) {
      toast.error('الرجاء إدخال موضوع القصة')
      return
    }
    try {
      setIsGenerating(true)
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generateOptions,
          userId: currentUserId,
          savedWords: words.filter(w => generateOptions.wordIds.includes(w.id))
        })
      })
      const data = await response.json()
      if (data.success) {
        setStories(prev => [data.data, ...prev])
        setIsGenerateDialogOpen(false)
        setGenerateOptions({
          topic: '',
          level: 'beginner',
          wordIds: []
        })
        toast.success('تم توليد القصة بنجاح')
      } else {
        toast.error(data.error || 'فشل في توليد القصة')
      }
    } catch {
      toast.error('فشل في توليد القصة')
    } finally {
      setIsGenerating(false)
    }
  }

  // Translate text
  const translateText = async (text: string, x: number, y: number) => {
    if (!text.trim()) return
    
    setSelectedText(text)
    setTranslationPosition({ x, y })
    setIsTranslating(true)
    setShowTranslationPopup(true)
    setTranslatedText('')
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'ar' })
      })
      const data = await response.json()
      if (data.success) {
        setTranslatedText(data.translation)
      } else {
        setTranslatedText('فشل في الترجمة')
      }
    } catch {
      setTranslatedText('فشل في الترجمة')
    } finally {
      setIsTranslating(false)
    }
  }

  // Translate full text
  const translateFullText = async (text: string) => {
    if (!text.trim()) return
    
    setIsTranslatingFullText(true)
    setFullTranslation('')
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'ar' })
      })
      const data = await response.json()
      if (data.success) {
        setFullTranslation(data.translation)
      } else {
        toast.error('فشل في ترجمة النص')
      }
    } catch {
      toast.error('فشل في ترجمة النص')
    } finally {
      setIsTranslatingFullText(false)
    }
  }

  // Handle text selection
  const handleTextSelection = useCallback((e: React.MouseEvent) => {
    if (e.type !== 'mouseup') return
    
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      const x = Math.min(rect.left + rect.width / 2, window.innerWidth - 200)
      const y = Math.max(rect.top - 10, 100)
      
      translateText(text, x, y)
    }
  }, [])

  // Handle word click from highlighted content
  const handleWordClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    if (target.classList.contains('word-highlight')) {
      e.stopPropagation()
      const word = target.dataset.word
      const translation = target.dataset.translation || ''
      const matched = target.dataset.matched || word || ''
      const variationType = target.dataset.variation || ''
      const rect = target.getBoundingClientRect()
      
      const x = Math.min(rect.left, window.innerWidth - 200)
      const y = Math.max(rect.top - 10, 100)
      
      setSelectedText(matched)
      
      if (translation) {
        // Show translation with variation info if applicable
        let displayTranslation = translation
        if (variationType && variationType !== 'original' && matched.toLowerCase() !== word?.toLowerCase()) {
          const variationLabel = getVariationTypeLabel(variationType)
          if (variationLabel) {
            displayTranslation = `${translation}\n(${variationLabel} من "${word}")`
          }
        }
        setTranslatedText(displayTranslation)
        setTranslationPosition({ x, y })
        setShowTranslationPopup(true)
        setIsTranslating(false)
      } else {
        translateText(matched || '', x, y)
      }
    }
  }, [])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Play speech
  const playSpeech = useCallback((text: string, startFromWord: number = 0) => {
    if (!speechManagerRef.current) return

    const totalWordCount = text.split(/\s+/).length
    setTotalWords(totalWordCount)

    speechManagerRef.current.speak(text, {
      rate: speechRate,
      startFromWord,
      onStart: () => {
        setIsPlaying(true)
        setIsPaused(false)
        startTimer()
      },
      onWordChange: (index) => {
        currentWordRef.current = index
        setCurrentWordIndex(index)
      },
      onEnd: () => {
        setIsPlaying(false)
        setIsPaused(false)
        stopTimer()
        setCurrentWordIndex(totalWordCount)
      }
    })
  }, [speechRate, startTimer, stopTimer])

  // Pause speech
  const pauseSpeech = useCallback(() => {
    if (!speechManagerRef.current) return
    speechManagerRef.current.pause()
    setIsPaused(true)
    stopTimer()
  }, [stopTimer])

  // Resume speech
  const resumeSpeech = useCallback(() => {
    if (!speechManagerRef.current) return
    speechManagerRef.current.resume()
    setIsPaused(false)
    startTimer()
  }, [startTimer])

  // Stop speech
  const stopSpeech = useCallback(() => {
    if (!speechManagerRef.current) return
    speechManagerRef.current.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentWordIndex(0)
    resetTimer()
  }, [resetTimer])

  // Skip forward - skip 10% of words
  const skipForward = useCallback(() => {
    if (!selectedStory || !speechManagerRef.current) return
    
    const totalWordsCount = selectedStory.content.split(/\s+/).length
    const skipAmount = Math.max(10, Math.floor(totalWordsCount * 0.1))
    const newWordIndex = Math.min(currentWordRef.current + skipAmount, totalWordsCount - 1)
    
    speechManagerRef.current.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    
    // Small delay to ensure cancellation is processed
    setTimeout(() => {
      playSpeech(selectedStory.content, newWordIndex)
    }, 50)
  }, [selectedStory, playSpeech])

  // Skip backward - go back 10% of words
  const skipBackward = useCallback(() => {
    if (!selectedStory || !speechManagerRef.current) return
    
    const skipAmount = Math.max(10, Math.floor(totalWords * 0.1))
    const newWordIndex = Math.max(currentWordRef.current - skipAmount, 0)
    
    speechManagerRef.current.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    
    setTimeout(() => {
      playSpeech(selectedStory.content, newWordIndex)
    }, 50)
  }, [selectedStory, totalWords, playSpeech])

  // Start reading
  const startReading = (story: Story) => {
    stopSpeech()
    setSelectedStory(story)
    setIsReading(true)
    setIsQuizMode(false)
    markAsRead(story)
    setFullTranslation('')
    setCurrentWordIndex(0)
    currentWordRef.current = 0
  }

  // Start quiz
  const startQuiz = async (story: Story) => {
    stopSpeech()
    
    if (!story.questions || story.questions.length === 0) {
      const questionCount = story._count?.questions || 0
      if (questionCount === 0) {
        toast.info('لا توجد أسئلة لهذه القصة')
        return
      }
      try {
        const response = await fetch(`/api/stories/${story.id}`)
        const data = await response.json()
        if (data.success && data.data.questions) {
          const parsedQuestions = data.data.questions.map((q: { id: string; question: string; questionAr: string | null; options: string; answer: number }) => ({
            ...q,
            options: JSON.parse(q.options)
          }))
          setSelectedStory({ ...story, questions: parsedQuestions })
          setQuizIndex(0)
          setQuizScore({ correct: 0, wrong: 0 })
          setIsQuizMode(true)
          setIsReading(false)
        }
      } catch {
        toast.error('فشل في تحميل الأسئلة')
      }
    } else {
      setSelectedStory(story)
      setQuizIndex(0)
      setQuizScore({ correct: 0, wrong: 0 })
      setIsQuizMode(true)
      setIsReading(false)
    }
  }

  // Handle quiz answer
  const handleQuizAnswer = (answerIndex: number) => {
    if (!selectedStory?.questions) return
    
    const currentQuestion = selectedStory.questions[quizIndex]
    const isCorrect = answerIndex === currentQuestion.answer

    if (isCorrect) {
      setQuizScore(prev => ({ ...prev, correct: prev.correct + 1 }))
      toast.success('إجابة صحيحة! 🎉')
    } else {
      setQuizScore(prev => ({ ...prev, wrong: prev.wrong + 1 }))
      toast.error('إجابة خاطئة')
    }

    if (quizIndex < selectedStory.questions.length - 1) {
      setQuizIndex(prev => prev + 1)
    } else {
      const finalScore = {
        correct: quizScore.correct + (isCorrect ? 1 : 0),
        wrong: quizScore.wrong + (isCorrect ? 0 : 1)
      }
      toast.success(`انتهى الاختبار! النتيجة: ${finalScore.correct}/${selectedStory.questions.length}`)
      setIsQuizMode(false)
    }
  }

  // Close translation popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.translation-popup') && !target.classList.contains('word-highlight')) {
        setShowTranslationPopup(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Quiz mode
  if (isQuizMode && selectedStory?.questions) {
    const currentQuestion = selectedStory.questions[quizIndex]
    
    return (
      <motion.div
        key="quiz"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-between mb-2">
              <Badge variant="outline">{quizIndex + 1}/{selectedStory.questions.length}</Badge>
              <div className="flex gap-2">
                <Badge className="bg-emerald-100 text-emerald-700">
                  <CheckCircle className="w-3 h-3 mr-1" />{quizScore.correct}
                </Badge>
                <Badge className="bg-rose-100 text-rose-700">
                  <X className="w-3 h-3 mr-1" />{quizScore.wrong}
                </Badge>
            </div>
            </div>
            <Progress value={((quizIndex + 1) / selectedStory.questions.length) * 100} className="h-1" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm mb-2">السؤال:</p>
              <h2 className="text-xl font-bold">{currentQuestion.questionAr || currentQuestion.question}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-12 text-lg justify-center hover:bg-emerald-50 hover:border-emerald-300"
                  onClick={() => handleQuizAnswer(i)}
                >
                  {option}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setIsQuizMode(false)}
            >
              إلغاء الاختبار
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Reading mode
  if (isReading && selectedStory) {
    const detectedWords = detectSavedWords(selectedStory.content, words, selectedStory.storyWords)
    const progress = totalWords > 0 ? (currentWordIndex / totalWords) * 100 : 0
    
    return (
      <>
      <motion.div
        key="reading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedStory.titleAr || selectedStory.title}</CardTitle>
                <CardDescription className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedStory.readingTime} دقيقة
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {selectedStory.wordCount} كلمة
                  </span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(selectedStory)}
                >
                  <Heart className={cn("w-5 h-5", selectedStory.isFavorite && "fill-rose-500 text-rose-500")} />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Audio Controls */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b">
            <div className="flex flex-col gap-3">
              {/* Main controls row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Play/Pause */}
                {!isPlaying ? (
                  <Button
                    size="icon"
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    onClick={() => playSpeech(selectedStory.content)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                ) : isPaused ? (
                  <Button
                    size="icon"
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    onClick={resumeSpeech}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="shrink-0"
                    onClick={pauseSpeech}
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Stop */}
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  onClick={stopSpeech}
                  disabled={!isPlaying}
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
                
                {/* Skip Backward */}
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  onClick={skipBackward}
                  title="رجوع"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                {/* Skip Forward */}
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  onClick={skipForward}
                  title="تقديم"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                {/* Time display */}
                <div className="text-sm font-mono text-gray-600 dark:text-gray-400 px-2">
                  {formatTime(elapsedTime)}
                </div>
                
                {/* Progress bar */}
                <div className="flex-1 min-w-20">
                  <Progress value={progress} className="h-2" />
                </div>
                
                {/* Word count */}
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {currentWordIndex}/{totalWords} كلمة
                </div>
                
                {/* Speed Control */}
                <div className="flex items-center gap-1 shrink-0">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <Select
                    value={speechRate.toString()}
                    onValueChange={(v) => {
                      const newRate = parseFloat(v)
                      setSpeechRate(newRate)
                      // Restart speech with new rate if playing
                      if (isPlaying && !isPaused) {
                        speechManagerRef.current?.cancel()
                        setTimeout(() => {
                          playSpeech(selectedStory.content, currentWordRef.current)
                        }, 50)
                      }
                    }}
                  >
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="prose dark:prose-invert max-w-none p-6">
            {/* Arabic Translation */}
            {selectedStory.contentAr && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Languages className="w-4 h-4" />
                  <span className="text-sm font-medium">الترجمة العربية</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  {selectedStory.contentAr}
                </p>
              </div>
            )}
            
            {/* Translate Full Text Button */}
            {!selectedStory.contentAr && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={() => translateFullText(selectedStory.content)}
                  disabled={isTranslatingFullText}
                  className="w-full"
                >
                  {isTranslatingFullText ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الترجمة...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 mr-2" />
                      ترجمة النص كاملاً بالذكاء الاصطناعي
                    </>
                  )}
                </Button>
                {fullTranslation && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                      {fullTranslation}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* English Content with highlighted words */}
            <div className="relative">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">النص الإنجليزي</span>
                <span className="text-xs text-gray-500">(اضغط على كلمة أو حدد نصاً للترجمة)</span>
              </div>
              <div
                className="text-lg leading-relaxed select-text"
                onMouseUp={handleTextSelection}
                onClick={handleWordClick}
                dangerouslySetInnerHTML={{
                  __html: highlightAllWords(selectedStory.content, words, selectedStory.storyWords)
                }}
              />
            </div>
            
            {/* Legend */}
            <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded">كلمة</span>
                <span className="text-gray-500">من كلمات القصة</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded">كلمة</span>
                <span className="text-gray-500">من كلماتك المحفوظة</span>
              </div>
            </div>
            
            {/* Detected words section */}
            {detectedWords.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-600" />
                  الكلمات المكتشفة في القصة ({detectedWords.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detectedWords.map((w, i) => {
                    const variationLabel = w.variationType && w.variationType !== 'original' ? getVariationTypeLabel(w.variationType) : ''
                    return (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="text-sm cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors flex items-center gap-1"
                      >
                        <span>{w.matched && w.matched !== w.word ? `${w.matched} ← ` : ''}{w.word}</span>
                        <span className="text-gray-500">-</span>
                        <span>{w.translation}</span>
                        {variationLabel && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 mr-1">
                            ({variationLabel})
                          </span>
                        )}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
          
          <div className="p-4 border-t flex justify-between">
            <Button variant="outline" onClick={() => { setIsReading(false); stopSpeech(); }}>
              <ChevronRight className="w-4 h-4 mr-2" />
              العودة
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => openEditDialog(selectedStory)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                تعديل
              </Button>
              <Button
                variant="outline"
                className="text-rose-600"
                onClick={() => deleteStory(selectedStory.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                حذف
              </Button>
              {(selectedStory._count?.questions || 0) > 0 && (
                <Button
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={() => startQuiz(selectedStory)}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  اختبار
                </Button>
              )}
            </div>
          </div>
        </Card>
        
        {/* Translation Popup */}
        <AnimatePresence>
          {showTranslationPopup && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="translation-popup fixed z-50 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 border max-w-xs"
              style={{
                left: Math.min(translationPosition.x, window.innerWidth - 300),
                top: translationPosition.y
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">ترجمة</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowTranslationPopup(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 font-medium">{selectedText}</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {isTranslating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الترجمة...
                  </span>
                ) : (
                  translatedText
                )}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => {
                  if (speechManagerRef.current) {
                    speechManagerRef.current.cancel()
                    const utterance = new SpeechSynthesisUtterance(selectedText)
                    utterance.lang = 'en-US'
                    utterance.rate = speechRate
                    window.speechSynthesis.speak(utterance)
                  }
                  setShowTranslationPopup(false)
                }}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                نطق الكلمة
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Edit Story Dialog - in reading mode */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>تعديل القصة</DialogTitle>
            <DialogDescription>
              قم بتعديل محتوى القصة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>العنوان بالإنجليزية *</Label>
              <Input
                value={editStory.title}
                onChange={(e) => setEditStory(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Story title..."
                dir="ltr"
              />
            </div>
            
            <div>
              <Label>العنوان بالعربية</Label>
              <Input
                value={editStory.titleAr}
                onChange={(e) => setEditStory(prev => ({ ...prev, titleAr: e.target.value }))}
                placeholder="عنوان القصة..."
                dir="rtl"
              />
            </div>
            
            <div>
              <Label>المحتوى بالإنجليزية *</Label>
              <Textarea
                value={editStory.content}
                onChange={(e) => setEditStory(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Story content in English..."
                className="min-h-[200px]"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label>المحتوى بالعربية</Label>
              <Textarea
                value={editStory.contentAr}
                onChange={(e) => setEditStory(prev => ({ ...prev, contentAr: e.target.value }))}
                placeholder="محتوى القصة بالعربية..."
                className="min-h-[200px]"
                dir="rtl"
              />
            </div>
            
            <div>
              <Label>المستوى</Label>
              <Select
                value={editStory.level}
                onValueChange={(v) => setEditStory(prev => ({ ...prev, level: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditStory} className="bg-emerald-600 hover:bg-emerald-700">
              <Edit2 className="w-4 h-4 mr-2" />
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
  }

  // Main view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">القصص</h2>
          <p className="text-gray-500 text-sm">اقرأ قصص بالإنجليزية وحسّن مهاراتك</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGenerateDialogOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            توليد AI
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة قصة
          </Button>
        </div>
      </div>

      {/* Stories grid */}
      {stories.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">لا توجد قصص</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              توليد قصة بالـ AI
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة قصة يدوياً
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group"
                  onClick={() => startReading(story)}
                >
                  <div className={cn(
                    "h-1.5",
                    story.level === 'beginner' ? 'bg-gradient-to-l from-emerald-400 to-emerald-600' :
                    story.level === 'intermediate' ? 'bg-gradient-to-l from-amber-400 to-amber-600' :
                    'bg-gradient-to-l from-rose-400 to-rose-600'
                  )} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                            {story.titleAr || story.title}
                          </h3>
                          {story.isAiGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        {story.titleAr && story.title !== story.titleAr && (
                          <p className="text-gray-500 text-sm">{story.title}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {story.isRead && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(story)
                          }}
                          className="p-1"
                        >
                          <Heart className={cn(
                            "w-4 h-4",
                            story.isFavorite && "fill-rose-500 text-rose-500"
                          )} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                      {story.contentAr || story.content.substring(0, 100)}...
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge className={cn("text-xs", levelConfig[story.level]?.bg, levelConfig[story.level]?.color)}>
                        {levelConfig[story.level]?.label || story.level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {story.readingTime} د
                      </Badge>
                      {story.savedWordsCount > 0 && (
                        <Badge variant="outline" className="text-xs text-emerald-600">
                          {story.savedWordsCount} كلمات محفوظة
                        </Badge>
                      )}
                      {(story._count?.questions || 0) > 0 && (
                        <Badge variant="outline" className="text-xs text-violet-600">
                          <Brain className="w-3 h-3 mr-1" />
                          اختبار
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{story.wordCount} كلمة</span>
                      <span>{new Date(story.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Story Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة قصة جديدة</DialogTitle>
            <DialogDescription>
              أضف قصة يدوياً لمساعدتك في تعلم الإنجليزية
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>العنوان بالإنجليزية *</Label>
              <Input
                value={newStory.title}
                onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Story Title"
              />
            </div>
            
            <div>
              <Label>العنوان بالعربية</Label>
              <Input
                value={newStory.titleAr}
                onChange={(e) => setNewStory(prev => ({ ...prev, titleAr: e.target.value }))}
                placeholder="عنوان القصة"
                dir="rtl"
              />
            </div>
            
            <div>
              <Label>المحتوى بالإنجليزية *</Label>
              <Textarea
                value={newStory.content}
                onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Once upon a time..."
                rows={6}
              />
            </div>
            
            <div>
              <Label>المحتوى بالعربية (ترجمة)</Label>
              <Textarea
                value={newStory.contentAr}
                onChange={(e) => setNewStory(prev => ({ ...prev, contentAr: e.target.value }))}
                placeholder="كان يا ما كان..."
                rows={4}
                dir="rtl"
              />
            </div>
            
            <div>
              <Label>المستوى</Label>
              <Select
                value={newStory.level}
                onValueChange={(v) => setNewStory(prev => ({ ...prev, level: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الكلمات المحفوظة المرتبطة</Label>
              <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                {words.slice(0, 20).map(word => (
                  <Badge
                    key={word.id}
                    variant={newStory.wordIds.includes(word.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setNewStory(prev => ({
                        ...prev,
                        wordIds: prev.wordIds.includes(word.id)
                          ? prev.wordIds.filter(id => id !== word.id)
                          : [...prev.wordIds, word.id]
                      }))
                    }}
                  >
                    {word.word}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddStory} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Story Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>توليد قصة بالذكاء الاصطناعي</DialogTitle>
            <DialogDescription>
              أدخل موضوع وسيقوم الـ AI بتوليد قصة تعليمية لك
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>موضوع القصة *</Label>
              <Input
                value={generateOptions.topic}
                onChange={(e) => setGenerateOptions(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="مثال: رحلة إلى الشاطئ، زيارة المتحف، الطبخ..."
                dir="rtl"
              />
            </div>
            
            <div>
              <Label>المستوى</Label>
              <Select
                value={generateOptions.level}
                onValueChange={(v) => setGenerateOptions(prev => ({ ...prev, level: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الكلمات المحفوظة لتضمينها (اختياري)</Label>
              <p className="text-xs text-gray-500 mb-2">
                اختر كلمات من قائمتك لتضمينها في القصة
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {words.slice(0, 20).map(word => (
                  <Badge
                    key={word.id}
                    variant={generateOptions.wordIds.includes(word.id) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      generateOptions.wordIds.includes(word.id) && "bg-emerald-600"
                    )}
                    onClick={() => {
                      setGenerateOptions(prev => ({
                        ...prev,
                        wordIds: prev.wordIds.includes(word.id)
                          ? prev.wordIds.filter(id => id !== word.id)
                          : [...prev.wordIds, word.id]
                      }))
                    }}
                  >
                    {word.word}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleGenerateStory}
              disabled={isGenerating}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  توليد القصة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Story Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل القصة</DialogTitle>
            <DialogDescription>
              قم بتعديل محتوى القصة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>العنوان بالإنجليزية *</Label>
              <Input
                value={editStory.title}
                onChange={(e) => setEditStory(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Story title..."
                dir="ltr"
              />
            </div>
            
            <div>
              <Label>العنوان بالعربية</Label>
              <Input
                value={editStory.titleAr}
                onChange={(e) => setEditStory(prev => ({ ...prev, titleAr: e.target.value }))}
                placeholder="عنوان القصة..."
                dir="rtl"
              />
            </div>
            
            <div>
              <Label>المحتوى بالإنجليزية *</Label>
              <Textarea
                value={editStory.content}
                onChange={(e) => setEditStory(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Story content in English..."
                className="min-h-[200px]"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label>المحتوى بالعربية</Label>
              <Textarea
                value={editStory.contentAr}
                onChange={(e) => setEditStory(prev => ({ ...prev, contentAr: e.target.value }))}
                placeholder="محتوى القصة بالعربية..."
                className="min-h-[200px]"
                dir="rtl"
              />
            </div>
            
            <div>
              <Label>المستوى</Label>
              <Select
                value={editStory.level}
                onValueChange={(v) => setEditStory(prev => ({ ...prev, level: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditStory} className="bg-emerald-600 hover:bg-emerald-700">
              <Edit2 className="w-4 h-4 mr-2" />
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
