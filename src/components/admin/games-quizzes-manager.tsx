'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Gamepad2, Brain, BookOpen, Plus, Edit, Trash2, Save,
  Search, RefreshCw, Eye, EyeOff, Zap, Check, AlertCircle, Sparkles, ClipboardPaste, Volume2, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface Game {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  category: string
  type: string
  difficulty: string
  ageGroup?: string
  xpReward: number
  config: string
  thumbnail?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Quiz {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  category: string
  type: string
  difficulty: string
  ageGroup?: string
  xpReward: number
  timeLimit?: number
  questions: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Flashcard {
  id: string
  word: string
  wordAr: string
  translation?: string
  example?: string
  imageUrl?: string
  audioUrl?: string
  category?: string
  ageGroup?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Game types with all supported formats
const GAME_TYPES = [
  { id: 'matching', label: 'مطابقة', icon: '🔗', description: 'طابق بين عنصرين' },
  { id: 'memory', label: 'ذاكرة', icon: '🧠', description: 'ابحث عن الأزواج' },
  { id: 'scramble', label: 'ترتيب حروف', icon: '📝', description: 'رتب الحروف' },
  { id: 'exploration', label: 'استكشاف', icon: '🔤', description: 'استكشف الحروف' },
  { id: 'listening', label: 'استماع', icon: '🔊', description: 'استمع واختر' },
  { id: 'fill_blank', label: 'ملء فراغات', icon: '✏️', description: 'أكمل الجملة' },
  { id: 'word_search', label: 'بحث كلمات', icon: '🔍', description: 'ابحث عن الكلمات' },
  { id: 'spelling', label: 'تهجئة', icon: '🔤', description: 'تهجئة الكلمة' },
  { id: 'true_false', label: 'صح وخطأ', icon: '✅', description: 'حدد صحة الجملة' },
  { id: 'image_quiz', label: 'اختبار صور', icon: '🖼️', description: 'أسئلة بالصور' },
  { id: 'word_builder', label: 'بناء كلمات', icon: '🔨', description: 'كون كلمات' },
  { id: 'sequence', label: 'ترتيب تسلسلي', icon: '📊', description: 'رتب بالترتيب' },
  { id: 'adventure', label: 'مغامرة', icon: '🎮', description: 'لعبة متعددة المراحل' },
  { id: 'custom', label: 'مخصص', icon: '⚙️', description: 'أي تنسيق JSON' },
]

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'سهل', color: 'bg-green-100 text-green-700' },
  { id: 'medium', label: 'متوسط', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'hard', label: 'صعب', color: 'bg-red-100 text-red-700' },
]

const AGE_GROUPS = [
  { id: '5-7', label: '5-7 سنوات', color: 'bg-emerald-100 text-emerald-700' },
  { id: '7-9', label: '7-9 سنوات', color: 'bg-blue-100 text-blue-700' },
  { id: '9-11', label: '9-11 سنة', color: 'bg-purple-100 text-purple-700' },
  { id: '11-14', label: '11-14 سنة', color: 'bg-amber-100 text-amber-700' },
]

// Reward points options
const XP_REWARD_OPTIONS = [
  { id: 'none', label: 'بدون نقاط', value: 0, icon: '🚫' },
  { id: 'xp5', label: '5 نقاط', value: 5, icon: '⭐' },
  { id: 'xp10', label: '10 نقاط', value: 10, icon: '⭐' },
  { id: 'xp15', label: '15 نقطة', value: 15, icon: '🌟' },
  { id: 'xp20', label: '20 نقطة', value: 20, icon: '🌟' },
  { id: 'xp25', label: '25 نقطة', value: 25, icon: '✨' },
  { id: 'xp30', label: '30 نقطة', value: 30, icon: '✨' },
  { id: 'xp50', label: '50 نقطة', value: 50, icon: '🏆' },
  { id: 'xp100', label: '100 نقطة', value: 100, icon: '👑' },
]

const CATEGORIES = [
  { id: 'alphabet', label: 'الحروف', icon: '🔤' },
  { id: 'numbers', label: 'الأرقام', icon: '🔢' },
  { id: 'colors', label: 'الألوان', icon: '🎨' },
  { id: 'animals', label: 'الحيوانات', icon: '🦁' },
  { id: 'body', label: 'الجسم', icon: '🧒' },
  { id: 'food', label: 'الطعام', icon: '🍎' },
  { id: 'daily', label: 'يومي', icon: '🏠' },
  { id: 'family', label: 'العائلة', icon: '👨‍👩‍👧‍👦' },
  { id: 'school', label: 'المدرسة', icon: '🏫' },
  { id: 'nature', label: 'الطبيعة', icon: '🌿' },
]

// Smart JSON Parser - handles various formats
function smartParseJson(input: string): { 
  success: boolean; 
  data: any; 
  detectedType: string;
  normalizedConfig: string;
  error?: string;
} {
  try {
    let parsed = JSON.parse(input)
    let detectedType = 'custom'
    
    // Handle wrapped formats like {"game": {...}}
    if (parsed.game) {
      parsed = parsed.game
      detectedType = 'adventure'
    }
    
    // Detect game type from structure
    if (parsed.pairs && Array.isArray(parsed.pairs)) {
      detectedType = 'matching'
    } else if (parsed.cards && Array.isArray(parsed.cards)) {
      detectedType = 'memory'
    } else if (parsed.words && Array.isArray(parsed.words)) {
      if (parsed.words[0]?.scrambled) {
        detectedType = 'scramble'
      } else if (parsed.words[0]?.audio) {
        detectedType = 'spelling'
      }
    } else if (parsed.sentences && Array.isArray(parsed.sentences)) {
      detectedType = 'fill_blank'
    } else if (parsed.grid && parsed.words) {
      detectedType = 'word_search'
    } else if (parsed.statements && Array.isArray(parsed.statements)) {
      detectedType = 'true_false'
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      if (parsed.questions[0]?.image) {
        detectedType = 'image_quiz'
      }
    } else if (parsed.challenges && Array.isArray(parsed.challenges)) {
      detectedType = 'word_builder'
    } else if (parsed.sequences && Array.isArray(parsed.sequences)) {
      detectedType = 'sequence'
    } else if (parsed.gameplay && Array.isArray(parsed.gameplay)) {
      detectedType = 'adventure'
    }
    
    return {
      success: true,
      data: parsed,
      detectedType,
      normalizedConfig: JSON.stringify(parsed, null, 2)
    }
  } catch (e: any) {
    return {
      success: false,
      data: null,
      detectedType: 'custom',
      normalizedConfig: '{}',
      error: e.message
    }
  }
}

// Game config examples
const GAME_CONFIG_EXAMPLES: Record<string, string> = {
  matching: `{
  "pairs": [
    {"left": "A 🍎", "right": "أ - تفاحة"},
    {"left": "B 🏀", "right": "ب - كرة"},
    {"left": "C 🐱", "right": "ت - قطة"},
    {"left": "D 🐕", "right": "د - كلب"}
  ]
}`,
  memory: `{
  "cards": [
    {"word": "🍎 Apple", "translation": "تفاحة"},
    {"word": "🍌 Banana", "translation": "موزة"},
    {"word": "🍊 Orange", "translation": "برتقالة"},
    {"word": "🍇 Grapes", "translation": "عنب"}
  ]
}`,
  scramble: `{
  "words": [
    {"scrambled": "T A C", "original": "CAT", "hint": "🐱 قطة"},
    {"scrambled": "G O D", "original": "DOG", "hint": "🐕 كلب"}
  ]
}`,
  fill_blank: `{
  "sentences": [
    {
      "sentence": "I see a ___ in the sky.",
      "answer": "bird",
      "options": ["bird", "cat", "fish", "dog"],
      "hint": "🐦"
    }
  ]
}`,
  adventure: `{
  "name": "Alphabet Adventure",
  "description": "تعلم الحروف الإنجليزية",
  "instructions": "ساعد الشخصيات في إيجاد الحرف الصحيح!",
  "gameplay": [
    {
      "stage": 1,
      "instruction": "اختر الحرف الصحيح",
      "question": "أين الحرف 'A'؟",
      "choices": [
        {"letter": "A", "image": "🍎"},
        {"letter": "B", "image": "🏀"},
        {"letter": "C", "image": "🐱"}
      ],
      "correct_answer": "A"
    }
  ],
  "completion_message": "أحسنت! تعلمت حروفاً جديدة اليوم!",
  "feedback": {
    "correct": "ممتاز! إجابة صحيحة!",
    "incorrect": "حاول مرة أخرى!"
  }
}`,
  true_false: `{
  "statements": [
    {
      "statement": "القطة من الحيوانات الأليفة",
      "isTrue": true,
      "explanation": "نعم، القطة حيوان أليف"
    },
    {
      "statement": "السمكة تعيش على اليابسة",
      "isTrue": false,
      "explanation": "لا، السمكة تعيش في الماء"
    }
  ]
}`,
  image_quiz: `{
  "questions": [
    {
      "image": "🍎",
      "question": "ما هذه الفاكهة؟",
      "options": ["تفاحة", "موزة", "برتقالة"],
      "correctAnswer": 0
    }
  ]
}`,
  word_builder: `{
  "challenges": [
    {
      "letters": ["A", "P", "P", "L", "E"],
      "targetWord": "APPLE",
      "hint": "🍎 تفاحة"
    }
  ]
}`,
  sequence: `{
  "sequences": [
    {
      "items": ["1", "2", "3", "4", "5"],
      "shuffled": ["3", "1", "5", "2", "4"],
      "hint": "رتب الأرقام تصاعدياً"
    }
  ]
}`,
  custom: `{
  // ضع أي تنسيق JSON هنا
  // سيتم قبوله كما هو
}`
}

export function GamesQuizzesManager() {
  const [activeTab, setActiveTab] = useState('games')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Data states
  const [games, setGames] = useState<Game[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  
  // Dialog states
  const [showGameDialog, setShowGameDialog] = useState(false)
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null)
  
  // Smart paste state
  const [smartPasteMode, setSmartPasteMode] = useState(false)
  const [pasteInput, setPasteInput] = useState('')
  const [parseResult, setParseResult] = useState<ReturnType<typeof smartParseJson> | null>(null)
  
  // Form states
  const [gameForm, setGameForm] = useState<Partial<Game>>({
    title: '', titleAr: '', description: '', descriptionAr: '',
    category: 'alphabet', type: 'matching', difficulty: 'easy',
    ageGroup: '5-7', xpReward: 15, config: '{}', order: 0, isActive: true
  })
  
  const [quizForm, setQuizForm] = useState<Partial<Quiz>>({
    title: '', titleAr: '', description: '', descriptionAr: '',
    category: 'alphabet', type: 'multiple_choice', difficulty: 'easy',
    ageGroup: '5-7', xpReward: 15, timeLimit: 120, questions: '[]', order: 0, isActive: true
  })
  
  const [flashcardForm, setFlashcardForm] = useState<Partial<Flashcard>>({
    word: '', wordAr: '', translation: '', example: '',
    imageUrl: '', audioUrl: '', category: 'alphabet', ageGroup: '5-7', order: 0, isActive: true
  })
  
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

  // Fetch data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [gamesRes, quizzesRes, flashcardsRes] = await Promise.all([
        fetch('/api/kids/games'),
        fetch('/api/kids/quizzes'),
        fetch('/api/kids/flashcards')
      ])
      
      if (gamesRes.ok) setGames(await gamesRes.json())
      if (quizzesRes.ok) setQuizzes(await quizzesRes.json())
      if (flashcardsRes.ok) setFlashcards(await flashcardsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('حدث خطأ في تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Smart paste handler
  const handleSmartPaste = () => {
    if (!pasteInput.trim()) {
      toast.error('الرجاء إدخال كود JSON')
      return
    }
    
    const result = smartParseJson(pasteInput)
    setParseResult(result)
    
    if (result.success) {
      setGameForm(prev => ({
        ...prev,
        type: result.detectedType,
        config: result.normalizedConfig
      }))
      toast.success(`تم تحليل الكود بنجاح! النوع: ${GAME_TYPES.find(t => t.id === result.detectedType)?.label || result.detectedType}`)
    } else {
      toast.error(`خطأ في تحليل JSON: ${result.error}`)
    }
  }

  // Game handlers
  const handleSaveGame = async () => {
    if (!gameForm.title || !gameForm.titleAr || !gameForm.category) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    // Validate JSON
    const result = smartParseJson(gameForm.config || '{}')
    if (!result.success) {
      toast.error('خطأ في تنسيق JSON! ' + result.error)
      return
    }
    
    setIsSaving(true)
    try {
      const isEditing = !!editingGame
      const url = isEditing ? `/api/kids/games/${editingGame.id}` : '/api/kids/games'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gameForm,
          config: result.normalizedConfig
        })
      })
      
      if (response.ok) {
        toast.success(isEditing ? 'تم تحديث اللعبة' : 'تم إضافة اللعبة')
        setShowGameDialog(false)
        setEditingGame(null)
        resetGameForm()
        fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving game:', error)
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGame = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه اللعبة؟')) return
    
    try {
      const response = await fetch(`/api/kids/games/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('تم حذف اللعبة')
        fetchAllData()
      } else {
        toast.error('حدث خطأ في الحذف')
      }
    } catch (error) {
      console.error('Error deleting game:', error)
      toast.error('حدث خطأ في الحذف')
    }
  }

  const resetGameForm = () => {
    setGameForm({
      title: '', titleAr: '', description: '', descriptionAr: '',
      category: 'alphabet', type: 'matching', difficulty: 'easy',
      ageGroup: '5-7', xpReward: 15, config: '{}', order: 0, isActive: true
    })
    setSmartPasteMode(false)
    setPasteInput('')
    setParseResult(null)
  }

  // Quiz handlers
  const handleSaveQuiz = async () => {
    if (!quizForm.title || !quizForm.titleAr || !quizForm.category) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    try {
      const questions = JSON.parse(quizForm.questions || '[]')
      if (!Array.isArray(questions) || questions.length === 0) {
        toast.error('يجب إضافة سؤال واحد على الأقل')
        return
      }
    } catch {
      toast.error('خطأ في تنسيق JSON! تحقق من الأسئلة')
      return
    }
    
    setIsSaving(true)
    try {
      const isEditing = !!editingQuiz
      const url = isEditing ? `/api/kids/quizzes/${editingQuiz.id}` : '/api/kids/quizzes'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizForm)
      })
      
      if (response.ok) {
        toast.success(isEditing ? 'تم تحديث الاختبار' : 'تم إضافة الاختبار')
        setShowQuizDialog(false)
        setEditingQuiz(null)
        resetQuizForm()
        fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving quiz:', error)
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) return
    
    try {
      const response = await fetch(`/api/kids/quizzes/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('تم حذف الاختبار')
        fetchAllData()
      } else {
        toast.error('حدث خطأ في الحذف')
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      toast.error('حدث خطأ في الحذف')
    }
  }

  const resetQuizForm = () => {
    setQuizForm({
      title: '', titleAr: '', description: '', descriptionAr: '',
      category: 'alphabet', type: 'multiple_choice', difficulty: 'easy',
      ageGroup: '5-7', xpReward: 15, timeLimit: 120, questions: '[]', order: 0, isActive: true
    })
  }

  // Flashcard handlers
  const handleSaveFlashcard = async () => {
    if (!flashcardForm.word || !flashcardForm.wordAr) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    setIsSaving(true)
    try {
      const isEditing = !!editingFlashcard
      const url = isEditing ? `/api/kids/flashcards/${editingFlashcard.id}` : '/api/kids/flashcards'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flashcardForm)
      })
      
      if (response.ok) {
        toast.success(isEditing ? 'تم تحديث البطاقة' : 'تم إضافة البطاقة')
        setShowFlashcardDialog(false)
        setEditingFlashcard(null)
        resetFlashcardForm()
        fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving flashcard:', error)
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteFlashcard = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) return
    
    try {
      const response = await fetch(`/api/kids/flashcards/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('تم حذف البطاقة')
        fetchAllData()
      } else {
        toast.error('حدث خطأ في الحذف')
      }
    } catch (error) {
      console.error('Error deleting flashcard:', error)
      toast.error('حدث خطأ في الحذف')
    }
  }

  const resetFlashcardForm = () => {
    setFlashcardForm({
      word: '', wordAr: '', translation: '', example: '',
      imageUrl: '', audioUrl: '', category: 'alphabet', ageGroup: '5-7', order: 0, isActive: true
    })
  }
  
  // Generate audio for flashcard using TTS
  const handleGenerateAudio = async () => {
    if (!flashcardForm.word) {
      toast.error('الرجاء إدخال الكلمة أولاً')
      return
    }
    
    setIsGeneratingAudio(true)
    try {
      const response = await fetch(`/api/tts?text=${encodeURIComponent(flashcardForm.word)}&speed=0.8`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.audioData) {
          setFlashcardForm(prev => ({ ...prev, audioUrl: data.audioData }))
          toast.success('تم توليد الصوت بنجاح!')
        } else {
          toast.error('فشل في توليد الصوت')
        }
      } else {
        toast.error('فشل في توليد الصوت')
      }
    } catch (error) {
      console.error('Error generating audio:', error)
      toast.error('حدث خطأ في توليد الصوت')
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  // Filter helpers
  const filterItems = (items: any[], query: string) => {
    if (!query) return items
    return items.filter(item => 
      item.titleAr?.includes(query) || 
      item.title?.toLowerCase().includes(query.toLowerCase()) ||
      item.wordAr?.includes(query) ||
      item.word?.toLowerCase().includes(query.toLowerCase())
    )
  }

  // Stats
  const stats = {
    games: games.length,
    quizzes: quizzes.length,
    flashcards: flashcards.length,
    activeGames: games.filter(g => g.isActive).length,
    activeQuizzes: quizzes.filter(q => q.isActive).length,
    activeFlashcards: flashcards.filter(f => f.isActive).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-cyan-500" />
            إدارة الألعاب والاختبارات والبطاقات
          </h2>
          <p className="text-gray-500 text-sm">إدارة المحتوى التفاعلي للمستخدمين</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAllData()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
                <Gamepad2 className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.games}</p>
                <p className="text-sm text-gray-500">لعبة ({stats.activeGames} نشطة)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30">
                <Brain className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.quizzes}</p>
                <p className="text-sm text-gray-500">اختبار ({stats.activeQuizzes} نشطة)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <BookOpen className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.flashcards}</p>
                <p className="text-sm text-gray-500">بطاقة ({stats.activeFlashcards} نشطة)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <TabsTrigger value="games" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Gamepad2 className="w-4 h-4 ml-2" />
            الألعاب
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Brain className="w-4 h-4 ml-2" />
            الاختبارات
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 ml-2" />
            البطاقات
          </TabsTrigger>
        </TabsList>

        {/* Search and Add Bar */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ابحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          {activeTab === 'games' && (
            <Button
              onClick={() => { resetGameForm(); setEditingGame(null); setShowGameDialog(true) }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة لعبة
            </Button>
          )}
          {activeTab === 'quizzes' && (
            <Button
              onClick={() => { resetQuizForm(); setEditingQuiz(null); setShowQuizDialog(true) }}
              className="bg-gradient-to-r from-pink-500 to-rose-500"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة اختبار
            </Button>
          )}
          {activeTab === 'flashcards' && (
            <Button
              onClick={() => { resetFlashcardForm(); setEditingFlashcard(null); setShowFlashcardDialog(true) }}
              className="bg-gradient-to-r from-violet-500 to-purple-500"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة بطاقة
            </Button>
          )}
        </div>

        {/* Games Tab */}
        <TabsContent value="games" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filterItems(games, searchQuery).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 text-cyan-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد ألعاب</h3>
              <p className="text-gray-500">اضغط على "إضافة لعبة" لإنشاء لعبة جديدة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterItems(games, searchQuery).map((game, index) => {
                const gameType = GAME_TYPES.find(t => t.id === game.type)
                const category = CATEGORIES.find(c => c.id === game.category)
                
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn("group transition-all hover:shadow-lg", !game.isActive && "opacity-60")}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{gameType?.icon || '🎮'}</div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{game.titleAr}</h4>
                              <p className="text-xs text-gray-500">{game.title}</p>
                            </div>
                          </div>
                          <Badge className={cn("text-xs", game.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                            {game.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{game.descriptionAr}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">{category?.icon} {category?.label}</Badge>
                          {game.xpReward > 0 ? (
                            <Badge className="bg-amber-100 text-amber-700 text-xs"><Zap className="w-3 h-3 ml-1" />+{game.xpReward}</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 text-xs">بدون نقاط</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={async () => {
                            await fetch(`/api/kids/games/${game.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...game, isActive: !game.isActive })
                            })
                            fetchAllData()
                            toast.success(game.isActive ? 'تم تعطيل اللعبة' : 'تم تفعيل اللعبة')
                          }}>
                            {game.isActive ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                          </Button>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setGameForm(game); setEditingGame(game); setShowGameDialog(true) }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-rose-500" onClick={() => handleDeleteGame(game.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" /></CardContent></Card>)}
            </div>
          ) : filterItems(quizzes, searchQuery).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Brain className="w-10 h-10 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد اختبارات</h3>
              <p className="text-gray-500">اضغط على "إضافة اختبار" لإنشاء اختبار جديد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterItems(quizzes, searchQuery).map((quiz, index) => {
                let questions: any[] = []
                try {
                  questions = JSON.parse(quiz.questions || '[]')
                } catch {
                  questions = []
                }
                const category = CATEGORIES.find(c => c.id === quiz.category)
                
                return (
                  <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className={cn("group transition-all hover:shadow-lg", !quiz.isActive && "opacity-60")}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-900/30">
                              <Brain className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{quiz.titleAr}</h4>
                              <p className="text-xs text-gray-500">{quiz.title}</p>
                            </div>
                          </div>
                          <Badge className={cn("text-xs", quiz.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                            {quiz.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{quiz.descriptionAr}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">📝 {questions.length} سؤال</Badge>
                          {quiz.xpReward > 0 ? (
                            <Badge className="bg-amber-100 text-amber-700 text-xs"><Zap className="w-3 h-3 ml-1" />+{quiz.xpReward}</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 text-xs">بدون نقاط</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={async () => {
                            await fetch(`/api/kids/quizzes/${quiz.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...quiz, isActive: !quiz.isActive })
                            })
                            fetchAllData()
                            toast.success(quiz.isActive ? 'تم تعطيل الاختبار' : 'تم تفعيل الاختبار')
                          }}>
                            {quiz.isActive ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                          </Button>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setQuizForm(quiz); setEditingQuiz(quiz); setShowQuizDialog(true) }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-rose-500" onClick={() => handleDeleteQuiz(quiz.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" /></CardContent></Card>)}
            </div>
          ) : filterItems(flashcards, searchQuery).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-violet-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد بطاقات تعليمية</h3>
              <p className="text-gray-500">اضغط على "إضافة بطاقة" لإنشاء بطاقة جديدة</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filterItems(flashcards, searchQuery).map((card, index) => (
                <motion.div key={card.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.02 }}>
                  <Card className={cn("group transition-all hover:shadow-lg cursor-pointer", !card.isActive && "opacity-60")}>
                    <CardContent className="p-3 text-center">
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.word} className="w-12 h-12 mx-auto rounded-lg object-cover mb-2" />
                      ) : (
                        <div className="w-12 h-12 mx-auto rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
                          <BookOpen className="w-6 h-6 text-violet-500" />
                        </div>
                      )}
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{card.word}</h4>
                      <p className="text-xs text-gray-500 truncate">{card.wordAr}</p>
                      <div className="flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={(e) => { e.stopPropagation(); setFlashcardForm(card); setEditingFlashcard(card); setShowFlashcardDialog(true) }}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-rose-500" onClick={(e) => { e.stopPropagation(); handleDeleteFlashcard(card.id) }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Game Dialog with Smart Paste */}
      <Dialog open={showGameDialog} onOpenChange={setShowGameDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-500" />
              {editingGame ? 'تعديل اللعبة' : 'إضافة لعبة جديدة'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Smart Paste Section */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 p-4 rounded-xl border-2 border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardPaste className="w-5 h-5 text-cyan-600" />
                  <span className="font-bold text-cyan-700 dark:text-cyan-300">لصق ذكي</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSmartPasteMode(!smartPasteMode)}
                >
                  {smartPasteMode ? 'إغلاق' : 'لصق كود JSON'}
                </Button>
              </div>
              
              {smartPasteMode && (
                <div className="space-y-3">
                  <Textarea
                    value={pasteInput}
                    onChange={(e) => setPasteInput(e.target.value)}
                    placeholder='الصق أي كود JSON هنا... سيتم تحليله تلقائياً وتحويله للتنسيق الصحيح

مثال:
{"game": {"name": "...", "gameplay": [...]}}
أو
{"pairs": [...]}
أو أي تنسيق آخر...'
                    rows={8}
                    className="font-mono text-sm bg-white dark:bg-gray-900"
                  />
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSmartPaste} className="bg-gradient-to-r from-cyan-500 to-blue-500">
                      <Sparkles className="w-4 h-4 ml-2" />
                      تحليل وتحويل
                    </Button>
                    {parseResult && (
                      <Badge className={parseResult.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {parseResult.success ? `✓ ${GAME_TYPES.find(t => t.id === parseResult.detectedType)?.label}` : `✗ ${parseResult.error}`}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان بالعربية *</Label>
                <Input value={gameForm.titleAr || ''} onChange={(e) => setGameForm({ ...gameForm, titleAr: e.target.value })} placeholder="عنوان اللعبة بالعربية" />
              </div>
              <div className="space-y-2">
                <Label>العنوان بالإنجليزية *</Label>
                <Input value={gameForm.title || ''} onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })} placeholder="Game Title" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف بالعربية</Label>
                <Textarea value={gameForm.descriptionAr || ''} onChange={(e) => setGameForm({ ...gameForm, descriptionAr: e.target.value })} placeholder="وصف اللعبة بالعربية" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>الوصف بالإنجليزية</Label>
                <Textarea value={gameForm.description || ''} onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })} placeholder="Game description" rows={2} />
              </div>
            </div>
            
            {/* Game Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">نوع اللعبة</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {GAME_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setGameForm({ ...gameForm, type: type.id })}
                    className={cn(
                      "p-2 rounded-xl border-2 text-center transition-all",
                      gameForm.type === type.id
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-cyan-300"
                    )}
                  >
                    <div className="text-xl mb-1">{type.icon}</div>
                    <div className="text-[10px] font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Settings Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={gameForm.category || 'alphabet'} onValueChange={(v) => setGameForm({ ...gameForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الصعوبة</Label>
                <Select value={gameForm.difficulty || 'easy'} onValueChange={(v) => setGameForm({ ...gameForm, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTY_LEVELS.map(diff => <SelectItem key={diff.id} value={diff.id}>{diff.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الفئة العمرية</Label>
                <Select value={gameForm.ageGroup || '5-7'} onValueChange={(v) => setGameForm({ ...gameForm, ageGroup: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AGE_GROUPS.map(age => <SelectItem key={age.id} value={age.id}>{age.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نقاط المكافأة</Label>
                <Select 
                  value={gameForm.xpReward !== undefined ? String(gameForm.xpReward) : '15'} 
                  onValueChange={(v) => setGameForm({ ...gameForm, xpReward: parseInt(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {XP_REWARD_OPTIONS.map(opt => (
                      <SelectItem key={opt.id} value={String(opt.value)}>
                        {opt.icon} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* JSON Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">إعدادات اللعبة (JSON)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const example = GAME_CONFIG_EXAMPLES[gameForm.type || 'matching']
                    if (example) {
                      setGameForm({ ...gameForm, config: example })
                    }
                  }}
                >
                  <Sparkles className="w-4 h-4 ml-1" />
                  تحميل مثال
                </Button>
              </div>
              
              <Textarea 
                value={gameForm.config || '{}'} 
                onChange={(e) => setGameForm({ ...gameForm, config: e.target.value })} 
                placeholder='أدخل إعدادات اللعبة بتنسيق JSON' 
                rows={12} 
                className="font-mono text-sm bg-gray-50 dark:bg-gray-900 border-2" 
              />
              
              {/* Validation */}
              {gameForm.config && gameForm.config !== '{}' && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const result = smartParseJson(gameForm.config || '{}')
                    return result.success ? (
                      <Badge className="bg-green-100 text-green-700">
                        <Check className="w-3 h-3 ml-1" />
                        تنسيق صالح - {GAME_TYPES.find(t => t.id === result.detectedType)?.label || result.detectedType}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700">
                        <AlertCircle className="w-3 h-3 ml-1" />
                        {result.error}
                      </Badge>
                    )
                  })()}
                </div>
              )}
            </div>
            
            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="gameActive" checked={gameForm.isActive ?? true} onChange={(e) => setGameForm({ ...gameForm, isActive: e.target.checked })} className="w-4 h-4" />
              <Label htmlFor="gameActive">نشط</Label>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowGameDialog(false)}>إلغاء</Button>
            <Button onClick={handleSaveGame} disabled={isSaving} className="bg-gradient-to-r from-cyan-500 to-blue-500">
              {isSaving ? <RefreshCw className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-500" />
              {editingQuiz ? 'تعديل الاختبار' : 'إضافة اختبار جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان بالعربية *</Label>
                <Input value={quizForm.titleAr || ''} onChange={(e) => setQuizForm({ ...quizForm, titleAr: e.target.value })} placeholder="عنوان الاختبار بالعربية" />
              </div>
              <div className="space-y-2">
                <Label>العنوان بالإنجليزية *</Label>
                <Input value={quizForm.title || ''} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Quiz Title" />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={quizForm.category || 'alphabet'} onValueChange={(v) => setQuizForm({ ...quizForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الصعوبة</Label>
                <Select value={quizForm.difficulty || 'easy'} onValueChange={(v) => setQuizForm({ ...quizForm, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTY_LEVELS.map(diff => <SelectItem key={diff.id} value={diff.id}>{diff.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الفئة العمرية</Label>
                <Select value={quizForm.ageGroup || '5-7'} onValueChange={(v) => setQuizForm({ ...quizForm, ageGroup: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AGE_GROUPS.map(age => <SelectItem key={age.id} value={age.id}>{age.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نقاط المكافأة</Label>
                <Select 
                  value={quizForm.xpReward !== undefined ? String(quizForm.xpReward) : '15'} 
                  onValueChange={(v) => setQuizForm({ ...quizForm, xpReward: parseInt(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {XP_REWARD_OPTIONS.map(opt => (
                      <SelectItem key={opt.id} value={String(opt.value)}>
                        {opt.icon} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>الأسئلة (JSON)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const example = '[{"question":"ما هي الحرف الأول في الهجاء؟","options":["A","B","C","D"],"correctAnswer":0},{"question":"ما معنى Apple؟","options":["برتقال","تفاحة","موز","عنب"],"correctAnswer":1}]'
                    setQuizForm({ ...quizForm, questions: example })
                  }}
                >
                  تحميل مثال
                </Button>
              </div>
              <Textarea 
                value={quizForm.questions || '[]'} 
                onChange={(e) => setQuizForm({ ...quizForm, questions: e.target.value })} 
                placeholder='[{"question": "السؤال؟", "options": ["أ", "ب", "ج"], "correctAnswer": 0}]' 
                rows={8} 
                className="font-mono text-sm bg-gray-50 dark:bg-gray-900" 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="quizActive" checked={quizForm.isActive ?? true} onChange={(e) => setQuizForm({ ...quizForm, isActive: e.target.checked })} className="w-4 h-4" />
              <Label htmlFor="quizActive">نشط</Label>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowQuizDialog(false)}>إلغاء</Button>
            <Button onClick={handleSaveQuiz} disabled={isSaving} className="bg-gradient-to-r from-pink-500 to-rose-500">
              {isSaving ? <RefreshCw className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flashcard Dialog */}
      <Dialog open={showFlashcardDialog} onOpenChange={setShowFlashcardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-500" />
              {editingFlashcard ? 'تعديل البطاقة' : 'إضافة بطاقة جديدة'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكلمة بالإنجليزية *</Label>
                <div className="flex gap-2">
                  <Input value={flashcardForm.word || ''} onChange={(e) => setFlashcardForm({ ...flashcardForm, word: e.target.value })} placeholder="Word" className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio || !flashcardForm.word}
                    title="توليد نطق الكلمة"
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>الكلمة بالعربية *</Label>
                <Input value={flashcardForm.wordAr || ''} onChange={(e) => setFlashcardForm({ ...flashcardForm, wordAr: e.target.value })} placeholder="كلمة" />
              </div>
            </div>
            
            {/* Audio Preview */}
            {flashcardForm.audioUrl && (
              <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <Volume2 className="w-5 h-5 text-violet-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">النطق:</span>
                <audio controls className="h-8 flex-1">
                  <source src={flashcardForm.audioUrl} type="audio/wav" />
                </audio>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFlashcardForm(prev => ({ ...prev, audioUrl: '' }))}
                  className="text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>الترجمة</Label>
              <Input value={flashcardForm.translation || ''} onChange={(e) => setFlashcardForm({ ...flashcardForm, translation: e.target.value })} placeholder="Translation" />
            </div>
            
            <div className="space-y-2">
              <Label>مثال</Label>
              <Textarea value={flashcardForm.example || ''} onChange={(e) => setFlashcardForm({ ...flashcardForm, example: e.target.value })} placeholder="Example sentence" rows={2} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={flashcardForm.category || 'alphabet'} onValueChange={(v) => setFlashcardForm({ ...flashcardForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الفئة العمرية</Label>
                <Select value={flashcardForm.ageGroup || '5-7'} onValueChange={(v) => setFlashcardForm({ ...flashcardForm, ageGroup: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AGE_GROUPS.map(age => <SelectItem key={age.id} value={age.id}>{age.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="flashcardActive" checked={flashcardForm.isActive ?? true} onChange={(e) => setFlashcardForm({ ...flashcardForm, isActive: e.target.checked })} className="w-4 h-4" />
              <Label htmlFor="flashcardActive">نشط</Label>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowFlashcardDialog(false)}>إلغاء</Button>
            <Button onClick={handleSaveFlashcard} disabled={isSaving} className="bg-gradient-to-r from-violet-500 to-purple-500">
              {isSaving ? <RefreshCw className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
