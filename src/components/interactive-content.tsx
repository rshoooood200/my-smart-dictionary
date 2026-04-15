'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Check, X, ChevronRight, ChevronLeft,
  Lightbulb, Clock, Target, Award, Zap, Star, Heart, Bookmark,
  Shuffle, Eye, EyeOff, Volume2, VolumeX, Sparkles, RefreshCw,
  Layers, Grid, List, Plus, Minus, Move, GripVertical, Trash2,
  Edit3, Save, Download, Upload, Share2, Copy, MoreHorizontal,
  Brain, Puzzle, FileText, MessageSquare, Image, Mic, Video,
  Trophy, Medal, Crown, Flame, TrendingUp, BarChart2, PieChart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface InteractiveWord {
  id: string
  word: string
  translation: string
  pronunciation?: string
  example?: string
  image?: string
}

interface InteractiveQuestion {
  id: string
  question: string
  questionAr?: string
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'drag_drop' | 'matching' | 'ordering'
  options: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
  hint?: string
}

interface DragItem {
  id: string
  content: string
  correctPosition: number
}

interface MatchPair {
  id: string
  left: string
  right: string
}

interface MindMapNode {
  id: string
  text: string
  x: number
  y: number
  color?: string
  children?: string[]
}

interface ContentProgress {
  score: number
  total: number
  correct: number
  wrong: number
  timeSpent: number
  hintsUsed: number
}

// Content Types
type ContentType = 'flashcard' | 'drag_drop' | 'fill_blank' | 'matching' | 'mind_map' | 'story' | 'quiz'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'

