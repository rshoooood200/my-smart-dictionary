'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, VolumeX, Play, Square, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Headphones, Radio,
  Waves, AudioWaveform, Sparkles, ChevronRight, Star, Trophy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Word } from '@/store/vocab-store'

// أنواع التمارين الصوتية
type VoiceExerciseType = 'pronunciation' | 'listening' | 'comparison' | 'dictation'

interface VoiceResult {
  accuracy: number
  duration: number
  attempts: number
  passed: boolean
}

interface VoiceFeaturesProps {
  words: Word[]
  onProgress?: (result: VoiceResult) => void
}

// أصوات للتدريب
const PRACTICE_SOUNDS = [
  { sound: 'th', words: ['think', 'this', 'that', 'mother'], tip: 'ضع لسانك بين الأسنان' },
  { sound: 'r', words: ['red', 'car', 'star', 'water'], tip: 'اجعل الراء ناعمة' },
  { sound: 'v', words: ['very', 'love', 'have', 'give'], tip: 'الأسنان العلوية على الشفة السفلية' },
  { sound: 'w', words: ['water', 'what', 'where', 'when'], tip: 'دائر شفتيك كالنفخ' },
  { sound: 'ng', words: ['sing', 'thing', 'ring', 'king'], tip: 'صوت أنفي' },
]

