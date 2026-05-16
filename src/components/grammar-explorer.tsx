'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Search, Sparkles, RefreshCw, Volume2,
  ChevronDown, ChevronUp, Lightbulb, GraduationCap, BookMarked,
  Flame, Zap, Trophy, AlertCircle, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSpellCheck } from '@/hooks/use-spell-check'

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

interface GrammarExplorerProps {
  currentUserId?: string
}

// Difficulty config
const difficultyConfig = {
  beginner: {
    label: 'مبتدئ',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: GraduationCap,
    border: 'border-emerald-200 dark:border-emerald-800',
    accent: 'from-emerald-500 to-teal-500',
  },
  intermediate: {
    label: 'متوسط',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    icon: Zap,
    border: 'border-amber-200 dark:border-amber-800',
    accent: 'from-amber-500 to-orange-500',
  },
  advanced: {
    label: 'متقدم',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    icon: Trophy,
    border: 'border-rose-200 dark:border-rose-800',
    accent: 'from-rose-500 to-pink-500',
  },
}

const suggestionWords = ['go', 'take', 'make', 'have', 'get', 'think', 'know', 'work', 'become', 'seem']

export function GrammarExplorer({ currentUserId }: GrammarExplorerProps) {
  const [word, setWord] = useState('')
  const [grammarStructures, setGrammarStructures] = useState<GrammarStructure[]>([])
  const [resultWord, setResultWord] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [hasSearched, setHasSearched] = useState(false)

  const { spellError, isChecking, checkWord, clearError } = useSpellCheck()

  const exploreGrammar = useCallback(async (searchWord?: string) => {
    const targetWord = searchWord || word.trim()
    if (!targetWord) {
      toast.error('الرجاء إدخال كلمة')
      return
    }

    // Spell check first
    clearError()
    const isValid = await checkWord(targetWord)
    if (!isValid) return

    setIsLoading(true)
    setHasSearched(true)
    try {
      const response = await fetch('/api/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to generate grammar structures')
      }

      const result = await response.json()

      if (!result.success || !result.data?.grammarStructures) {
        throw new Error('Invalid response')
      }

      setGrammarStructures(result.data.grammarStructures)
      setResultWord(result.data.word)

      // Auto-expand all cards
      setExpandedCards(new Set(result.data.grammarStructures.map((_: GrammarStructure, i: number) => i)))

      // Add to history
      if (!history.includes(targetWord.toLowerCase())) {
        setHistory(prev => [targetWord.toLowerCase(), ...prev].slice(0, 10))
      }

      toast.success('تم توليد التراكيب اللغوية بنجاح! 📖')
    } catch {
      toast.error('فشل في توليد التراكيب اللغوية')
    } finally {
      setIsLoading(false)
    }
  }, [word, history])

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setExpandedCards(new Set(grammarStructures.map((_, i) => i)))
  }

  const collapseAll = () => {
    setExpandedCards(new Set())
  }

  // Count by difficulty
  const difficultyCounts = {
    beginner: grammarStructures.filter(g => g.difficulty === 'beginner').length,
    intermediate: grammarStructures.filter(g => g.difficulty === 'intermediate').length,
    advanced: grammarStructures.filter(g => g.difficulty === 'advanced').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">التراكيب اللغوية</h2>
            <p className="text-gray-500 text-sm">اكتشف القواعد والتراكيب المرتبطة بأي كلمة إنجليزية</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          مدعوم بـ AI
        </Badge>
      </div>

      {/* Search Input */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={word}
                onChange={(e) => { setWord(e.target.value); clearError() }}
                onKeyDown={(e) => e.key === 'Enter' && exploreGrammar()}
                placeholder="أدخل كلمة بالإنجليزية... (مثل: go, take, make, have)"
                className={cn("pr-10 text-lg h-12", spellError && "border-rose-400 focus-visible:ring-rose-400")}
                dir="ltr"
                disabled={isLoading || isChecking}
              />
            </div>
            <Button
              onClick={() => exploreGrammar()}
              disabled={isLoading || !word.trim()}
              className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  استكشاف
                </>
              )}
            </Button>
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
                                setWord(suggestion)
                                clearError()
                                exploreGrammar(suggestion)
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

          {/* Quick word suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestionWords.map((w) => (
              <Badge
                key={w}
                variant="secondary"
                className="cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                onClick={() => {
                  setWord(w)
                  exploreGrammar(w)
                }}
              >
                {w}
              </Badge>
            ))}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 mb-2">سابقًا:</p>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h) => (
                  <Badge
                    key={h}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
                    onClick={() => {
                      setWord(h)
                      exploreGrammar(h)
                    }}
                  >
                    {h}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-200 dark:border-emerald-800" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <BookOpen className="absolute inset-0 m-auto w-8 h-8 text-emerald-500" />
            </div>
            <p className="mt-4 text-gray-500 animate-pulse">جاري تحليل التراكيب اللغوية...</p>
          </motion.div>
        )}

        {grammarStructures.length > 0 && !isLoading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Summary bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {resultWord}
                </span>
                <span className="text-gray-400">—</span>
                <span className="text-sm text-gray-500">
                  {grammarStructures.length} قاعدة لغوية
                </span>
                {/* Difficulty counts */}
                <div className="flex gap-1.5 mr-2">
                  {difficultyCounts.beginner > 0 && (
                    <Badge className={cn('text-xs', difficultyConfig.beginner.color)}>
                      {difficultyCounts.beginner} مبتدئ
                    </Badge>
                  )}
                  {difficultyCounts.intermediate > 0 && (
                    <Badge className={cn('text-xs', difficultyConfig.intermediate.color)}>
                      {difficultyCounts.intermediate} متوسط
                    </Badge>
                  )}
                  {difficultyCounts.advanced > 0 && (
                    <Badge className={cn('text-xs', difficultyConfig.advanced.color)}>
                      {difficultyCounts.advanced} متقدم
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  <ChevronDown className="w-4 h-4 ml-1" />
                  توسيع الكل
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  <ChevronUp className="w-4 h-4 ml-1" />
                  طي الكل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText(resultWord)}
                >
                  <Volume2 className="w-4 h-4 ml-1" />
                  نطق الكلمة
                </Button>
              </div>
            </div>

            {/* Grammar Cards */}
            <div className="space-y-4">
              {grammarStructures.map((grammar, index) => {
                const diffConfig = difficultyConfig[grammar.difficulty] || difficultyConfig.beginner
                const isExpanded = expandedCards.has(index)
                const DiffIcon = diffConfig.icon

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card className={cn(
                      'border-0 shadow-md overflow-hidden transition-all duration-300',
                      isExpanded && 'shadow-lg'
                    )}>
                      {/* Accent bar */}
                      <div className={cn('h-1.5 bg-gradient-to-r', diffConfig.accent)} />

                      {/* Card Header - always visible */}
                      <CardHeader
                        className="pb-3 pt-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => toggleCard(index)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={cn(
                              'p-2 rounded-lg shrink-0',
                              grammar.difficulty === 'beginner' && 'bg-emerald-100 dark:bg-emerald-900/30',
                              grammar.difficulty === 'intermediate' && 'bg-amber-100 dark:bg-amber-900/30',
                              grammar.difficulty === 'advanced' && 'bg-rose-100 dark:bg-rose-900/30',
                            )}>
                              <DiffIcon className={cn(
                                'w-5 h-5',
                                grammar.difficulty === 'beginner' && 'text-emerald-600 dark:text-emerald-400',
                                grammar.difficulty === 'intermediate' && 'text-amber-600 dark:text-amber-400',
                                grammar.difficulty === 'advanced' && 'text-rose-600 dark:text-rose-400',
                              )} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base leading-snug">
                                {grammar.title}
                              </CardTitle>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-arabic">
                                {grammar.titleAr}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={cn('text-xs', diffConfig.color)}>
                              {diffConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <BookMarked className="w-3 h-3 ml-1" />
                              {grammar.category}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {/* Expandable Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <CardContent className="pt-0 pb-4 space-y-4">
                              {/* Explanation */}
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800/50">
                                <div className="flex items-center gap-2 mb-2">
                                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">الشرح</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-arabic">
                                  {grammar.explanation}
                                </p>
                              </div>

                              {/* Examples */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                  أمثلة تطبيقية
                                </h4>
                                <div className="space-y-2">
                                  {grammar.examples.map((example, exIdx) => (
                                    <div
                                      key={exIdx}
                                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 group"
                                    >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          speakText(example.en)
                                        }}
                                      >
                                        <Volume2 className="w-4 h-4" />
                                      </Button>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-gray-900 dark:text-white font-medium" dir="ltr">
                                          {example.en}
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 font-arabic">
                                          {example.ar}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Tips */}
                              {grammar.tips && grammar.tips.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    نصائح مفيدة
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {grammar.tips.map((tip, tipIdx) => (
                                      <div
                                        key={tipIdx}
                                        className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/30"
                                      >
                                        <span className="text-amber-500 mt-0.5 shrink-0">💡</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300" dir="ltr">
                                          {tip}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {!hasSearched && !isLoading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <BookOpen className="w-20 h-20 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500 mb-2">استكشف التراكيب اللغوية</h3>
            <p className="text-gray-400 dark:text-gray-600 max-w-md mx-auto">
              اكتب أي كلمة إنجليزية وسيحلل الذكاء الاصطناعي القواعد والتراكيب اللغوية المرتبطة بها، مع أمثلة تطبيقية ونصائح مفيدة
            </p>
          </motion.div>
        )}

        {hasSearched && grammarStructures.length === 0 && !isLoading && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500 mb-2">لم يتم العثور على نتائج</h3>
            <p className="text-gray-400 dark:text-gray-600">
              جرّب كلمة أخرى أو تحقق من الإملاء
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
