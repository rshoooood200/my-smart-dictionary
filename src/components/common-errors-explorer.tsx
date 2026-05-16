'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Search, Sparkles, RefreshCw, X, Check,
  BookOpen, Lightbulb, History, ChevronLeft, Volume2,
  SpellCheck, Type, ArrowRightLeft, MessageCircle, Mic, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSpellCheck } from '@/hooks/use-spell-check'

interface CommonError {
  errorType: string
  errorTypeAr: string
  description: string
  wrongUsage: string
  correctUsage: string
  explanation: string
  tip: string
}

interface CommonErrorsData {
  word: string
  commonErrors: CommonError[]
}

// Error type color mapping
const errorTypeConfig: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  'Spelling': { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700', icon: SpellCheck },
  'Grammar': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700', icon: Type },
  'Preposition': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700', icon: ArrowRightLeft },
  'Confusion': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700', icon: MessageCircle },
  'Pronunciation': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700', icon: Mic },
}

const suggestionWords = [
  'accommodate', 'beginner', 'committee', 'different', 'embarrass',
  'foreign', 'government', 'happen', 'immediate', 'knowledge',
  'necessary', 'occurrence', 'prejudice', 'questionnaire', 'receive',
  'separate', 'tomorrow', 'until', 'weird', 'their'
]

