'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Clock, Star, Zap, Target, Medal, Crown,
  ChevronRight, RefreshCw, Check, X, Timer, Flame,
  Calendar, Award, TrendingUp, Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Word } from '@/store/vocab-store'

// أنواع التحديات
type ChallengeType = 'daily' | 'weekly' | 'speed' | 'survival'

interface ChallengeResult {
  score: number
  correct: number
  total: number
  time: number
  date: Date
}

interface DailyChallengeProps {
  words: Word[]
  onComplete: (result: ChallengeResult) => void
  currentUserId: string
}

// أسئلة التحدي
interface ChallengeQuestion {
  word: Word
  type: 'translate' | 'reverse' | 'spelling' | 'listening'
  options?: string[]
  correctAnswer: string
}

export function DailyChallenge({ words, onComplete, currentUserId }: DailyChallengeProps) {
  const [challengeType, setChallengeType] = useState<ChallengeType>('daily')
  const [isActive, setIsActive] = useState(false)
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  
  // أفضل النتائج (محاكاة - في التطبيق الحقيقي ستكون من قاعدة البيانات)
  const [leaderboard] = useState([
    { rank: 1, name: 'أحمد', score: 950, avatar: '👨' },
    { rank: 2, name: 'سارة', score: 880, avatar: '👩' },
    { rank: 3, name: 'محمد', score: 820, avatar: '👨' },
    { rank: 4, name: 'فاطمة', score: 750, avatar: '👩' },
    { rank: 5, name: 'عمر', score: 700, avatar: '👨' },
  ])
  
  // إعدادات كل نوع تحدي
  const challengeConfig = {
    daily: { name: 'التحدي اليومي', time: 60, questions: 10, xp: 100, icon: Calendar, color: 'violet' },
    weekly: { name: 'التحدي الأسبوعي', time: 120, questions: 20, xp: 250, icon: Trophy, color: 'amber' },
    speed: { name: 'تحدي السرعة', time: 30, questions: 15, xp: 150, icon: Timer, color: 'rose' },
    survival: { name: 'البقاء', time: 0, questions: 999, xp: 200, icon: Flame, color: 'orange' },
  }
  
  // توليد أسئلة التحدي
  const generateQuestions = useCallback((type: ChallengeType) => {
    if (words.length < 4) {
      toast.error('تحتاج على الأقل 4 كلمات للتحدي')
      return []
    }
    
    const config = challengeConfig[type]
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    const selectedWords = shuffled.slice(0, config.questions)
    const questionTypes: ChallengeQuestion['type'][] = ['translate', 'reverse', 'spelling', 'listening']
    
    const generatedQuestions: ChallengeQuestion[] = selectedWords.map(word => {
      const qType = questionTypes[Math.floor(Math.random() * questionTypes.length)]
      
      if (qType === 'translate' || qType === 'reverse') {
        const otherWords = shuffled.filter(w => w.id !== word.id).slice(0, 3)
        const options = [word.translation, ...otherWords.map(w => w.translation)]
          .sort(() => Math.random() - 0.5)
        
        return {
          word,
          type: qType,
          options,
          correctAnswer: word.translation
        }
      } else {
        return {
          word,
          type: qType,
          correctAnswer: word.word
        }
      }
    })
    
    return generatedQuestions
  }, [words])
  
  // بدء التحدي
  const startChallenge = useCallback((type: ChallengeType) => {
    const generatedQuestions = generateQuestions(type)
    if (generatedQuestions.length === 0) return
    
    setChallengeType(type)
    setQuestions(generatedQuestions)
    setCurrentIndex(0)
    setScore(0)
    setCorrectCount(0)
    setTimeLeft(challengeConfig[type].time)
    setIsActive(true)
    setIsFinished(false)
    setSelectedAnswer(null)
    setShowResult(false)
    setStartTime(Date.now())
  }, [generateQuestions])
  
  // المؤقت
  useEffect(() => {
    if (!isActive || isFinished || timeLeft === 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isActive, isFinished, timeLeft])
  
  // الإجابة على سؤال
  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer) return
    
    const currentQuestion = questions[currentIndex]
    const isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
    
    setSelectedAnswer(answer)
    setShowResult(true)
    
    if (isCorrect) {
      const timeBonus = challengeType === 'speed' ? Math.floor(timeLeft / 2) : 0
      const points = 10 + timeBonus
      setScore(prev => prev + points)
      setCorrectCount(prev => prev + 1)
      toast.success(`+${points} نقطة!`, { duration: 1000 })
    } else {
      toast.error('إجابة خاطئة!', { duration: 1000 })
    }
    
    // الانتقال للسؤال التالي
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        setIsFinished(true)
      }
    }, 1000)
  }, [selectedAnswer, questions, currentIndex, challengeType, timeLeft])
  
  // عند الانتهاء
  useEffect(() => {
    if (isFinished && isActive) {
      const result: ChallengeResult = {
        score,
        correct: correctCount,
        total: questions.length,
        time: Date.now() - startTime,
        date: new Date()
      }
      onComplete(result)
    }
  }, [isFinished, isActive, score, correctCount, questions.length, startTime, onComplete])
  
  // عرض شاشة النتائج
  if (isFinished) {
    const config = challengeConfig[challengeType]
    const accuracy = Math.round((correctCount / questions.length) * 100)
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
          <CardContent className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
            >
              <Trophy className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-2">انتهى التحدي!</h2>
            <p className="text-gray-500 mb-6">{config.name}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                <p className="text-2xl font-bold text-violet-600">{score}</p>
                <p className="text-xs text-gray-500">النقاط</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{correctCount}/{questions.length}</p>
                <p className="text-xs text-gray-500">صحيح</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-2xl font-bold text-amber-600">{accuracy}%</p>
                <p className="text-xs text-gray-500">الدقة</p>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl mb-6">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-violet-600" />
                <span className="font-bold text-violet-700 dark:text-violet-400">
                  +{score + config.xp} XP
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsActive(false)}>
                العودة
              </Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={() => startChallenge(challengeType)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  // شاشة التحدي النشط
  if (isActive && questions.length > 0) {
    const config = challengeConfig[challengeType]
    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentIndex + 1}/{questions.length}</Badge>
                <Badge className="bg-violet-100 text-violet-700">
                  <Zap className="w-3 h-3 mr-1" />
                  {score}
                </Badge>
              </div>
              {config.time > 0 && (
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full font-mono font-bold",
                  timeLeft <= 10 ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-600"
                )}>
                  <Clock className="w-4 h-4" />
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
            <Progress value={progress} className="h-1 mt-2" />
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* نوع السؤال */}
                <Badge variant="secondary" className="mb-4">
                  {currentQuestion.type === 'translate' && 'ترجم الكلمة'}
                  {currentQuestion.type === 'reverse' && 'ما الكلمة الإنجليزية؟'}
                  {currentQuestion.type === 'spelling' && 'اكتب الكلمة'}
                  {currentQuestion.type === 'listening' && 'استمع واكتب'}
                </Badge>
                
                {/* السؤال */}
                <div className="text-center mb-6">
                  {currentQuestion.type === 'translate' && (
                    <>
                      <p className="text-sm text-gray-500 mb-2">ما ترجمة:</p>
                      <h2 className="text-3xl font-bold">{currentQuestion.word.word}</h2>
                    </>
                  )}
                  {currentQuestion.type === 'reverse' && (
                    <>
                      <p className="text-sm text-gray-500 mb-2">ما الكلمة الإنجليزية لـ:</p>
                      <h2 className="text-3xl font-bold">{currentQuestion.word.translation}</h2>
                    </>
                  )}
                  {currentQuestion.type === 'spelling' && (
                    <>
                      <p className="text-sm text-gray-500 mb-2">اكتب الكلمة الإنجليزية لـ:</p>
                      <h2 className="text-3xl font-bold">{currentQuestion.word.translation}</h2>
                      <p className="text-gray-400 mt-2">تلميح: {currentQuestion.word.word.length} حروف</p>
                    </>
                  )}
                  {currentQuestion.type === 'listening' && (
                    <>
                      <p className="text-sm text-gray-500 mb-2">استمع واكتب الكلمة:</p>
                      <Button variant="outline" size="lg" className="mt-2">
                        🔊 استمع
                      </Button>
                    </>
                  )}
                </div>
                
                {/* الخيارات */}
                {currentQuestion.options ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentQuestion.options.map((option, i) => (
                      <Button
                        key={i}
                        variant={selectedAnswer === option 
                          ? (option === currentQuestion.correctAnswer ? "default" : "destructive")
                          : "outline"
                        }
                        className={cn(
                          "h-14 text-lg",
                          showResult && option === currentQuestion.correctAnswer && "bg-emerald-500 hover:bg-emerald-600 text-white",
                          selectedAnswer === option && option !== currentQuestion.correctAnswer && "bg-rose-500 hover:bg-rose-600"
                        )}
                        onClick={() => handleAnswer(option)}
                        disabled={!!selectedAnswer}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full p-4 text-lg text-center border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="اكتب الإجابة..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAnswer((e.target as HTMLInputElement).value)
                        }
                      }}
                      disabled={!!selectedAnswer}
                    />
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                        handleAnswer(input?.value || '')
                      }}
                      disabled={!!selectedAnswer}
                    >
                      تأكيد
                    </Button>
                  </div>
                )}
                
                {/* النتيجة */}
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mt-4 p-3 rounded-xl flex items-center justify-center gap-2",
                      selectedAnswer === currentQuestion.correctAnswer
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <>
                        <Check className="w-5 h-5" />
                        صحيح!
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" />
                        الإجابة: {currentQuestion.correctAnswer}
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  // شاشة اختيار التحدي
  return (
    <div className="space-y-6">
      {/* التحدي اليومي المميز */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-white/20 text-white mb-2">
                <Calendar className="w-3 h-3 mr-1" />
                تحدي اليوم
              </Badge>
              <h2 className="text-2xl font-bold mb-1">تحدي اليوم</h2>
              <p className="text-white/80 text-sm mb-4">
                10 أسئلة • 60 ثانية • مكافأة 100 XP
              </p>
              <Button 
                className="bg-white text-violet-700 hover:bg-white/90"
                onClick={() => startChallenge('daily')}
              >
                <Target className="w-4 h-4 mr-2" />
                ابدأ التحدي
              </Button>
            </div>
            <div className="hidden sm:block">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="w-12 h-12" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* أنواع التحديات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['weekly', 'speed', 'survival'] as ChallengeType[]).map((type) => {
          const config = challengeConfig[type]
          const Icon = config.icon
          
          return (
            <Card 
              key={type}
              className="border-0 shadow-md cursor-pointer hover:shadow-xl transition-all"
              onClick={() => startChallenge(type)}
            >
              <CardContent className="p-4 text-center">
                <div className={cn(
                  "w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center",
                  `bg-${config.color}-100 dark:bg-${config.color}-900/30`
                )}>
                  <Icon className={cn("w-6 h-6", `text-${config.color}-600`)} />
                </div>
                <h3 className="font-bold mb-1">{config.name}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  {config.questions > 100 ? 'غير محدود' : `${config.questions} أسئلة`}
                  {config.time > 0 && ` • ${config.time} ثانية`}
                </p>
                <Badge variant="secondary">
                  <Zap className="w-3 h-3 mr-1" />
                  {config.xp} XP
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* لوحة المتصدرين */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Medal className="w-5 h-5 text-amber-500" />
            لوحة المتصدرين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((player, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  i === 0 && "bg-amber-50 dark:bg-amber-900/20",
                  i === 1 && "bg-gray-50 dark:bg-gray-800",
                  i === 2 && "bg-orange-50 dark:bg-orange-900/20"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                  i === 0 && "bg-amber-400 text-white",
                  i === 1 && "bg-gray-300 text-gray-700",
                  i === 2 && "bg-orange-400 text-white",
                  i > 2 && "bg-gray-200 text-gray-600"
                )}>
                  {i < 3 ? <Crown className="w-4 h-4" /> : player.rank}
                </div>
                <div className="text-2xl">{player.avatar}</div>
                <div className="flex-1">
                  <p className="font-medium">{player.name}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Trophy className="w-4 h-4" />
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
