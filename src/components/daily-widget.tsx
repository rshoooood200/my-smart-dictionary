'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Star, Volume2, RefreshCw,
  Clock, Brain, Target, Award, Sparkles, Heart,
  Zap, Plus
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useVocabStore, type Word } from '@/store/vocab-store'

interface DailyWidgetProps {
  words: Word[]
  onStartReview: (mode: 'need-review' | 'random') => void
  onAddWord: () => void
}

export function DailyWidget({ words, onStartReview, onAddWord }: DailyWidgetProps) {
  const { stats, getWordsForReview, toggleFavorite } = useVocabStore()
  
  const dailyGoal = { target: 20 }
  const [streakDays] = useState(() => {
    if (typeof window === 'undefined') return 0
    const saved = localStorage.getItem('streak-days')
    return saved ? parseInt(saved) || 0 : 0
  })
  const [weeklyProgress] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [0, 0, 0, 0, 0, 0, 0]
    const saved = localStorage.getItem('weekly-progress')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return [0, 0, 0, 0, 0, 0, 0]
      }
    }
    return [0, 0, 0, 0, 0, 0, 0]
  })

  const TIPS = useMemo(() => [
    'راجع الكلمات في نفس الوقت يومياً لتعزيز الذاكرة طويلة المدى.',
    'استخدم الكلمات الجديدة في جمل خاصة بك لتسهيل تذكرها.',
    'اربط الكلمات الجديدة بصور أو قصص لتسهيل الحفظ.',
    'اقرأ نصوصاً تحتوي على الكلمات التي تتعلمها.',
    'استمع للبودكاست أو الفيديوهات باللغة الإنجليزية.',
    'مارس الكتابة بالكلمات الجديدة.',
    'غيّر بيئة الدراسة بين الحين والآخر.',
    'استخدم تقنية التكرار المتباعد للمراجعة.',
    'علّم غيرك ما تعلمته - أفضل طريقة للتعلم!',
    'اجعل التعلم ممتعاً بالألعاب والتحديات.',
  ], [])

  // حساب الكلمة اليومية باستخدام useMemo
  const dailyWord = useMemo(() => {
    if (words.length === 0) return null
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    const index = seed % words.length
    return words[index]
  }, [words])

  // حساب النصيحة العشوائية باستخدام useMemo
  const dailyTip = useMemo(() => {
    const tipIndex = Math.floor(Math.random() * TIPS.length)
    return TIPS[tipIndex]
  }, [TIPS])

  // نطق الكلمة
  const speakWord = useCallback((word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // الحصول على كلمات للمراجعة
  const wordsForReview = getWordsForReview('need-review', 100)
  
  // حساب الإحصائيات
  const learnedToday = words.filter(w => {
    if (!w.lastReviewedAt) return false
    const reviewDate = new Date(w.lastReviewedAt).toDateString()
    return reviewDate === new Date().toDateString() && w.isLearned
  }).length

  return (
    <div className="space-y-4">
      {/* Widget الرئيسي */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* الكلمة اليومية */}
        {dailyWord && (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-2 bg-gradient-to-l from-amber-400 to-orange-500" />
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Star className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 mb-1">
                    كلمة اليوم
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{dailyWord.word}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-600">{dailyWord.translation}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => speakWord(dailyWord.word)}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleFavorite(dailyWord.id)}
                  >
                    <Heart className={cn(
                      "w-4 h-4",
                      dailyWord.isFavorite && "fill-rose-500 text-rose-500"
                    )} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* الهدف اليومي */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-l from-violet-400 to-purple-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Target className="w-6 h-6 text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">الهدف اليومي</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-violet-600">{learnedToday}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-500">{dailyGoal.target}</span>
                </div>
                <Progress 
                  value={(learnedToday / dailyGoal.target) * 100} 
                  className="h-2 mt-2"
                />
              </div>
              {learnedToday >= dailyGoal.target && (
                <Badge className="bg-emerald-100 text-emerald-700">
                  <Award className="w-3 h-3 mr-1" />
                  مكتمل!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* السلسلة والمراجعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* السلسلة */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                streakDays > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-gray-100 dark:bg-gray-800"
              )}>
                <Zap className={cn(
                  "w-6 h-6",
                  streakDays > 0 ? "text-amber-500" : "text-gray-400"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{streakDays}</span>
                  <span className="text-gray-500 text-sm">يوم متواصل</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* مراجعة سريعة */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                wordsForReview.length > 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"
              )}>
                <Brain className={cn(
                  "w-6 h-6",
                  wordsForReview.length > 0 ? "text-emerald-500" : "text-gray-400"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{wordsForReview.length}</span>
                  <span className="text-gray-500 text-sm">للمراجعة</span>
                </div>
              </div>
              {wordsForReview.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => onStartReview('need-review')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  ابدأ
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نصيحة اليوم */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-1">نصيحة اليوم</h4>
              <p className="text-white/90 text-sm">{dailyTip}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => {
                const newTip = TIPS[Math.floor(Math.random() * TIPS.length)]
                setDailyTip(newTip)
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* أزرار سريعة */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto py-3 flex-col gap-1"
          onClick={onAddWord}
        >
          <Plus className="w-5 h-5 text-emerald-500" />
          <span className="text-xs">إضافة كلمة</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-3 flex-col gap-1"
          onClick={() => onStartReview('random')}
        >
          <RefreshCw className="w-5 h-5 text-violet-500" />
          <span className="text-xs">مراجعة عشوائية</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-3 flex-col gap-1"
          onClick={() => {
            if (words.length > 0) {
              const randomWord = words[Math.floor(Math.random() * words.length)]
              speakWord(randomWord.word)
            }
          }}
        >
          <Volume2 className="w-5 h-5 text-amber-500" />
          <span className="text-xs">كلمة عشوائية</span>
        </Button>
      </div>
    </div>
  )
}