// Main Component
export function InteractiveContent() {
  const [activeTab, setActiveTab] = useState<string>('flashcards')
  const [contentType, setContentType] = useState<ContentType>('flashcard')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [progress, setProgress] = useState<ContentProgress>({
    score: 0,
    total: 0,
    correct: 0,
    wrong: 0,
    timeSpent: 0,
    hintsUsed: 0
  })

  // Sample data - In production, this would come from the API
  const [words] = useState<InteractiveWord[]>([
    { id: '1', word: 'Hello', translation: 'مرحباً', pronunciation: 'həˈləʊ', example: 'Hello, how are you?' },
    { id: '2', word: 'Goodbye', translation: 'وداعاً', pronunciation: 'ɡʊdˈbaɪ', example: 'Goodbye, see you later!' },
    { id: '3', word: 'Thank you', translation: 'شكراً لك', pronunciation: 'θæŋk juː', example: 'Thank you for your help.' },
    { id: '4', word: 'Please', translation: 'من فضلك', pronunciation: 'pliːz', example: 'Please sit down.' },
    { id: '5', word: 'Sorry', translation: 'آسف', pronunciation: 'ˈsɒri', example: 'Sorry, I\'m late.' },
    { id: '6', word: 'Yes', translation: 'نعم', pronunciation: 'jes', example: 'Yes, I agree.' },
    { id: '7', word: 'No', translation: 'لا', pronunciation: 'nəʊ', example: 'No, thank you.' },
    { id: '8', word: 'Maybe', translation: 'ربما', pronunciation: 'ˈmeɪbi', example: 'Maybe tomorrow.' },
  ])

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            المحتوى التفاعلي المتقدم
          </h2>
          <p className="text-gray-500 text-sm mt-1">تعلّم بطريقة ممتعة وتفاعلية</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger className="w-32">
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

      {/* Progress Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm opacity-90">النقاط</span>
            </div>
            <div className="text-2xl font-bold">{progress.score}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4" />
              <span className="text-sm opacity-90">صحيح</span>
            </div>
            <div className="text-2xl font-bold">{progress.correct}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <X className="w-4 h-4" />
              <span className="text-sm opacity-90">خطأ</span>
            </div>
            <div className="text-2xl font-bold">{progress.wrong}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm opacity-90">الوقت</span>
            </div>
            <div className="text-2xl font-bold">{Math.floor(progress.timeSpent / 60)}:{(progress.timeSpent % 60).toString().padStart(2, '0')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1">
          <TabsTrigger value="flashcards" className="flex flex-col gap-1 py-2">
            <Layers className="w-4 h-4" />
            <span className="text-xs">البطاقات</span>
          </TabsTrigger>
          <TabsTrigger value="dragdrop" className="flex flex-col gap-1 py-2">
            <Move className="w-4 h-4" />
            <span className="text-xs">سحب وإفلات</span>
          </TabsTrigger>
          <TabsTrigger value="fillblank" className="flex flex-col gap-1 py-2">
            <Edit3 className="w-4 h-4" />
            <span className="text-xs">ملء الفراغات</span>
          </TabsTrigger>
          <TabsTrigger value="matching" className="flex flex-col gap-1 py-2">
            <Puzzle className="w-4 h-4" />
            <span className="text-xs">المطابقة</span>
          </TabsTrigger>
          <TabsTrigger value="mindmap" className="flex flex-col gap-1 py-2 hidden lg:flex">
            <Brain className="w-4 h-4" />
            <span className="text-xs">الخريطة الذهنية</span>
          </TabsTrigger>
          <TabsTrigger value="story" className="flex flex-col gap-1 py-2 hidden lg:flex">
            <FileText className="w-4 h-4" />
            <span className="text-xs">القصة التفاعلية</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex flex-col gap-1 py-2 hidden lg:flex">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">اختبار سريع</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards" className="mt-4">
          <FlashcardsSection words={words} onProgress={(p) => setProgress(prev => ({ ...prev, ...p }))} />
        </TabsContent>
        <TabsContent value="dragdrop" className="mt-4">
          <DragDropSection words={words} onProgress={(p) => setProgress(prev => ({ ...prev, ...p }))} />
        </TabsContent>
        <TabsContent value="fillblank" className="mt-4">
          <FillBlankSection words={words} onProgress={(p) => setProgress(prev => ({ ...prev, ...p }))} />
        </TabsContent>
        <TabsContent value="matching" className="mt-4">
          <MatchingSection words={words} onProgress={(p) => setProgress(prev => ({ ...prev, ...p }))} />
        </TabsContent>
        <TabsContent value="mindmap" className="mt-4">
          <MindMapSection words={words} />
        </TabsContent>
        <TabsContent value="story" className="mt-4">
          <InteractiveStorySection words={words} onProgress={(p) => setProgress(prev => ({ ...prev, ...p }))} />
        </TabsContent>
        <TabsContent value="quiz" className="mt-4">
          <QuickQuizSection words={words} onProgress={(p) => setProgress(prev => ({ ...prev, ...p }))} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Flashcards Section with Swipe Gestures
function FlashcardsSection({ words, onProgress }: { words: InteractiveWord[], onProgress: (p: Partial<ContentProgress>) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [unknown, setUnknown] = useState<Set<string>>(new Set())
  const [showResult, setShowResult] = useState(false)
  
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30])
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0])
  
  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      // Swipe right - Known
      handleKnown()
    } else if (info.offset.x < -threshold) {
      // Swipe left - Unknown
      handleUnknown()
    }
  }

  const handleKnown = () => {
    if (currentWord) {
      setKnown(prev => new Set([...prev, currentWord.id]))
      onProgress({ correct: 1, score: 10 })
    }
    moveToNext()
  }

  const handleUnknown = () => {
    if (currentWord) {
      setUnknown(prev => new Set([...prev, currentWord.id]))
      onProgress({ wrong: 1 })
    }
    moveToNext()
  }

  const moveToNext = () => {
    setIsFlipped(false)
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setShowResult(true)
    }
  }

  const reset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnown(new Set())
    setUnknown(new Set())
    setShowResult(false)
  }

  if (showResult) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">أحسنت! 🎉</h3>
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-600">{known.size}</div>
              <div className="text-sm text-gray-500">تعرفت عليها</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
              <X className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-rose-600">{unknown.size}</div>
              <div className="text-sm text-gray-500">تحتاج مراجعة</div>
            </div>
          </div>
          <Progress value={(known.size / words.length) * 100} className="mb-4" />
          <p className="text-gray-500 mb-4">نسبة النجاح: {Math.round((known.size / words.length) * 100)}%</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={reset} variant="outline">
              <RotateCcw className="w-4 h-4 ml-2" />
              إعادة
            </Button>
            <Button onClick={() => {/* Export unknown words */}}>
              <Download className="w-4 h-4 ml-2" />
              تصدير للمراجعة
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{currentIndex + 1} / {words.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Card */}
      <div className="relative h-80 perspective-1000">
        <motion.div
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          className={cn(
            "absolute inset-0 cursor-grab active:cursor-grabbing",
            "transition-transform duration-300 preserve-3d",
            isFlipped && "rotate-y-180"
          )}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <Card className={cn(
            "absolute inset-0 backface-hidden",
            "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
            "flex items-center justify-center",
            isFlipped && "invisible"
          )}>
            <CardContent className="p-8 text-center">
              <div className="text-4xl font-bold mb-4">{currentWord?.word}</div>
              <div className="text-lg opacity-80">{currentWord?.pronunciation}</div>
              <div className="mt-6 text-sm opacity-60">اضغط للقلب</div>
            </CardContent>
          </Card>

          {/* Back */}
          <Card className={cn(
            "absolute inset-0 backface-hidden rotate-y-180",
            "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
            "flex items-center justify-center"
          )}>
            <CardContent className="p-8 text-center">
              <div className="text-3xl font-bold mb-4">{currentWord?.translation}</div>
              {currentWord?.example && (
                <div className="text-sm opacity-80 italic">"{currentWord.example}"</div>
              )}
              <div className="mt-6 text-sm opacity-60">اسحب لليمين إذا تعرف، لليسار إذا لا</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Swipe Indicators */}
      <div className="flex justify-between items-center mt-4">
        <motion.div
          animate={{ opacity: x.get() < -50 ? 1 : 0.3 }}
          className="flex flex-col items-center text-rose-500"
        >
          <X className="w-8 h-8" />
          <span className="text-sm">لا أعرف</span>
        </motion.div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsFlipped(!isFlipped)}>
            {isFlipped ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <motion.div
          animate={{ opacity: x.get() > 50 ? 1 : 0.3 }}
          className="flex flex-col items-center text-emerald-500"
        >
          <Check className="w-8 h-8" />
          <span className="text-sm">أعرف</span>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-4">
        <Button variant="outline" onClick={handleUnknown} className="gap-2">
          <X className="w-4 h-4" />
          لا أعرف
        </Button>
        <Button onClick={handleKnown} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Check className="w-4 h-4" />
          أعرف
        </Button>
      </div>
    </div>
  )
}

