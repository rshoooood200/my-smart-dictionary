'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Volume2, Loader2, Sparkles, Headphones,
  AlertTriangle, CheckCircle, ArrowRight, BookOpen,
  Lightbulb, MessageSquare, History, X, ChevronLeft,
  Mic, Target, RefreshCw, VolumeX, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSpellCheck } from '@/hooks/use-spell-check'

// ============== TYPES ==============

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

interface PronunciationData {
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

interface PronunciationTrainerAIProps {
  currentUserId?: string
}

// ============== SUGGESTION WORDS ==============

const SUGGESTION_WORDS = [
  { word: 'thought', label: 'فكر' },
  { word: 'through', label: 'عبر' },
  { word: 'knowledge', label: 'معرفة' },
  { word: 'schedule', label: 'جدول' },
  { word: 'comfortable', label: 'مريح' },
  { word: 'restaurant', label: 'مطعم' },
  { word: 'Wednesday', label: 'الأربعاء' },
  { word: 'temperature', label: 'حرارة' },
  { word: 'vegetable', label: 'خضار' },
  { word: 'choir', label: 'جوقة' },
  { word: 'island', label: 'جزيرة' },
  { word: 'receipt', label: 'إيصال' },
]

// ============== COMPONENT ==============

export function PronunciationTrainerAI({ currentUserId }: PronunciationTrainerAIProps) {
  const [searchWord, setSearchWord] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PronunciationData | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ============== SPEECH ==============

  const speak = useCallback((text: string, lang: string = 'en-US', rate: number = 0.8) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('المتصفح لا يدعم خاصية النطق')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [])

  const { spellError, isChecking, checkWord, clearError } = useSpellCheck()

  // ============== SEARCH ==============

  const handleSearch = useCallback(async (wordToSearch?: string) => {
    const word = (wordToSearch || searchWord).trim()
    if (!word) {
      toast.error('الرجاء إدخال كلمة')
      return
    }

    // Spell check first
    clearError()
    const isValid = await checkWord(word)
    if (!isValid) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/pronunciation-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'حدث خطأ أثناء التحليل')
      }

      setResult(data.data)

      // Add to history (avoid duplicates, keep latest at top)
      setHistory(prev => {
        const filtered = prev.filter(w => w.toLowerCase() !== word.toLowerCase())
        return [word, ...filtered].slice(0, 15)
      })

      setSearchWord(word)
    } catch (error) {
      console.error('Pronunciation search error:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء تحليل النطق')
    } finally {
      setIsLoading(false)
    }
  }, [searchWord])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const clearResult = useCallback(() => {
    setResult(null)
    setSearchWord('')
    inputRef.current?.focus()
  }, [])

  // ============== RENDER ==============

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Headphones className="w-7 h-7 text-violet-500" />
            مدرب النطق
          </h2>
          <p className="text-gray-500 mt-1">تحليل النطق بالذكاء الاصطناعي للكلمات الإنجليزية</p>
        </div>
        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0 px-3 py-1">
          <Sparkles className="w-3.5 h-3.5 ml-1" />
          مدعوم بـ AI
        </Badge>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 h-1.5" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  ref={inputRef}
                  value={searchWord}
                  onChange={(e) => { setSearchWord(e.target.value); clearError() }}
                  onKeyDown={handleKeyDown}
                  placeholder="أدخل كلمة إنجليزية لتحليل نطقها..."
                  className={cn("pr-10 h-12 text-lg", spellError ? "border-rose-400 focus-visible:ring-rose-400" : "border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500")}
                  disabled={isLoading || isChecking}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={isLoading || !searchWord.trim()}
                className="h-12 px-6 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
              {result && (
                <Button
                  variant="outline"
                  onClick={clearResult}
                  className="h-12 px-3 border-violet-200 dark:border-violet-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Spell Error Message */}
            <AnimatePresence>
              {spellError && !spellError.valid && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
                        خطأ إملائي! الكلمة &quot;{spellError.word}&quot; غير صحيحة
                      </p>
                      {spellError.suggestions && spellError.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-rose-600 dark:text-rose-500 mb-1.5">هل كنت تقصد:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {spellError.suggestions.slice(0, 5).map((suggestion) => (
                              <Badge
                                key={suggestion}
                                className="cursor-pointer bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-800/50 transition-colors"
                                onClick={() => {
                                  setSearchWord(suggestion)
                                  clearError()
                                  handleSearch(suggestion)
                                }}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={clearError} className="shrink-0 text-rose-400 hover:text-rose-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Suggestion Words */}
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                كلمات مقترحة للتجربة:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_WORDS.map((item) => (
                  <motion.button
                    key={item.word}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 rounded-full text-sm bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors border border-violet-200 dark:border-violet-800"
                    onClick={() => {
                      setSearchWord(item.word)
                      handleSearch(item.word)
                    }}
                    disabled={isLoading}
                  >
                    {item.word} ({item.label})
                  </motion.button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-violet-200 dark:border-violet-800" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
              <Mic className="absolute inset-0 m-auto w-8 h-8 text-violet-500" />
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
              جاري تحليل النطق بالذكاء الاصطناعي...
            </p>
            <p className="text-sm text-gray-400 mt-1">قد يستغرق بضع ثوانٍ</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* IPA & Syllable Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-6 sm:p-8 text-white text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <h3 className="text-3xl sm:text-4xl font-bold mb-2">{result.word}</h3>
                  <p className="text-2xl sm:text-3xl font-mono opacity-90 mb-3">
                    {result.pronunciation.ipa}
                  </p>
                  <p className="text-lg opacity-80 mb-4">
                    {result.pronunciation.syllables}
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Badge className="bg-white/20 text-white border-0 text-sm px-3 py-1">
                      <Target className="w-3.5 h-3.5 ml-1" />
                      التشديد: {result.pronunciation.stressPattern}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => speak(result.word)}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-4 h-4 ml-1" />
                      ) : (
                        <Volume2 className="w-4 h-4 ml-1" />
                      )}
                      استمع للنطق
                    </Button>
                  </div>
                </motion.div>
              </div>
            </Card>

            {/* Phonetic Breakdown */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-violet-500" />
                  تفكيك الأصوات
                </CardTitle>
                <CardDescription>كل صوت في الكلمة مع شرحه</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.pronunciation.phoneticBreakdown.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                              <span className="text-white font-mono font-bold text-lg">
                                {item.sound}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {item.description}
                              </p>
                              <p className="text-violet-600 dark:text-violet-400 text-sm mt-1" dir="rtl">
                                {item.arabicDescription}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/20"
                            onClick={() => speak(item.sound, 'en-US', 0.5)}
                          >
                            <Volume2 className="w-3.5 h-3.5 ml-1" />
                            استمع للصوت
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Similar Words (Minimal Pairs) */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RefreshCw className="w-5 h-5 text-violet-500" />
                  كلمات مشابهة صوتياً
                </CardTitle>
                <CardDescription>كلمات قد يسهل الخلط بينها (Minimal Pairs)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.pronunciation.similarWords.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-gray-900 dark:text-white text-lg">
                          {result.word}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-violet-600 dark:text-violet-400 text-lg">
                          {item.word}
                        </span>
                      </div>
                      <Separator orientation="vertical" className="h-8 bg-violet-200 dark:bg-violet-800" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex-1" dir="rtl">
                        {item.difference}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-violet-500 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/20"
                        onClick={() => speak(`${result.word} ... ${item.word}`)}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Arabic Speaker Mistakes */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  أخطاء شائعة للمتحدثين بالعربية
                </CardTitle>
                <CardDescription>الأخطاء التي قد ترتكبها وكيفية تصحيحها</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.pronunciation.arabicSpeakerMistakes.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <Card className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                        <CardContent className="p-4 space-y-3">
                          {/* Mistake */}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0 mt-0.5">
                              <X className="w-4 h-4 text-rose-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">الخطأ</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{item.mistake}</p>
                              <p className="text-sm text-rose-600 dark:text-rose-400 font-medium mt-0.5" dir="rtl">
                                {item.mistakeAr}
                              </p>
                            </div>
                          </div>
                          <Separator className="bg-amber-200 dark:bg-amber-800/50" />
                          {/* Correction */}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">التصحيح</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{item.correction}</p>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-0.5" dir="rtl">
                                {item.correctionAr}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Practice Sentences */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-violet-500" />
                  جمل تدريبية
                </CardTitle>
                <CardDescription>تدرب على نطق الكلمة في سياق جمل مفيدة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.pronunciation.practiceSentences.map((sentence, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50 hover:shadow-md transition-shadow group"
                    >
                      <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-sm font-bold shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-gray-800 dark:text-gray-200 flex-1" dir="ltr" style={{ textAlign: 'left' }}>
                        {sentence}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-violet-500 opacity-60 group-hover:opacity-100 transition-opacity hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/20"
                        onClick={() => speak(sentence, 'en-US', 0.7)}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tongue Position */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mic className="w-5 h-5 text-violet-500" />
                  موضع اللسان والشفاه
                </CardTitle>
                <CardDescription>شرح تفصيلي لكيفية نطق الكلمة</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 border border-violet-100 dark:border-violet-800/50"
                >
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base" dir="rtl">
                    {result.pronunciation.tonguePosition}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-violet-200 dark:border-violet-800 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                      onClick={() => speak(result.word, 'en-US', 0.5)}
                    >
                      <Volume2 className="w-4 h-4 ml-1" />
                      نطق بطيء
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-violet-200 dark:border-violet-800 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                      onClick={() => speak(result.word, 'en-US', 1.0)}
                    >
                      <Volume2 className="w-4 h-4 ml-1" />
                      نطق عادي
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!result && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                <Headphones className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                مدرب النطق بالذكاء الاصطناعي
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                أدخل أي كلمة إنجليزية وسنقدم لك تحليلاً شاملاً للنطق مع الأخطاء الشائعة للمتحدثين بالعربية
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['thought', 'schedule', 'comfortable', 'island'].map((word) => (
                  <Button
                    key={word}
                    variant="outline"
                    size="sm"
                    className="border-violet-200 dark:border-violet-800 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    onClick={() => {
                      setSearchWord(word)
                      handleSearch(word)
                    }}
                  >
                    {word}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="w-5 h-5 text-violet-500" />
                  سجل البحث
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setHistory([])}
                >
                  مسح السجل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-32">
                <div className="flex flex-wrap gap-2">
                  {history.map((word, index) => (
                    <motion.button
                      key={`${word}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                        "hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-400",
                        result?.word.toLowerCase() === word.toLowerCase() && "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
                      )}
                      onClick={() => {
                        setSearchWord(word)
                        handleSearch(word)
                      }}
                      disabled={isLoading}
                    >
                      {word}
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
