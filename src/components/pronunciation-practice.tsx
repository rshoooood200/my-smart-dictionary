'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Square, Play, RotateCcw, Volume2, VolumeX,
  Check, X, AlertCircle, Award, TrendingUp, Target,
  Flame, Clock, Headphones, Settings, Info, ChevronRight,
  MicOff, Loader2, Sparkles, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useVocabStore, type Word } from '@/store/vocab-store'

interface PronunciationRecord {
  id: string
  word: string
  audioData: string
  duration: number
  transcription?: string
  accuracy: number
  phoneticScore: number
  intonationScore: number
  paceScore: number
  isCorrect: boolean
  createdAt: string
}

interface PronunciationStats {
  totalRecordings: number
  correctCount: number
  averageAccuracy: number
  wordsPracticed: number
  successRate: number
}

interface PronunciationPracticeProps {
  currentUserId?: string
}

export function PronunciationPractice({ currentUserId }: PronunciationPracticeProps) {
  const { words, stats } = useVocabStore()
  
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [practiceMode, setPracticeMode] = useState<'word' | 'sentence' | 'free'>('word')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [results, setResults] = useState<{
    accuracy: number
    phonetic: number
    intonation: number
    pace: number
    feedback: string[]
    isCorrect: boolean
  } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [statsData, setStatsData] = useState<PronunciationStats | null>(null)
  const [recentRecords, setRecentRecords] = useState<PronunciationRecord[]>([])
  const [activeTab, setActiveTab] = useState('practice')
  const [autoPlay, setAutoPlay] = useState(true)
  const [showIPA, setShowIPA] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // جلب الإحصائيات
  useEffect(() => {
    fetchStats()
  }, [currentUserId])

  const fetchStats = async () => {
    if (!currentUserId) return
    try {
      const response = await fetch(`/api/pronunciation?userId=${currentUserId}&type=stats`)
      if (response.ok) {
        const data = await response.json()
        setStatsData(data.stats)
        setRecentRecords(data.recentRecords || [])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // بدء التسجيل
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // إيقاف البث
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setResults(null)

      // بدء المؤقت
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // إيقاف تلقائي بعد 30 ثانية
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, 30000)

    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('لا يمكن الوصول إلى الميكروفون')
    }
  }, [])

  // إيقاف التسجيل
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }, [])

  // تحليل التسجيل
  const analyzeRecording = useCallback(async () => {
    if (!audioBlob || !selectedWord) return

    setIsAnalyzing(true)

    try {
      // تحويل الصوت إلى base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string
        
        // إرسال للتحليل (محاكاة)
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // نتائج محاكاة (في الإنتاج، استخدم ASR skill)
        const accuracy = Math.floor(Math.random() * 30) + 70 // 70-100
        const phonetic = Math.floor(Math.random() * 20) + 80
        const intonation = Math.floor(Math.random() * 25) + 75
        const pace = Math.floor(Math.random() * 30) + 70
        const isCorrect = accuracy >= 80

        const feedback = []
        if (phonetic < 85) feedback.push('حاول نطق الحروف بوضوح أكبر')
        if (intonation < 80) feedback.push('راجع نبرة الصوت والتشديد')
        if (pace < 75) feedback.push('حافظ على سرعة معتدلة في النطق')
        if (isCorrect) feedback.push('أحسنت! نطق صحيح 🎉')

        const newResults = {
          accuracy,
          phonetic,
          intonation,
          pace,
          feedback,
          isCorrect
        }
        setResults(newResults)

        // حفظ السجل
        try {
          await fetch('/api/pronunciation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUserId,
              wordId: selectedWord.id,
              word: selectedWord.word,
              audioData: base64Audio,
              duration: recordingTime,
              accuracy,
              phoneticScore: phonetic,
              intonationScore: intonation,
              paceScore: pace,
              isCorrect,
              feedback
            })
          })
          fetchStats()
        } catch (error) {
          console.error('Error saving record:', error)
        }
      }
    } catch (error) {
      console.error('Error analyzing recording:', error)
      toast.error('حدث خطأ أثناء التحليل')
    } finally {
      setIsAnalyzing(false)
    }
  }, [audioBlob, selectedWord, recordingTime, currentUserId])

  // إعادة التسجيل
  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setRecordingTime(0)
    setResults(null)
  }, [audioUrl])

  // نطق الكلمة
  const speakWord = useCallback((word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // كلمات للممارسة
  const practiceWords = words.filter(w => {
    if (difficulty === 'beginner') return w.level === 'beginner'
    if (difficulty === 'intermediate') return w.level === 'intermediate'
    if (difficulty === 'advanced') return w.level === 'advanced'
    return true
  })

  // اختيار كلمة عشوائية
  const selectRandomWord = useCallback(() => {
    if (practiceWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * practiceWords.length)
      setSelectedWord(practiceWords[randomIndex])
      resetRecording()
      if (autoPlay) {
        setTimeout(() => speakWord(practiceWords[randomIndex].word), 500)
      }
    }
  }, [practiceWords, autoPlay, resetRecording, speakWord])

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // مكون النتيجة
  const ScoreCircle = ({ label, score, color }: { label: string; score: number; color: string }) => (
    <div className="text-center">
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2",
        `bg-${color}-100 dark:bg-${color}-900/30`
      )}>
        <span className={cn(
          "text-lg font-bold",
          score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600'
        )}>
          {score}%
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mic className="w-7 h-7 text-emerald-500" />
            ممارسة النطق
          </h2>
          <p className="text-gray-500">سجّل صوتك وحسّن نطقك للإنجليزية</p>
        </div>
        {statsData && (
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{statsData.totalRecordings}</p>
              <p className="text-xs text-gray-500">تسجيل</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{Math.round(statsData.averageAccuracy)}%</p>
              <p className="text-xs text-gray-500">الدقة</p>
            </div>
          </div>
        )}
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="practice">الممارسة</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* قسم التسجيل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-emerald-500" />
                  سجّل نطقك
                </CardTitle>
                <CardDescription>
                  اختر كلمة وسجّل نطقك لها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* اختيار الكلمة */}
                <div className="space-y-3">
                  <Label>الكلمة المراد ممارستها</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedWord?.id || ''}
                      onValueChange={(value) => {
                        const word = words.find(w => w.id === value)
                        setSelectedWord(word || null)
                        resetRecording()
                        if (word && autoPlay) {
                          setTimeout(() => speakWord(word.word), 300)
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="اختر كلمة" />
                      </SelectTrigger>
                      <SelectContent>
                        {practiceWords.slice(0, 20).map(word => (
                          <SelectItem key={word.id} value={word.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{word.word}</span>
                              <span className="text-gray-500 text-sm">- {word.translation}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={selectRandomWord}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* عرض الكلمة */}
                {selectedWord && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white text-center"
                  >
                    <p className="text-3xl font-bold mb-2">{selectedWord.word}</p>
                    <p className="text-lg opacity-90">{selectedWord.translation}</p>
                    {selectedWord.pronunciation && showIPA && (
                      <p className="text-sm mt-2 opacity-75">/{selectedWord.pronunciation}/</p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-white hover:bg-white/20"
                      onClick={() => speakWord(selectedWord.word)}
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      استمع للنطق
                    </Button>
                  </motion.div>
                )}

                {/* أزرار التسجيل */}
                <div className="flex flex-col items-center gap-4">
                  {!audioBlob ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                          "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                          isRecording
                            ? "bg-rose-500 animate-pulse"
                            : "bg-emerald-500 hover:bg-emerald-600"
                        )}
                      >
                        {isRecording ? (
                          <Square className="w-8 h-8 text-white" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </motion.button>
                      <p className="text-sm text-gray-500">
                        {isRecording ? `جاري التسجيل... ${formatTime(recordingTime)}` : 'اضغط للتسجيل'}
                      </p>
                    </>
                  ) : (
                    <div className="w-full space-y-4">
                      {/* تشغيل التسجيل */}
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (audioUrl) {
                                const audio = new Audio(audioUrl)
                                audio.play()
                              }
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              مدة التسجيل: {formatTime(recordingTime)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={resetRecording}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* تحليل */}
                      <Button
                        className="w-full"
                        onClick={analyzeRecording}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            جاري التحليل...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            تحليل النطق
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* النتائج */}
                <AnimatePresence>
                  {results && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <div className={cn(
                          "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3",
                          results.isCorrect
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : "bg-amber-100 dark:bg-amber-900/30"
                        )}>
                          {results.isCorrect ? (
                            <Check className="w-12 h-12 text-emerald-500" />
                          ) : (
                            <Award className="w-12 h-12 text-amber-500" />
                          )}
                        </div>
                        <p className="text-3xl font-bold mb-1">
                          {results.accuracy}%
                        </p>
                        <p className="text-gray-500">
                          {results.isCorrect ? 'نطق صحيح! 🎉' : 'حاول مرة أخرى'}
                        </p>
                      </div>

                      {/* الدرجات التفصيلية */}
                      <div className="grid grid-cols-3 gap-4">
                        <ScoreCircle label="النطق" score={results.phonetic} color="emerald" />
                        <ScoreCircle label="النبرة" score={results.intonation} color="amber" />
                        <ScoreCircle label="السرعة" score={results.pace} color="rose" />
                      </div>

                      {/* الملاحظات */}
                      {results.feedback.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">الملاحظات:</p>
                          {results.feedback.map((fb, i) => (
                            <p key={i} className="text-sm text-gray-600 dark:text-gray-400">
                              • {fb}
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* قسم الإحصائيات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  تقدمك في النطق
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {statsData ? (
                  <>
                    {/* الإحصائيات الرئيسية */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                        <Flame className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                        <p className="text-2xl font-bold text-emerald-600">
                          {statsData.wordsPracticed}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          كلمة مُمارَسة
                        </p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                        <Target className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                        <p className="text-2xl font-bold text-amber-600">
                          {Math.round(statsData.successRate)}%
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          معدل النجاح
                        </p>
                      </div>
                    </div>

                    {/* الدقة */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>متوسط الدقة</span>
                        <span className="font-bold">{Math.round(statsData.averageAccuracy)}%</span>
                      </div>
                      <Progress value={statsData.averageAccuracy} className="h-3" />
                    </div>

                    {/* آخر التسجيلات */}
                    {recentRecords.length > 0 && (
                      <div className="space-y-3">
                        <p className="font-medium">آخر التسجيلات</p>
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {recentRecords.map(record => (
                              <div
                                key={record.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800"
                              >
                                <div className="flex items-center gap-3">
                                  {record.isCorrect ? (
                                    <Check className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <X className="w-5 h-5 text-rose-500" />
                                  )}
                                  <div>
                                    <p className="font-medium">{record.word}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(record.createdAt).toLocaleDateString('ar')}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={record.isCorrect ? 'default' : 'secondary'}>
                                  {record.accuracy}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Mic className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">
                      ابدأ التسجيل لرؤية تقدمك
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل التسجيلات</CardTitle>
              <CardDescription>
                جميع تسجيلاتك السابقة مع التحليل
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentRecords.length > 0 ? (
                <div className="space-y-3">
                  {recentRecords.map(record => (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        record.isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-rose-100 dark:bg-rose-900/30"
                      )}>
                        {record.isCorrect ? (
                          <Check className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <X className="w-6 h-6 text-rose-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg">{record.word}</p>
                          <Badge variant="outline">{record.accuracy}%</Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>النطق: {record.phoneticScore}%</span>
                          <span>النبرة: {record.intonationScore}%</span>
                          <span>السرعة: {record.paceScore}%</span>
                        </div>
                      </div>
                      <div className="text-left text-sm text-gray-500">
                        <p>{new Date(record.createdAt).toLocaleDateString('ar')}</p>
                        <p>{formatTime(record.duration)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Headphones className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">لا توجد تسجيلات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النطق</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>مستوى الصعوبة</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
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

              <div className="flex items-center justify-between">
                <div>
                  <Label>تشغيل النطق تلقائياً</Label>
                  <p className="text-sm text-gray-500">تشغيل نطق الكلمة عند اختيارها</p>
                </div>
                <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>عرض الرموز الصوتية (IPA)</Label>
                  <p className="text-sm text-gray-500">عرض النطق الدولي للكلمات</p>
                </div>
                <Switch checked={showIPA} onCheckedChange={setShowIPA} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