// Drag and Drop Section
function DragDropSection({ words, onProgress }: { words: InteractiveWord[], onProgress: (p: Partial<ContentProgress>) => void }) {
  // Initialize items with useMemo to avoid setState in effect
  const initialItems = useMemo(() => {
    const selected = words.slice(0, 5)
    const shuffled = [...selected].sort(() => Math.random() - 0.5)
    return shuffled.map((w, i) => ({
      id: w.id,
      content: w.word,
      correctPosition: i
    }))
  }, [words])

  const [items, setItems] = useState<DragItem[]>(initialItems)
  const [droppedItems, setDroppedItems] = useState<DragItem[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [score, setScore] = useState(0)

  const initGame = useCallback(() => {
    const selected = words.slice(0, 5)
    const shuffled = [...selected].sort(() => Math.random() - 0.5)
    setItems(shuffled.map((w, i) => ({
      id: w.id,
      content: w.word,
      correctPosition: i
    })))
    setDroppedItems([])
    setIsComplete(false)
    setScore(0)
  }, [words])

  const handleDrop = (item: DragItem, position: number) => {
    const isCorrect = item.correctPosition === position
    if (isCorrect) {
      setScore(prev => prev + 20)
      onProgress({ correct: 1, score: 20 })
      toast.success('صحيح! +20 نقطة')
    } else {
      onProgress({ wrong: 1 })
      toast.error('خطأ! حاول مرة أخرى')
      return
    }

    setDroppedItems(prev => {
      const newItems = [...prev]
      newItems[position] = item
      // Check completion based on new state
      if (newItems.filter(Boolean).length === 5) {
        setTimeout(() => setIsComplete(true), 0)
      }
      return newItems
    })
    setItems(prev => prev.filter(i => i.id !== item.id))
  }

  const correctOrder = words.slice(0, 5)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move className="w-5 h-5 text-emerald-500" />
          رتب الكلمات بالترتيب الصحيح
        </CardTitle>
        <CardDescription>اسحب الكلمات وأفلتها في المربعات المناسبة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Areas */}
        <div className="grid grid-cols-5 gap-2">
          {correctOrder.map((word, index) => (
            <div
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const itemId = e.dataTransfer.getData('itemId')
                const item = items.find(i => i.id === itemId)
                if (item) handleDrop(item, index)
              }}
              className={cn(
                "aspect-square border-2 border-dashed rounded-xl flex items-center justify-center",
                "transition-all duration-200",
                droppedItems[index] ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-300 hover:border-emerald-400"
              )}
            >
              {droppedItems[index] && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center p-2"
                >
                  <div className="font-bold">{droppedItems[index].content}</div>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Hint: Show translations */}
        <div className="grid grid-cols-5 gap-2 text-center text-sm text-gray-500">
          {correctOrder.map((word, index) => (
            <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {word.translation}
            </div>
          ))}
        </div>

        {/* Draggable Items */}
        <div className="flex flex-wrap gap-2 justify-center min-h-16 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                exit={{ scale: 0, opacity: 0 }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('itemId', item.id)}
                className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-md cursor-move hover:shadow-lg transition-shadow border-2 border-transparent hover:border-emerald-400"
              >
                <GripVertical className="w-4 h-4 inline ml-2 text-gray-400" />
                {item.content}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Score & Actions */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Star className="w-4 h-4 ml-1 text-amber-500" />
            {score} نقطة
          </Badge>
          <Button variant="outline" onClick={initGame}>
            <RefreshCw className="w-4 h-4 ml-2" />
            لعبة جديدة
          </Button>
        </div>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl"
          >
            <Trophy className="w-12 h-12 mx-auto text-amber-500 mb-2" />
            <p className="text-lg font-bold text-emerald-600">أحسنت! أنهيت التمرين 🎉</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

// Fill in the Blank Section
function FillBlankSection({ words, onProgress }: { words: InteractiveWord[], onProgress: (p: Partial<ContentProgress>) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // Generate sentences with blanks
  const sentences = useMemo(() => {
    return words.slice(0, 5).map(w => ({
      id: w.id,
      word: w.word,
      sentence: w.example || `I use the word "${w.word}" every day.`,
      translation: w.translation
    }))
  }, [words])

  const currentSentence = sentences[currentIndex]

  const checkAnswer = () => {
    const answer = answers[currentSentence.id]?.trim().toLowerCase()
    const correct = currentSentence.word.toLowerCase()
    const isCorrect = answer === correct

    setShowResults(prev => ({ ...prev, [currentSentence.id]: true }))

    if (isCorrect) {
      setScore(prev => prev + 15)
      onProgress({ correct: 1, score: 15 })
      toast.success('إجابة صحيحة! +15 نقطة')
    } else {
      onProgress({ wrong: 1 })
      toast.error(`الإجابة الصحيحة: ${currentSentence.word}`)
    }

    setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setShowResults({})
      } else {
        setIsComplete(true)
      }
    }, 1500)
  }

  const reset = () => {
    setCurrentIndex(0)
    setAnswers({})
    setShowResults({})
    setScore(0)
    setIsComplete(false)
  }

  if (isComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <Award className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">تم إنهاء التمرين!</h3>
          <p className="text-3xl font-bold text-emerald-600 mb-4">{score} نقطة</p>
          <Button onClick={reset}>تمرين جديد</Button>
        </CardContent>
      </Card>
    )
  }

  const sentenceWithBlank = currentSentence?.sentence.replace(
    new RegExp(currentSentence.word, 'gi'),
    '_____'
  )

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-500" />
            ملء الفراغات
          </CardTitle>
          <Badge variant="outline">{currentIndex + 1} / {sentences.length}</Badge>
        </div>
        <Progress value={((currentIndex + 1) / sentences.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sentence */}
        <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl">
          <p className="text-xl text-center leading-relaxed">
            {sentenceWithBlank}
          </p>
          <p className="text-sm text-gray-500 text-center mt-2">
            ({currentSentence?.translation})
          </p>
        </div>

        {/* Answer Input */}
        <div className="space-y-2">
          <Label>اكتب الكلمة المناسبة:</Label>
          <Input
            value={answers[currentSentence?.id] || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, [currentSentence.id]: e.target.value }))}
            placeholder="اكتب الإجابة هنا..."
            className={cn(
              "text-lg text-center",
              showResults[currentSentence?.id] && (
                answers[currentSentence?.id]?.toLowerCase() === currentSentence?.word.toLowerCase()
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-rose-500 bg-rose-50"
              )
            )}
            disabled={showResults[currentSentence?.id]}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={checkAnswer}
            disabled={!answers[currentSentence?.id] || showResults[currentSentence?.id]}
          >
            <Check className="w-4 h-4 ml-2" />
            تحقق
          </Button>
          <Button variant="outline" onClick={() => setAnswers(prev => ({ ...prev, [currentSentence?.id]: currentSentence.word }))}>
            <Lightbulb className="w-4 h-4 ml-2" />
            تلميح
          </Button>
        </div>

        {/* Score */}
        <div className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Star className="w-4 h-4 ml-1 text-amber-500" />
            {score} نقطة
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Matching Section
function MatchingSection({ words, onProgress }: { words: InteractiveWord[], onProgress: (p: Partial<ContentProgress>) => void }) {
  const [pairs, setPairs] = useState<MatchPair[]>([])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongPair, setWrongPair] = useState<{ left: string, right: string } | null>(null)
  const [score, setScore] = useState(0)

  const initGame = useCallback(() => {
    const selected = words.slice(0, 6)
    setPairs(selected.map(w => ({ id: w.id, left: w.word, right: w.translation })))
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatched(new Set())
    setScore(0)
  }, [words])

  useEffect(() => {
    initGame()
  }, [initGame])

  const handleSelect = (side: 'left' | 'right', id: string) => {
    if (matched.has(id)) return

    if (side === 'left') {
      setSelectedLeft(id)
    } else {
      setSelectedRight(id)
    }
  }

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      const pair = pairs.find(p => p.id === selectedLeft)
      if (pair && pair.id === selectedRight) {
        // Correct match
        setMatched(prev => new Set([...prev, selectedLeft, selectedRight]))
        setScore(prev => prev + 15)
        onProgress({ correct: 1, score: 15 })
        toast.success('مطابق! +15 نقطة')
      } else {
        // Wrong match
        setWrongPair({ left: selectedLeft, right: selectedRight })
        onProgress({ wrong: 1 })
        toast.error('غير مطابق!')
        setTimeout(() => setWrongPair(null), 500)
      }
      setSelectedLeft(null)
      setSelectedRight(null)
    }
  }, [selectedLeft, selectedRight, pairs, onProgress])

  const leftItems = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs])
  const rightItems = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs])

  const isComplete = matched.size === pairs.length * 2

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-emerald-500" />
          طابق الكلمات مع ترجماتها
        </CardTitle>
        <CardDescription>اختر كلمة من اليمين وترجمتها من اليسار</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Translations */}
          <div className="space-y-2">
            {leftItems.map((pair) => (
              <motion.button
                key={`left-${pair.id}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('left', pair.id)}
                disabled={matched.has(pair.id)}
                className={cn(
                  "w-full p-3 rounded-xl text-right transition-all",
                  "border-2",
                  matched.has(pair.id) && "bg-emerald-100 border-emerald-500 text-emerald-700",
                  selectedLeft === pair.id && "border-amber-500 bg-amber-50",
                  wrongPair?.left === pair.id && "border-rose-500 bg-rose-50 animate-shake",
                  !matched.has(pair.id) && selectedLeft !== pair.id && wrongPair?.left !== pair.id && "border-gray-200 hover:border-emerald-400 bg-white dark:bg-gray-800"
                )}
              >
                {pair.left}
                {matched.has(pair.id) && <Check className="w-4 h-4 inline mr-2" />}
              </motion.button>
            ))}
          </div>

          {/* Right Column - Words */}
          <div className="space-y-2">
            {rightItems.map((pair) => (
              <motion.button
                key={`right-${pair.id}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('right', pair.id)}
                disabled={matched.has(pair.id)}
                className={cn(
                  "w-full p-3 rounded-xl text-right transition-all",
                  "border-2",
                  matched.has(pair.id) && "bg-emerald-100 border-emerald-500 text-emerald-700",
                  selectedRight === pair.id && "border-amber-500 bg-amber-50",
                  wrongPair?.right === pair.id && "border-rose-500 bg-rose-50 animate-shake",
                  !matched.has(pair.id) && selectedRight !== pair.id && wrongPair?.right !== pair.id && "border-gray-200 hover:border-emerald-400 bg-white dark:bg-gray-800"
                )}
              >
                {pair.right}
                {matched.has(pair.id) && <Check className="w-4 h-4 inline mr-2" />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Score & Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Star className="w-4 h-4 ml-1 text-amber-500" />
            {score} نقطة
          </Badge>
          <Button variant="outline" onClick={initGame}>
            <RefreshCw className="w-4 h-4 ml-2" />
            لعبة جديدة
          </Button>
        </div>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl"
          >
            <Trophy className="w-12 h-12 mx-auto text-amber-500 mb-2" />
            <p className="text-lg font-bold text-emerald-600">أحسنت! أنهيت المطابقة 🎉</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

// Mind Map Section
function MindMapSection({ words }: { words: InteractiveWord[] }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  
  // Initialize with sample mind map using useMemo
  const initialNodes = useMemo(() => {
    const centerX = 200
    const centerY = 200
    return [
      { id: 'center', text: 'المفردات', x: centerX, y: centerY, color: '#10B981', children: words.slice(0, 4).map(w => w.id) },
      ...words.slice(0, 4).map((w, i) => ({
        id: w.id,
        text: w.word,
        x: centerX + Math.cos((i * Math.PI) / 2) * 150,
        y: centerY + Math.sin((i * Math.PI) / 2) * 150,
        color: ['#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'][i]
      }))
    ]
  }, [words])
  
  const [nodes, setNodes] = useState<MindMapNode[]>(initialNodes)

  // Update nodes when words change
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes])

  const addNode = () => {
    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text: 'كلمة جديدة',
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      color: '#6B7280'
    }
    setNodes(prev => [...prev, newNode])
  }

  const updateNodeText = (id: string, text: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, text } : n))
  }

  const deleteNode = (id: string) => {
    if (id === 'center') return
    setNodes(prev => prev.filter(n => n.id !== id))
    setSelectedNode(null)
  }

  const connections = nodes.filter(n => n.children).flatMap(n => 
    n.children!.map(childId => ({ from: n.id, to: childId }))
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-500" />
          الخريطة الذهنية
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addNode}>
            <Plus className="w-4 h-4 ml-1" />
            إضافة
          </Button>
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 ml-1" />
            حفظ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Canvas */}
        <div className="relative w-full h-96 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border-2 border-dashed border-gray-200">
          {/* SVG Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((conn, i) => {
              const from = nodes.find(n => n.id === conn.from)
              const to = nodes.find(n => n.id === conn.to)
              if (!from || !to) return null
              return (
                <motion.line
                  key={i}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  x1={from.x + 50}
                  y1={from.y + 20}
                  x2={to.x + 50}
                  y2={to.y + 20}
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              drag
              dragMomentum={false}
              onDrag={(_, info) => {
                setNodes(prev => prev.map(n => 
                  n.id === node.id 
                    ? { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y }
                    : n
                ))
              }}
              style={{ 
                position: 'absolute',
                left: node.x,
                top: node.y,
              }}
              onClick={() => setSelectedNode(node.id)}
              className={cn(
                "px-4 py-2 rounded-xl shadow-lg cursor-move",
                "transition-shadow",
                selectedNode === node.id && "ring-2 ring-amber-400 ring-offset-2"
              )}
              whileHover={{ scale: 1.05 }}
            >
              <div
                className="font-bold text-white"
                style={{ backgroundColor: node.color }}
              >
                {node.text}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Node Editor */}
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex gap-2"
          >
            <Input
              value={nodes.find(n => n.id === selectedNode)?.text || ''}
              onChange={(e) => updateNodeText(selectedNode, e.target.value)}
              placeholder="نص العقدة..."
            />
            <Button 
              variant="destructive" 
              size="icon"
              onClick={() => deleteNode(selectedNode)}
              disabled={selectedNode === 'center'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

// Interactive Story Section
function InteractiveStorySection({ words, onProgress }: { words: InteractiveWord[], onProgress: (p: Partial<ContentProgress>) => void }) {
  const [currentScene, setCurrentScene] = useState(0)
  const [choices, setChoices] = useState<number[]>([])
  const [score, setScore] = useState(0)

  const scenes = [
    {
      id: 1,
      text: "You wake up in the morning and decide to...",
      textAr: "استيقظت في الصباح وقررت...",
      choices: [
        { text: "Say 'Hello' to your family", textAr: "تقول 'مرحباً' لعائلتك", correct: true, word: 'Hello' },
        { text: "Go back to sleep", textAr: "تعود للنوم", correct: false },
        { text: "Check your phone", textAr: "تفحص هاتفك", correct: false }
      ]
    },
    {
      id: 2,
      text: "Your friend helps you with homework. You say...",
      textAr: "ساعدك صديقك في الواجب. تقول...",
      choices: [
        { text: "Nothing", textAr: "لا شيء", correct: false },
        { text: "Thank you very much!", textAr: "شكراً جزيلاً!", correct: true, word: 'Thank you' },
        { text: "Goodbye", textAr: "وداعاً", correct: false }
      ]
    },
    {
      id: 3,
      text: "You need to borrow a pen. You say...",
      textAr: "تحتاج لاستعارة قلم. تقول...",
      choices: [
        { text: "Give me a pen", textAr: "أعطني قلماً", correct: false },
        { text: "Please, can I borrow your pen?", textAr: "من فضلك، هل يمكنني استعارة قلمك؟", correct: true, word: 'Please' },
        { text: "Where is the pen?", textAr: "أين القلم؟", correct: false }
      ]
    }
  ]

  const handleChoice = (choiceIndex: number) => {
    const currentChoices = scenes[currentScene].choices
    if (currentChoices[choiceIndex].correct) {
      setScore(prev => prev + 25)
      onProgress({ correct: 1, score: 25 })
      toast.success('اختيار صحيح! +25 نقطة')
    } else {
      onProgress({ wrong: 1 })
      toast.error('اختيار خاطئ!')
    }

    setChoices(prev => [...prev, choiceIndex])

    setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1)
      }
    }, 1000)
  }

  const reset = () => {
    setCurrentScene(0)
    setChoices([])
    setScore(0)
  }

  const currentSceneData = scenes[currentScene]
  const isComplete = currentScene === scenes.length - 1 && choices.length === scenes.length

  if (isComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <Crown className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">أنهيت القصة!</h3>
          <p className="text-3xl font-bold text-emerald-600 mb-4">{score} نقطة</p>
          <div className="text-gray-500 mb-4">
            اتخذت {choices.filter((c, i) => scenes[i].choices[c].correct).length} قرارات صحيحة من {scenes.length}
          </div>
          <Button onClick={reset}>قصة جديدة</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            القصة التفاعلية
          </CardTitle>
          <Badge variant="outline">المشهد {currentScene + 1} / {scenes.length}</Badge>
        </div>
        <Progress value={((currentScene + 1) / scenes.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scene Text */}
        <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl">
          <p className="text-lg text-center">{currentSceneData.text}</p>
          <p className="text-sm text-gray-500 text-center mt-2">{currentSceneData.textAr}</p>
        </div>

        {/* Choices */}
        <div className="space-y-2">
          {currentSceneData.choices.map((choice, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => choices.length === currentScene && handleChoice(index)}
              disabled={choices.length > currentScene}
              className={cn(
                "w-full p-4 rounded-xl text-right transition-all",
                "border-2 hover:border-emerald-400",
                choices.length > currentScene && choice.correct && "bg-emerald-50 border-emerald-500",
                choices.length > currentScene && !choice.correct && choices[currentScene] === index && "bg-rose-50 border-rose-500",
                choices.length === currentScene && "bg-white dark:bg-gray-800 border-gray-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{choice.text}</div>
                  <div className="text-sm text-gray-500">{choice.textAr}</div>
                </div>
                {choices.length > currentScene && choice.correct && (
                  <Check className="w-5 h-5 text-emerald-500" />
                )}
                {choices.length > currentScene && !choice.correct && choices[currentScene] === index && (
                  <X className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Score */}
        <div className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Star className="w-4 h-4 ml-1 text-amber-500" />
            {score} نقطة
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Quiz Section
function QuickQuizSection({ words, onProgress }: { words: InteractiveWord[], onProgress: (p: Partial<ContentProgress>) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isActive, setIsActive] = useState(true)
  const [score, setScore] = useState(0)

  // Generate questions
  const questions = useMemo(() => {
    return words.slice(0, 5).map(w => ({
      id: w.id,
      question: `ما معنى كلمة "${w.word}"؟`,
      options: [w.translation, ...words.filter(x => x.id !== w.id).slice(0, 3).map(x => x.translation)].sort(() => Math.random() - 0.5),
      correctAnswer: w.translation
    }))
  }, [words])

  // Handle timer completion with a ref
  const handleTimeUp = useCallback(() => {
    setShowResults(true)
    setIsActive(false)
  }, [])

  useEffect(() => {
    if (!isActive || showResults) return
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isActive, showResults, handleTimeUp])

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }))

    if (answer === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 10)
      onProgress({ correct: 1, score: 10 })
    } else {
      onProgress({ wrong: 1 })
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setShowResults(true)
      setIsActive(false)
    }
  }

  const reset = () => {
    setCurrentIndex(0)
    setAnswers({})
    setShowResults(false)
    setTimeLeft(60)
    setIsActive(true)
    setScore(0)
  }

  const currentQuestion = questions[currentIndex]
  const correctCount = Object.entries(answers).filter(([i, a]) => questions[parseInt(i)].correctAnswer === a).length

  if (showResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">انتهى الوقت!</h3>
          <div className="text-3xl font-bold text-emerald-600 mb-4">{score} نقطة</div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <div className="text-xl font-bold">{correctCount}</div>
              <div className="text-xs text-gray-500">صحيح</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
              <X className="w-6 h-6 text-rose-500 mx-auto mb-1" />
              <div className="text-xl font-bold">{questions.length - correctCount}</div>
              <div className="text-xs text-gray-500">خطأ</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <div className="text-xl font-bold">{60 - timeLeft}s</div>
              <div className="text-xs text-gray-500">الوقت</div>
            </div>
          </div>
          <Button onClick={reset}>اختبار جديد</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            اختبار سريع
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={timeLeft <= 10 ? "destructive" : "secondary"} className="font-mono">
              <Clock className="w-4 h-4 ml-1" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </Badge>
          </div>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl text-center">
          <p className="text-xl font-bold">{currentQuestion?.question}</p>
          <Badge variant="outline" className="mt-2">{currentIndex + 1} / {questions.length}</Badge>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {currentQuestion?.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(option)}
              className="p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 hover:border-emerald-400 transition-all text-right"
            >
              <span className="text-sm text-gray-400 ml-2">{['أ', 'ب', 'ج', 'د'][index]}</span>
              {option}
            </motion.button>
          ))}
        </div>

        {/* Score */}
        <div className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Star className="w-4 h-4 ml-1 text-amber-500" />
            {score} نقطة
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
