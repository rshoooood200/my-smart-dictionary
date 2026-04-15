'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Timer, Play, Pause, Square, SkipForward, RotateCcw,
  Target, Zap, Coffee, Sun, Moon, Volume2, VolumeX,
  Settings, ChevronDown, ChevronUp, Award, TrendingUp,
  BookOpen, Brain, Lightbulb, Star, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useVocabStore, type Word } from '@/store/vocab-store'

// أنماط المؤقت
type TimerMode = 'pomodoro' | 'stopwatch' | 'countdown'
type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'

// إعدادات بومودورو
const POMODORO_SETTINGS = {
  work: 25, // دقائق
  shortBreak: 5,
  longBreak: 15,
  sessions: 4 // عدد جلسات العمل قبل الاستراحة الطويلة
}

export function FocusMode() {
  const { words, getWordsForReview } = useVocabStore()

  // refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  // حالة المؤقت
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro')
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(POMODORO_SETTINGS.work * 60)
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work')
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalFocusTime, setTotalFocusTime] = useState(0) // بالثواني
  
  // حالة وضع التركيز
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [focusWords, setFocusWords] = useState<Word[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 })
  
  // حالة الكلمة اليومية - حسابها باستخدام useMemo
  const dailyWord = useMemo(() => {
    if (words.length === 0) return null
    const today = new Date().toDateString()
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const index = seed % words.length
    return words[index]
  }, [words])

  // بدء جلسة تركيز
  const startFocusSession = useCallback((type: 'review' | 'learn' | 'practice') => {
    let selectedWords: Word[] = []
    
    if (type === 'review') {
      selectedWords = getWordsForReview('need-review', 20)
    } else if (type === 'learn') {
      selectedWords = words.filter(w => !w.isLearned).slice(0, 20)
    } else {
      selectedWords = [...words].sort(() => Math.random() - 0.5).slice(0, 20)
    }
    
    if (selectedWords.length === 0) {
      toast.error('لا توجد كلمات كافية')
      return
    }
    
    setFocusWords(selectedWords)
    setCurrentWordIndex(0)
    setShowAnswer(false)
    setSessionStats({ correct: 0, wrong: 0 })
    setIsFocusMode(true)
    setIsRunning(true)
    startTimeRef.current = Date.now()
  }, [getWordsForReview, words])

  // إنهاء جلسة التركيز
  const endFocusSession = useCallback(() => {
    setIsFocusMode(false)
    setIsRunning(false)
    setFocusWords([])
    
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    setTotalFocusTime(prev => prev + duration)
    
    toast.success(`انتهت الجلسة! النتيجة: ${sessionStats.correct}/${sessionStats.correct + sessionStats.wrong}`)
  }, [sessionStats])

  // تشغيل صوت التنبيه
  const playNotificationSound = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Time is up!')
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // عند اكتمال المؤقت (معرف قبل الاستخدام)
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)
    
    if (timerMode === 'pomodoro') {
      if (pomodoroPhase === 'work') {
        const newSessions = completedSessions + 1
        setCompletedSessions(newSessions)
        
        // تشغيل صوت
        playNotificationSound()
        
        if (newSessions % POMODORO_SETTINGS.sessions === 0) {
          // استراحة طويلة
          setPomodoroPhase('longBreak')
          setSeconds(POMODORO_SETTINGS.longBreak * 60)
          toast.success('وقت الاستراحة الطويلة! 🎉')
        } else {
          // استراحة قصيرة
          setPomodoroPhase('shortBreak')
          setSeconds(POMODORO_SETTINGS.shortBreak * 60)
          toast.success('وقت الاستراحة! ☕')
        }
      } else {
        // انتهاء الاستراحة
        setPomodoroPhase('work')
        setSeconds(POMODORO_SETTINGS.work * 60)
        toast.info('حان وقت العمل! 💪')
      }
    }
  }, [timerMode, pomodoroPhase, completedSessions, playNotificationSound])

  // منطق المؤقت
  useEffect(() => {
    if (isRunning && !isFocusMode) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (timerMode === 'stopwatch') {
            return prev + 1
          } else {
            if (prev <= 1) {
              // انتهى الوقت
              handleTimerComplete()
              return prev
            }
            return prev - 1
          }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isFocusMode, timerMode, handleTimerComplete])

  // تنسيق الوقت
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    if (timerMode === 'stopwatch' && hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // تبديل المؤقت
  const toggleTimer = () => {
    setIsRunning(!isRunning)
    if (!isRunning && timerMode === 'stopwatch' && seconds === 0) {
      setSeconds(0)
    }
  }

  // إعادة تعيين المؤقت
  const resetTimer = () => {
    setIsRunning(false)
    if (timerMode === 'pomodoro') {
      setPomodoroPhase('work')
      setSeconds(POMODORO_SETTINGS.work * 60)
    } else {
      setSeconds(0)
    }
  }

  // تخطي المرحلة (لـ Pomodoro)
  const skipPhase = () => {
    handleTimerComplete()
  }

  // الإجابة على كلمة في وضع التركيز
  const answerWord = (correct: boolean) => {
    if (correct) {
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }))
      toast.success('صحيح! ✓')
    } else {
      setSessionStats(prev => ({ ...prev, wrong: prev.wrong + 1 }))
      toast.error('خطأ! ✗')
    }
    
    if (currentWordIndex < focusWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
      setShowAnswer(false)
    } else {
      endFocusSession()
    }
  }

  // حساب التقدم
  const progressPercent = timerMode === 'pomodoro'
    ? ((POMODORO_SETTINGS[pomodoroPhase] * 60 - seconds) / (POMODORO_SETTINGS[pomodoroPhase] * 60)) * 100
    : timerMode === 'countdown'
      ? 0
      : Math.min((seconds / 3600) * 100, 100)

  return (
    <div className="space-y-4">
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(dailyWord.word)
                    utterance.lang = 'en-US'
                    window.speechSynthesis.speak(utterance)
                  }
                }}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="timer">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer">
            <Timer className="w-4 h-4 mr-1" />
            المؤقت
          </TabsTrigger>
          <TabsTrigger value="focus">
            <Target className="w-4 h-4 mr-1" />
            وضع التركيز
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-1" />
            الإحصائيات
          </TabsTrigger>
        </TabsList>

        {/* تبويب المؤقت */}
        <TabsContent value="timer" className="space-y-4 mt-4">
          {/* اختيار نوع المؤقت */}
          <div className="flex gap-2 justify-center">
            {[
              { id: 'pomodoro', label: 'بومودورو', icon: Zap },
              { id: 'stopwatch', label: 'ساعة إيقاف', icon: Clock },
            ].map((mode) => (
              <Button
                key={mode.id}
                variant={timerMode === mode.id ? 'default' : 'outline'}
                onClick={() => {
                  setTimerMode(mode.id as TimerMode)
                  resetTimer()
                }}
              >
                <mode.icon className="w-4 h-4 mr-2" />
                {mode.label}
              </Button>
            ))}
          </div>

          {/* المؤقت */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 flex flex-col items-center">
              {/* Timer Display */}
              <div className="relative">
                <div className={cn(
                  "w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br shadow-2xl",
                  pomodoroPhase === 'work' && "from-violet-500 to-purple-600",
                  pomodoroPhase === 'shortBreak' && "from-emerald-500 to-teal-600",
                  pomodoroPhase === 'longBreak' && "from-amber-500 to-orange-600",
                  timerMode === 'stopwatch' && "from-cyan-500 to-blue-600"
                )}>
                  <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-bold font-mono">
                        {formatTime(seconds)}
                      </div>
                      {timerMode === 'pomodoro' && (
                        <Badge className={cn(
                          "mt-2",
                          pomodoroPhase === 'work' && "bg-violet-100 text-violet-700",
                          pomodoroPhase === 'shortBreak' && "bg-emerald-100 text-emerald-700",
                          pomodoroPhase === 'longBreak' && "bg-amber-100 text-amber-700"
                        )}>
                          {pomodoroPhase === 'work' ? 'عمل' : pomodoroPhase === 'shortBreak' ? 'استراحة قصيرة' : 'استراحة طويلة'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* شريط التقدم الدائري */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${progressPercent * 3.02} 301.59`}
                    className={cn(
                      "transition-all duration-1000",
                      pomodoroPhase === 'work' && "text-violet-500",
                      pomodoroPhase === 'shortBreak' && "text-emerald-500",
                      pomodoroPhase === 'longBreak' && "text-amber-500",
                      timerMode === 'stopwatch' && "text-cyan-500"
                    )}
                  />
                </svg>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetTimer}
                  className="w-12 h-12"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={toggleTimer}
                  className={cn(
                    "w-16 h-16 rounded-full",
                    isRunning
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-violet-600 hover:bg-violet-700"
                  )}
                >
                  {isRunning ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 mr-[-4px]" />
                  )}
                </Button>
                
                {timerMode === 'pomodoro' && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={skipPhase}
                    className="w-12 h-12"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* جلسات بومودورو */}
              {timerMode === 'pomodoro' && (
                <div className="mt-6 flex items-center gap-2">
                  {Array.from({ length: POMODORO_SETTINGS.sessions }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-3 h-3 rounded-full",
                        i < completedSessions % POMODORO_SETTINGS.sessions
                          ? "bg-violet-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      )}
                    />
                  ))}
                  <span className="text-sm text-gray-500 mr-2">
                    {completedSessions} جلسات مكتملة
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* معلومات بومودورو */}
          {timerMode === 'pomodoro' && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-violet-600">{POMODORO_SETTINGS.work}</div>
                    <div className="text-xs text-gray-500">دقيقة عمل</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{POMODORO_SETTINGS.shortBreak}</div>
                    <div className="text-xs text-gray-500">دقيقة راحة</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{POMODORO_SETTINGS.longBreak}</div>
                    <div className="text-xs text-gray-500">دقيقة راحة طويلة</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب وضع التركيز */}
        <TabsContent value="focus" className="space-y-4 mt-4">
          {isFocusMode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[60vh]"
            >
              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                  {/* شريط التقدم */}
                  <div className="w-full mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>الكلمة {currentWordIndex + 1} من {focusWords.length}</span>
                      <span>{sessionStats.correct} ✓ / {sessionStats.wrong} ✗</span>
                    </div>
                    <Progress value={((currentWordIndex + 1) / focusWords.length) * 100} />
                  </div>

                  {/* الكلمة الحالية */}
                  {focusWords[currentWordIndex] && (
                    <div className="text-center mb-8">
                      <motion.div
                        key={currentWordIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4"
                      >
                        <h2 className="text-4xl font-bold mb-2">
                          {focusWords[currentWordIndex].word}
                        </h2>
                        {showAnswer && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xl text-gray-600"
                          >
                            {focusWords[currentWordIndex].translation}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>
                  )}

                  {/* الأزرار */}
                  {!showAnswer ? (
                    <Button
                      size="lg"
                      onClick={() => setShowAnswer(true)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Lightbulb className="w-5 h-5 mr-2" />
                      إظهار الإجابة
                    </Button>
                  ) : (
                    <div className="flex gap-4">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => answerWord(false)}
                        className="border-rose-500 text-rose-500 hover:bg-rose-50"
                      >
                        <X className="w-5 h-5 mr-2" />
                        خطأ
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => answerWord(true)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        صحيح
                      </Button>
                    </div>
                  )}

                  {/* زر إنهاء */}
                  <Button
                    variant="ghost"
                    onClick={endFocusSession}
                    className="mt-8 text-gray-500"
                  >
                    إنهاء الجلسة
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  type: 'review',
                  title: 'مراجعة',
                  description: 'راجع الكلمات المستحقة',
                  icon: Brain,
                  color: 'from-violet-500 to-purple-600'
                },
                {
                  type: 'learn',
                  title: 'تعلم',
                  description: 'تعلم كلمات جديدة',
                  icon: BookOpen,
                  color: 'from-emerald-500 to-teal-600'
                },
                {
                  type: 'practice',
                  title: 'ممارسة',
                  description: 'تدرب على الكلمات عشوائياً',
                  icon: Target,
                  color: 'from-amber-500 to-orange-600'
                },
              ].map((session) => (
                <Card
                  key={session.type}
                  className="cursor-pointer hover:shadow-xl transition-all border-0"
                  onClick={() => startFocusSession(session.type as 'review' | 'learn' | 'practice')}
                >
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-br ${session.color} p-8 text-center text-white rounded-lg`}>
                      <session.icon className="w-12 h-12 mx-auto mb-3 opacity-80" />
                      <h3 className="text-xl font-bold mb-1">{session.title}</h3>
                      <p className="text-sm opacity-80">{session.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* تبويب الإحصائيات */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <Timer className="w-8 h-8 mx-auto mb-2 text-violet-500" />
                <div className="text-2xl font-bold">{formatTime(totalFocusTime)}</div>
                <div className="text-xs text-gray-500">وقت التركيز</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <div className="text-2xl font-bold">{completedSessions}</div>
                <div className="text-xs text-gray-500">جلسات بومودورو</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <div className="text-2xl font-bold">{sessionStats.correct}</div>
                <div className="text-xs text-gray-500">إجابات صحيحة</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                <div className="text-2xl font-bold">
                  {sessionStats.correct + sessionStats.wrong > 0
                    ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-gray-500">نسبة النجاح</div>
              </CardContent>
            </Card>
          </div>

          {/* نصائح */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">نصيحة للتركيز</h4>
                  <p className="text-white/90 text-sm">
                    استخدم تقنية بومودورو: 25 دقيقة عمل، ثم 5 دقائق راحة. بعد 4 جلسات، خذ استراحة طويلة 15 دقيقة.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// إضافة مكون X للأيقونة
function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

// إضافة مكون Check للأيقونة
function Check({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