export function VoiceFeatures({ words, onProgress }: VoiceFeaturesProps) {
  const [activeTab, setActiveTab] = useState<VoiceExerciseType>('pronunciation')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)
  const [currentSound, setCurrentSound] = useState(0)
  
  // للتفاعل الصوتي
  const [recognizedText, setRecognizedText] = useState('')
  const [isListening, setIsListening] = useState(false)
  
  // للتمارين
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [dictationInput, setDictationInput] = useState('')
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  
  // اختيار كلمات عشوائية للتمارين
  const exerciseWords = useMemo(() => {
    if (words.length >= 4) {
      return [...words].sort(() => Math.random() - 0.5).slice(0, 10)
    }
    return []
  }, [words])
  
  // بدء التعرف على الصوت
  const startSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('المتصفح لا يدعم التعرف على الصوت')
      return false
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = 'en-US'
    
    recognitionRef.current.onstart = () => {
      setIsListening(true)
    }
    
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setRecognizedText(transcript)
      
      // مقارنة مع الكلمة الحالية
      const currentWord = exerciseWords[currentWordIndex]?.word || ''
      const isMatch = transcript.toLowerCase().trim() === currentWord.toLowerCase().trim()
      
      setIsCorrect(isMatch)
      setShowResult(true)
      
      if (isMatch) {
        setCorrectCount(prev => prev + 1)
        setScore(prev => prev + 15)
        toast.success('نطق صحيح! +15 نقطة')
      } else {
        toast.error(`النطق: "${transcript}" - الصحيح: "${currentWord}"`)
      }
    }
    
    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      if (event.error !== 'no-speech') {
        toast.error('خطأ في التعرف على الصوت')
      }
    }
    
    recognitionRef.current.onend = () => {
      setIsListening(false)
      setIsRecording(false)
    }
    
    return true
  }, [exerciseWords, currentWordIndex])
  
  // نطق الكلمة
  const speak = useCallback((text: string, rate = 0.8) => {
    if (!('speechSynthesis' in window)) {
      toast.error('المتصفح لا يدعم النطق')
      return
    }
    
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    
    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    
    window.speechSynthesis.speak(utterance)
  }, [])
  
  // بدء التسجيل
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setAttempts(prev => prev + 1)
      
      // بدء التعرف على الصوت
      startSpeechRecognition()
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('لا يمكن الوصول للميكروفون')
    }
  }, [startSpeechRecognition])
  
  // إيقاف التسجيل
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [isRecording])
  
  // الانتقال للكلمة التالية
  const nextWord = useCallback(() => {
    setShowResult(false)
    setRecognizedText('')
    setAudioURL(null)
    setSelectedOption(null)
    setDictationInput('')
    
    if (currentWordIndex < exerciseWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
    } else {
      // انتهاء التمرين
      toast.success(`انتهى التمرين! النتيجة: ${score} نقطة`)
      onProgress?.({
        accuracy: Math.round((correctCount / exerciseWords.length) * 100),
        duration: 0,
        attempts,
        passed: correctCount >= exerciseWords.length / 2
      })
      
      // إعادة تعيين
      setCurrentWordIndex(0)
      setScore(0)
      setCorrectCount(0)
      setAttempts(0)
    }
  }, [currentWordIndex, exerciseWords.length, score, correctCount, attempts, onProgress])
  
  // توليد خيارات لتمرين الاستماع
  const listeningOptions = useMemo(() => {
    if (activeTab !== 'listening' || exerciseWords.length === 0 || currentWordIndex >= exerciseWords.length) {
      return []
    }
    const currentWord = exerciseWords[currentWordIndex]
    const others = exerciseWords.filter(w => w.id !== currentWord.id).slice(0, 3)
    return [currentWord.translation, ...others.map(w => w.translation)]
      .sort(() => Math.random() - 0.5)
  }, [activeTab, exerciseWords, currentWordIndex])
  
  // التحقق من إجابة الاستماع
  const handleListeningAnswer = (answer: string) => {
    const currentWord = exerciseWords[currentWordIndex]
    const isCorrect = answer === currentWord.translation
    
    setSelectedOption(answer)
    setIsCorrect(isCorrect)
    setShowResult(true)
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      setScore(prev => prev + 10)
      toast.success('إجابة صحيحة! +10 نقاط')
    } else {
      toast.error(`الإجابة الصحيحة: ${currentWord.translation}`)
    }
  }
  
  // التحقق من إجابة الإملاء
  const handleDictationAnswer = () => {
    const currentWord = exerciseWords[currentWordIndex]
    const isCorrect = dictationInput.toLowerCase().trim() === currentWord.word.toLowerCase()
    
    setIsCorrect(isCorrect)
    setShowResult(true)
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      setScore(prev => prev + 20)
      toast.success('إجابة صحيحة! +20 نقطة')
    } else {
      toast.error(`الكلمة الصحيحة: ${currentWord.word}`)
    }
  }
  
  // إذا لم تكن هناك كلمات كافية
  if (words.length < 4) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-8 text-center">
          <Mic className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-bold mb-2">أضف المزيد من الكلمات</h3>
          <p className="text-gray-500">تحتاج على الأقل 4 كلمات لاستخدام التمارين الصوتية</p>
        </CardContent>
      </Card>
    )
  }
  
  // الكلمة الحالية
  const currentWord = exerciseWords[currentWordIndex]
  const progress = exerciseWords.length > 0 ? ((currentWordIndex + 1) / exerciseWords.length) * 100 : 0
  
  return (
    <div className="space-y-4">
      {/* شريط التقدم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currentWordIndex + 1}/{exerciseWords.length}</Badge>
          <Badge className="bg-violet-100 text-violet-700">
            <Star className="w-3 h-3 mr-1" />
            {score} نقطة
          </Badge>
        </div>
        <Progress value={progress} className="w-32 h-2" />
      </div>
      
      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VoiceExerciseType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pronunciation">
            <Mic className="w-4 h-4 mr-1" />
            النطق
          </TabsTrigger>
          <TabsTrigger value="listening">
            <Headphones className="w-4 h-4 mr-1" />
            الاستماع
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <Waves className="w-4 h-4 mr-1" />
            المقارنة
          </TabsTrigger>
          <TabsTrigger value="dictation">
            <AudioWaveform className="w-4 h-4 mr-1" />
            الإملاء
          </TabsTrigger>
        </TabsList>
        
        {/* تمرين النطق */}
        <TabsContent value="pronunciation" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">انطق الكلمة التالية:</p>
                <h2 className="text-4xl font-bold mb-2">{currentWord?.word}</h2>
                <p className="text-gray-500">{currentWord?.translation}</p>
              </div>
              
              <div className="flex justify-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-16 h-16 rounded-full"
                  onClick={() => speak(currentWord?.word || '')}
                  disabled={isPlaying}
                >
                  {isPlaying ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </Button>
                
                <Button
                  size="lg"
                  className={cn(
                    "w-20 h-20 rounded-full",
                    isRecording ? "bg-rose-500 hover:bg-rose-600" : "bg-violet-600 hover:bg-violet-700"
                  )}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Square className="w-8 h-8" />
                    </motion.div>
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
              </div>
              
              {/* حالة التسجيل */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <Radio className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                  </motion.div>
                  <p className="text-rose-600 font-medium">جاري الاستماع...</p>
                </motion.div>
              )}
              
              {/* النتيجة */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "p-4 rounded-xl text-center",
                      isCorrect ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"
                    )}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500" />
                      )}
                      <span className={cn("font-bold", isCorrect ? "text-emerald-700" : "text-rose-700")}>
                        {isCorrect ? 'نطق صحيح!' : 'حاول مرة أخرى'}
                      </span>
                    </div>
                    {recognizedText && !isCorrect && (
                      <p className="text-sm text-gray-500">
                        سُمع: "{recognizedText}"
                      </p>
                    )}
                    <Button className="mt-3" onClick={nextWord}>
                      التالي
                      <ChevronRight className="w-4 h-4 mr-1" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* نصائح */}
              <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="font-medium text-sm">نصيحة</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  انطق الكلمة بوضوح وانتظر حتى يتم التعرف على صوتك. يمكنك الاستماع للنطق الصحيح أولاً.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تمرين الاستماع */}
        <TabsContent value="listening" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-4">استمع واختر الترجمة الصحيحة:</p>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="w-20 h-20 rounded-full mb-4"
                  onClick={() => speak(currentWord?.word || '')}
                  disabled={isPlaying}
                >
                  {isPlaying ? (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.3 }}>
                      <Volume2 className="w-8 h-8" />
                    </motion.div>
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </Button>
                
                <p className="text-sm text-gray-500">اضغط للاستماع</p>
              </div>
              
              {/* الخيارات */}
              <div className="grid grid-cols-2 gap-3">
                {listeningOptions.map((option, i) => (
                  <Button
                    key={i}
                    variant={selectedOption === option ? (isCorrect ? "default" : "destructive") : "outline"}
                    className={cn(
                      "h-16 text-lg",
                      showResult && option === currentWord?.translation && "bg-emerald-500 hover:bg-emerald-600 text-white"
                    )}
                    onClick={() => !showResult && handleListeningAnswer(option)}
                    disabled={!!showResult}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              
              {/* النتيجة */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4"
                  >
                    <Button className="w-full" onClick={nextWord}>
                      التالي
                      <ChevronRight className="w-4 h-4 mr-1" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تمرين المقارنة */}
        <TabsContent value="comparison" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">استمع للمثال ثم سجّل نطقك للمقارنة:</p>
                <h2 className="text-3xl font-bold mb-2">{currentWord?.word}</h2>
                <p className="text-gray-500">{currentWord?.translation}</p>
              </div>
              
              {/* النطق الأصلي */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="font-medium">النطق الأصلي</p>
                      <p className="text-xs text-gray-500">اضغط للاستماع</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speak(currentWord?.word || '', 0.7)}
                  >
                    <Play className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              {/* تسجيل المستخدم */}
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-violet-500" />
                    <div>
                      <p className="font-medium">تسجيلك</p>
                      <p className="text-xs text-gray-500">
                        {audioURL ? 'تم التسجيل' : 'لم يتم التسجيل بعد'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {audioURL && (
                      <audio src={audioURL} controls className="h-8" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* زر التسجيل */}
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  className={cn(
                    "w-20 h-20 rounded-full",
                    isRecording ? "bg-rose-500" : "bg-violet-600"
                  )}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </Button>
              </div>
              
              {/* النتيجة */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "mt-4 p-4 rounded-xl text-center",
                      isCorrect ? "bg-emerald-50" : "bg-amber-50"
                    )}
                  >
                    <p className="font-bold mb-2">
                      {isCorrect ? 'نطق ممتاز!' : 'استمر في التدريب!'}
                    </p>
                    <Button onClick={nextWord}>
                      التالي
                      <ChevronRight className="w-4 h-4 mr-1" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تمرين الإملاء */}
        <TabsContent value="dictation" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-4">استمع واكتب الكلمة:</p>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="w-20 h-20 rounded-full mb-4"
                  onClick={() => speak(currentWord?.word || '')}
                  disabled={isPlaying}
                >
                  {isPlaying ? (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.3 }}>
                      <Volume2 className="w-8 h-8" />
                    </motion.div>
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </Button>
                
                <p className="text-sm text-gray-500">تلميح: {currentWord?.word.length} حروف</p>
              </div>
              
              {/* حقل الإدخال */}
              <div className="space-y-4">
                <input
                  type="text"
                  value={dictationInput}
                  onChange={(e) => setDictationInput(e.target.value)}
                  placeholder="اكتب الكلمة هنا..."
                  className="w-full p-4 text-2xl text-center border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  disabled={showResult}
                  onKeyPress={(e) => e.key === 'Enter' && !showResult && handleDictationAnswer()}
                />
                
                {!showResult ? (
                  <Button
                    className="w-full"
                    onClick={handleDictationAnswer}
                    disabled={!dictationInput.trim()}
                  >
                    تحقق
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "p-4 rounded-xl text-center",
                      isCorrect ? "bg-emerald-50" : "bg-rose-50"
                    )}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500" />
                      )}
                      <span className={cn("font-bold", isCorrect ? "text-emerald-700" : "text-rose-700")}>
                        {isCorrect ? 'صحيح!' : `الإجابة: ${currentWord?.word}`}
                      </span>
                    </div>
                    <Button onClick={nextWord}>
                      التالي
                      <ChevronRight className="w-4 h-4 mr-1" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* تمارين الأصوات */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Waves className="w-5 h-5 text-violet-500" />
            تمارين الأصوات الصعبة
          </CardTitle>
          <CardDescription>
            تدرب على نطق الأصوات التي يصعب على المتحدثين العرب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PRACTICE_SOUNDS.map((sound, i) => (
              <Button
                key={i}
                variant={currentSound === i ? "default" : "outline"}
                className="h-auto py-3 flex-col"
                onClick={() => {
                  setCurrentSound(i)
                  speak(sound.words[0])
                }}
              >
                <span className="text-2xl font-bold mb-1">/{sound.sound}/</span>
                <span className="text-xs text-gray-500">{sound.words.length} كلمات</span>
              </Button>
            ))}
          </div>
          
          {PRACTICE_SOUNDS[currentSound] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
            >
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-medium">نصيحة:</span> {PRACTICE_SOUNDS[currentSound].tip}
              </p>
              <div className="flex flex-wrap gap-2">
                {PRACTICE_SOUNDS[currentSound].words.map((word, i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    size="sm"
                    onClick={() => speak(word)}
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    {word}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