export function CommonErrorsExplorer() {
  const [word, setWord] = useState('')
  const [errorsData, setErrorsData] = useState<CommonErrorsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [expandedTip, setExpandedTip] = useState<number | null>(null)

  const { spellError, isChecking, checkWord, clearError } = useSpellCheck()

  const fetchErrors = useCallback(async (searchWord?: string) => {
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
    setErrorsData(null)
    setExpandedTip(null)

    try {
      const response = await fetch('/api/common-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في جلب الأخطاء الشائعة')
      }

      const result = await response.json()
      if (result.success && result.data) {
        setErrorsData(result.data)

        // Add to history
        if (!history.includes(targetWord.toLowerCase())) {
          setHistory(prev => [targetWord.toLowerCase(), ...prev].slice(0, 10))
        }

        toast.success(`تم العثور على ${result.data.commonErrors.length} خطأ شائع 📝`)
      } else {
        throw new Error(result.error || 'فشل في جلب البيانات')
      }
    } catch (error: any) {
      toast.error(error.message || 'فشل في الحصول على الأخطاء الشائعة')
    } finally {
      setIsLoading(false)
    }
  }, [word, history])

  const speakWord = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الأخطاء الشائعة</h2>
            <p className="text-gray-500 text-sm">اكتشف الأخطاء التي يرتكبها المتعلمون العرب عند استخدام الكلمة</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1 border-amber-300 dark:border-amber-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
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
                onKeyDown={(e) => e.key === 'Enter' && fetchErrors()}
                placeholder="أدخل كلمة بالإنجليزية... (مثل: accommodate, different)"
                className={cn("pr-10 text-lg h-12", spellError && "border-rose-400 focus-visible:ring-rose-400")}
                dir="ltr"
                disabled={isLoading || isChecking}
              />
            </div>
            <Button
              onClick={() => fetchErrors()}
              disabled={isLoading || !word.trim()}
              className="h-12 px-6 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  تحليل
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
                                fetchErrors(suggestion)
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

          {/* Quick suggestion words */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">كلمات مقترحة للتجربة:</p>
            <div className="flex flex-wrap gap-2">
              {suggestionWords.slice(0, 8).map((w) => (
                <Badge
                  key={w}
                  variant="secondary"
                  className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  onClick={() => {
                    setWord(w)
                    fetchErrors(w)
                  }}
                >
                  {w}
                </Badge>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs text-gray-500">سابقًا:</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h) => (
                  <Badge
                    key={h}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
                    onClick={() => {
                      setWord(h)
                      fetchErrors(h)
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
              <div className="w-20 h-20 rounded-full border-4 border-amber-200 dark:border-amber-800" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              <AlertTriangle className="absolute inset-0 m-auto w-8 h-8 text-amber-500" />
            </div>
            <p className="mt-4 text-gray-500 animate-pulse">جاري تحليل الأخطاء الشائعة...</p>
            <p className="mt-1 text-sm text-gray-400">يبحث الذكاء الاصطناعي عن الأخطاء النموذجية</p>
          </motion.div>
        )}

        {errorsData && !isLoading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Word header */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm mb-1">الأخطاء الشائعة لكلمة</p>
                    <h3 className="text-3xl font-bold text-white">{errorsData.word}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => speakWord(errorsData.word)}
                    >
                      <Volume2 className="w-5 h-5 ml-1" />
                      استمع
                    </Button>
                    <Badge className="bg-white/20 text-white border-0 text-sm px-3 py-1">
                      {errorsData.commonErrors.length} خطأ شائع
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Error type summary */}
            <div className="flex flex-wrap gap-2">
              {(() => {
                const typeCounts: Record<string, number> = {}
                errorsData.commonErrors.forEach((err) => {
                  typeCounts[err.errorType] = (typeCounts[err.errorType] || 0) + 1
                })
                return Object.entries(typeCounts).map(([type, count]) => {
                  const config = errorTypeConfig[type]
                  const Icon = config?.icon || AlertTriangle
                  return (
                    <Badge
                      key={type}
                      variant="outline"
                      className={cn('gap-1.5 px-3 py-1.5', config?.border, config?.text)}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {config ? (
                        <span>
                          {errorsData.commonErrors.find(e => e.errorType === type)?.errorTypeAr}
                        </span>
                      ) : type}
                      <span className="font-bold">({count})</span>
                    </Badge>
                  )
                })
              })()}
            </div>

            {/* Error cards */}
            <div className="space-y-4">
              {errorsData.commonErrors.map((error, index) => {
                const config = errorTypeConfig[error.errorType] || errorTypeConfig['Grammar']
                const Icon = config?.icon || AlertTriangle
                const isTipExpanded = expandedTip === index

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Error type bar */}
                      <div className={cn('h-1.5', `bg-gradient-to-r from-amber-500 to-orange-500`)} />

                      <CardContent className="p-4 sm:p-6">
                        {/* Error header */}
                        <div className="flex items-start gap-3 mb-4">
                          <div className={cn('p-2 rounded-lg shrink-0', config.bg)}>
                            <Icon className={cn('w-5 h-5', config.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={cn('text-xs', config.bg, config.text, 'border-0')}>
                                {error.errorTypeAr}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-gray-500">
                                {error.errorType}
                              </Badge>
                            </div>
                            <p className="mt-2 text-gray-900 dark:text-white font-medium leading-relaxed">
                              {error.description}
                            </p>
                          </div>
                        </div>

                        {/* Wrong vs Correct */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Wrong usage */}
                          <div className="rounded-xl p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                                <X className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">خطأ</span>
                            </div>
                            <p className="text-rose-900 dark:text-rose-100 font-mono text-sm leading-relaxed" dir="ltr">
                              {error.wrongUsage}
                            </p>
                          </div>

                          {/* Correct usage */}
                          <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">صحيح</span>
                            </div>
                            <p className="text-emerald-900 dark:text-emerald-100 font-mono text-sm leading-relaxed" dir="ltr">
                              {error.correctUsage}
                            </p>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {error.explanation}
                            </p>
                          </div>
                        </div>

                        {/* Tip */}
                        {error.tip && (
                          <div className="mt-3">
                            <button
                              onClick={() => setExpandedTip(isTipExpanded ? null : index)}
                              className="w-full text-right"
                            >
                              <div className={cn(
                                'p-3 rounded-lg transition-all',
                                isTipExpanded
                                  ? 'bg-amber-50 dark:bg-amber-950/30'
                                  : 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              )}>
                                <div className="flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                    نصيحة سريعة
                                  </span>
                                  <ChevronLeft className={cn(
                                    'w-4 h-4 text-amber-500 transition-transform mr-auto',
                                    isTipExpanded && '-rotate-90'
                                  )} />
                                </div>
                                <AnimatePresence>
                                  {isTipExpanded && (
                                    <motion.p
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="text-sm text-amber-800 dark:text-amber-200 mt-2 leading-relaxed overflow-hidden"
                                    >
                                      {error.tip}
                                    </motion.p>
                                  )}
                                </AnimatePresence>
                              </div>
                            </button>
                          </div>
                        )}

                        {/* Separator between errors */}
                        {index < errorsData.commonErrors.length - 1 && (
                          <Separator className="mt-4 opacity-0" />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Summary card */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-200">خلاصة</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      تم العثور على {errorsData.commonErrors.length} أخطاء شائعة يرتكبها المتعلمون العرب عند استخدام كلمة &quot;{errorsData.word}&quot;
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!errorsData && !isLoading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <AlertTriangle className="w-20 h-20 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500 mb-2">اكتشف أخطاءك الشائعة</h3>
            <p className="text-gray-400 dark:text-gray-600 max-w-md mx-auto">
              أدخل أي كلمة إنجليزية وسيحلل الذكاء الاصطناعي الأخطاء الشائعة التي يرتكبها المتعلمون العرب، بما في ذلك الأخطاء الإملائية والنحوية وحروف الجر والخلط بين الكلمات وأخطاء النطق
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
