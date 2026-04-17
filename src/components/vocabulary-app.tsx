'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Search, Star,
  Download, Upload, Moon, Sun, Menu, X,
  RefreshCw, Check, Volume2, Eye,
  Brain, Target, Award, Zap, Layers, Filter,
  Home, Library, PieChart, Gamepad2, Crown, Users, Settings, Baby,
  Flame, LogOut, VolumeX, ChevronRight, ChevronLeft, ChevronDown,
  Trophy, Clock, Shuffle, Lightbulb, Heart, Sparkles, FolderOpen, MessageSquare, FileText, Loader2, StickyNote,
  Keyboard, AlignLeft, Headphones, Timer, GraduationCap, Mic, Database, List, Route, Bell, BarChart3,
  Tv, Newspaper, Quote, Puzzle, CalendarDays, Video, Podcast, Wifi, WifiOff, LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useVocabStore, type Word } from '@/store/vocab-store'
import { AddWordDialog } from './add-word-dialog-local'
import { AddCategoryDialog } from './add-category-dialog-local'
import { NotesSection } from './notes-section'
import { StoriesSection } from './stories-section'
import { AdvancedStatsSection } from './advanced-stats-section'
import { AchievementsSystem } from './achievements-system'
import { LearningSection } from './learning-section'
import { VoiceFeatures } from './voice-features'
import { PWAFeatures } from './pwa-features'
import { AIAssistant } from './ai-assistant'
import { ImportExport } from './import-export'
import { AdvancedSettings } from './advanced-settings'
import { FocusMode } from './focus-mode'
import { DailyWidget } from './daily-widget'
import { CustomLists } from './custom-lists'
import { LearningPaths } from './learning-paths'
import { SmartNotifications } from './smart-notifications'
import { AdvancedAnalytics } from './advanced-analytics'
import { KidsLearning } from './kids-learning'
import { AdultsLearning } from './adults-learning'
import { LearningSectionSelector } from './learning-section-selector'
import { CommunityHub } from './community-hub'
import { RewardsStore } from './rewards-store'
import { LevelTest } from './level-test'
import { AdminDashboard } from './admin-dashboard'
import { AdminAnnouncements } from './admin-announcements'

// Level config
const levelConfig: Record<string, { color: string; bg: string; label: string; gradient: string }> = {
  beginner: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'مبتدئ', gradient: 'from-emerald-400 to-emerald-600' },
  intermediate: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'متوسط', gradient: 'from-amber-400 to-amber-600' },
  advanced: { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'متقدم', gradient: 'from-rose-400 to-rose-600' },
}

const partOfSpeechLabels: Record<string, string> = {
  noun: 'اسم', verb: 'فعل', adjective: 'صفة', adverb: 'ظرف',
  preposition: 'حرف جر', conjunction: 'حرف عطف', pronoun: 'ضمير', interjection: 'حرف تعجب',
}

// Sidebar navigation items with submenus support
interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  children?: { id: string; label: string; icon: LucideIcon }[]
}

const navItems: NavItem[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { 
    id: 'dictionary', 
    label: 'القاموس الذكي', 
    icon: BookOpen,
    children: [
      { id: 'words', label: 'الكلمات', icon: Library },
      { id: 'stories', label: 'القصص', icon: BookOpen },
      { id: 'notes', label: 'الملاحظات', icon: StickyNote },
      { id: 'lists', label: 'القوائم', icon: List },
      { id: 'review', label: 'المراجعة', icon: Brain },
      { id: 'games', label: 'الألعاب', icon: Gamepad2 },
    ]
  },
  { id: 'learning', label: 'التعلم', icon: GraduationCap },
  { id: 'paths', label: 'المسارات', icon: Route },
  { id: 'voice', label: 'الصوتيات', icon: Mic },
  { id: 'focus', label: 'وضع التركيز', icon: Timer },
  { id: 'ai', label: 'المساعد الذكي', icon: Sparkles },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'community', label: 'المجتمع', icon: Users },
  { id: 'rewards', label: 'المكافآت', icon: Trophy },
  { id: 'level-test', label: 'اختبار المستوى', icon: Target },
  { id: 'data', label: 'البيانات', icon: Database },
  { id: 'achievements', label: 'الإنجازات', icon: Trophy },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
  { id: 'admin', label: 'لوحة المؤسس', icon: Crown },
]

const avatarColors = ['from-emerald-500 to-teal-600', 'from-violet-500 to-purple-600', 'from-orange-500 to-amber-600', 'from-cyan-500 to-blue-600', 'from-rose-500 to-pink-600']

interface VocabularyAppProps {
  onLogout: () => void
}

export function VocabularyApp({ onLogout }: VocabularyAppProps) {
  const { words, categories, notes, stats, currentUserId, toggleFavorite, toggleLearned, deleteWord, updateWord, deleteCategory, getWordsForReview, recordReviewAnswer, completeReviewSession, exportData, importData, checkAndAwardAchievements, loadWords, loadCategories, loadStats, loadNotes, users } = useVocabStore()

  // Get current user from users list
  const currentUser = users.find(u => u.id === currentUserId)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [showOnlyLearned, setShowOnlyLearned] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [activeNav, setActiveNav] = useState('home')
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [isWordDetailOpen, setIsWordDetailOpen] = useState(false)

  // Export PDF state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportType, setExportType] = useState<'all' | 'category' | 'categories'>('all')
  const [exportCategory, setExportCategory] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  // Review state
  const [reviewWords, setReviewWords] = useState<Word[]>([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const [reviewScore, setReviewScore] = useState({ correct: 0, wrong: 0 })
  const [isReviewMode, setIsReviewMode] = useState(false)

  // Games state
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [gameWords, setGameWords] = useState<Word[]>([])
  const [gameIndex, setGameIndex] = useState(0)
  const [gameScore, setGameScore] = useState(0)
  const [gameOptions, setGameOptions] = useState<{ word: Word; options: string[] } | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [selectedPair, setSelectedPair] = useState<number | null>(null)
  const [matchingWords, setMatchingWords] = useState<{ id: number; word: string; translation: string; type: 'word' | 'translation' }[]>([])

  // New Games State
  const [spellingInput, setSpellingInput] = useState('')
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([])
  const [selectedLetters, setSelectedLetters] = useState<number[]>([])
  const [sentenceWords, setSentenceWords] = useState<{ word: string; index: number }[]>([])
  const [selectedSentenceWords, setSelectedSentenceWords] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [challengeScore, setChallengeScore] = useState(0)
  const [challengeWords, setChallengeWords] = useState<Word[]>([])
  const [timerActive, setTimerActive] = useState(false)

  // Speech synthesis
  const [speechSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Detect screen size for responsive sidebar
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Dark mode
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  // Handle navigation - close sidebar on mobile
  const handleNavigation = useCallback((nav: string) => {
    setActiveNav(nav)
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  // Filter words
  const filteredWords = useMemo(() => words.filter(word => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!word.word.toLowerCase().includes(query) && !word.translation.toLowerCase().includes(query)) return false
    }
    if (selectedCategory && word.categoryId !== selectedCategory) return false
    if (selectedLevel && word.level !== selectedLevel) return false
    if (showOnlyFavorites && !word.isFavorite) return false
    if (showOnlyLearned && !word.isLearned) return false
    return true
  }), [words, searchQuery, selectedCategory, selectedLevel, showOnlyFavorites, showOnlyLearned])

  const speak = useCallback((text: string) => {
    if (!speechSupported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [speechSupported])

  // Review functions
  const startReview = useCallback((mode: 'need-review' | 'random' = 'need-review') => {
    const wordsForReview = getWordsForReview(mode, 10)
    if (wordsForReview.length > 0) {
      setReviewWords(wordsForReview)
      setCurrentReviewIndex(0)
      setReviewScore({ correct: 0, wrong: 0 })
      setShowTranslation(false)
      setIsReviewMode(true)
      setActiveNav('review')
    } else {
      toast.info('لا توجد كلمات للمراجعة')
    }
  }, [getWordsForReview])

  const handleRecordReviewAnswer = useCallback((quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const currentWord = reviewWords[currentReviewIndex]
    recordReviewAnswer(currentWord.id, quality)
    const isCorrect = quality >= 3
    if (isCorrect) setReviewScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    else setReviewScore(prev => ({ ...prev, wrong: prev.wrong + 1 }))
    if (currentReviewIndex < reviewWords.length - 1) {
      setCurrentReviewIndex(prev => prev + 1)
      setShowTranslation(false)
    } else {
      completeReviewSession(reviewWords.length, reviewScore.correct + (isCorrect ? 1 : 0))
      toast.success(`انتهت المراجعة! النتيجة: ${reviewScore.correct + (isCorrect ? 1 : 0)}/${reviewWords.length}`)
      setIsReviewMode(false)
      loadStats()
      checkAndAwardAchievements()
    }
  }, [reviewWords, currentReviewIndex, recordReviewAnswer, completeReviewSession, loadStats, checkAndAwardAchievements, reviewScore.correct])

  // Export/Import
  const handleExport = useCallback(() => {
    try {
      const data = exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vocabulary_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('تم تصدير البيانات بنجاح')
    } catch { toast.error('فشل في تصدير البيانات') }
  }, [exportData])

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        importData(data)
        loadWords()
        loadCategories()
        loadStats()
        toast.success('تم استيراد البيانات بنجاح')
      } catch { toast.error('فشل في قراءة الملف') }
    }
    reader.readAsText(file)
    event.target.value = ''
  }, [importData, loadWords, loadCategories, loadStats])

  const userColorIndex = users.findIndex(u => u.id === currentUserId)
  const avatarColor = avatarColors[userColorIndex % avatarColors.length]

  // Export PDF function
  const handleExportPDF = useCallback(async () => {
    if (words.length === 0) {
      toast.error('لا توجد كلمات للتصدير')
      return
    }
    if (exportType === 'category' && !exportCategory) {
      toast.error('الرجاء اختيار تصنيف')
      return
    }
    setIsExporting(true)
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words,
          categories,
          userName: currentUser?.name || 'المستخدم',
          exportType,
          selectedCategory: exportType === 'category' ? exportCategory : null,
        }),
      })
      if (!response.ok) throw new Error('Failed to generate PDF')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vocabulary_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('تم تصدير الكلمات كـ PDF بنجاح')
      setIsExportDialogOpen(false)
    } catch {
      toast.error('فشل في تصدير PDF')
    } finally {
      setIsExporting(false)
    }
  }, [words, categories, currentUser, exportType, exportCategory])

  // ================== GAMES LOGIC ==================
  const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5)

  const generateQuizOptions = useCallback((word: Word, allWords: Word[]) => {
    const wrongOptions = allWords.filter(w => w.id !== word.id).slice(0, 3).map(w => w.translation)
    const options = shuffleArray([word.translation, ...wrongOptions])
    setGameOptions({ word, options })
  }, [])

  const startQuizGame = useCallback(() => {
    if (words.length < 4) { toast.error('تحتاج على الأقل 4 كلمات للعب'); return }
    const shuffled = shuffleArray(words).slice(0, Math.min(10, words.length))
    setGameWords(shuffled)
    setGameIndex(0)
    setGameScore(0)
    setActiveGame('quiz')
    generateQuizOptions(shuffled[0], shuffled)
  }, [words, generateQuizOptions])

  const handleQuizAnswer = (answer: string) => {
    const isCorrect = answer === gameOptions?.word.translation
    if (isCorrect) { setGameScore(prev => prev + 10); toast.success('إجابة صحيحة! +10 نقاط') }
    else { toast.error('إجابة خاطئة!') }
    if (gameIndex < gameWords.length - 1) {
      const nextIndex = gameIndex + 1
      setGameIndex(nextIndex)
      generateQuizOptions(gameWords[nextIndex], gameWords)
    } else {
      toast.success(`انتهت اللعبة! النتيجة: ${gameScore + (isCorrect ? 10 : 0)} نقطة`)
      setActiveGame(null)
      loadStats()
    }
  }

  const startMatchingGame = useCallback(() => {
    if (words.length < 4) { toast.error('تحتاج على الأقل 4 كلمات للعب'); return }
    const selected = shuffleArray(words).slice(0, 6)
    const pairs: { id: number; word: string; translation: string; type: 'word' | 'translation' }[] = []
    selected.forEach((w, i) => {
      pairs.push({ id: i, word: w.word, translation: w.translation, type: 'word' })
      pairs.push({ id: i, word: w.word, translation: w.translation, type: 'translation' })
    })
    setMatchingWords(shuffleArray(pairs))
    setMatchedPairs([])
    setSelectedPair(null)
    setGameScore(0)
    setActiveGame('matching')
  }, [words])

  const handleMatchingClick = (index: number) => {
    const clicked = matchingWords[index]
    if (matchedPairs.includes(index)) return
    if (selectedPair === null) {
      setSelectedPair(index)
    } else {
      const first = matchingWords[selectedPair]
      if (first.id === clicked.id && first.type !== clicked.type) {
        setMatchedPairs(prev => [...prev, selectedPair, index])
        setGameScore(prev => prev + 15)
        toast.success('مطابق! +15 نقاط')
        if (matchedPairs.length + 2 === matchingWords.length) {
          toast.success(`أحسنت! أنهيت اللعبة بـ ${gameScore + 15} نقطة`)
          setActiveGame(null)
          loadStats()
        }
      } else { toast.error('غير متطابق!') }
      setSelectedPair(null)
    }
  }

  const startSpeedGame = useCallback(() => {
    if (words.length < 5) { toast.error('تحتاج على الأقل 5 كلمات للعب'); return }
    const shuffled = shuffleArray(words).slice(0, 15)
    setGameWords(shuffled)
    setGameIndex(0)
    setGameScore(0)
    setActiveGame('speed')
  }, [words])

  const handleSpeedAnswer = (knows: boolean) => {
    if (knows) setGameScore(prev => prev + 5)
    if (gameIndex < gameWords.length - 1) {
      setGameIndex(prev => prev + 1)
    } else {
      toast.success(`انتهت اللعبة! حفظت ${gameScore + (knows ? 5 : 0)} نقطة`)
      setActiveGame(null)
      loadStats()
    }
  }

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false)
      toast.success(`انتهى الوقت! النتيجة: ${challengeScore} نقطة`)
      setActiveGame(null)
      loadStats()
    }
    return () => { if (interval) clearInterval(interval) }
  }, [timerActive, timeLeft, challengeScore, loadStats])

  const startSpellingGame = useCallback(() => {
    if (words.length < 3) { toast.error('تحتاج على الأقل 3 كلمات للعب'); return }
    const shuffled = shuffleArray(words).slice(0, Math.min(10, words.length))
    setGameWords(shuffled)
    setGameIndex(0)
    setGameScore(0)
    setSpellingInput('')
    setActiveGame('spelling')
  }, [words])

  const handleSpellingAnswer = () => {
    const currentWord = gameWords[gameIndex]
    const isCorrect = spellingInput.trim().toLowerCase() === currentWord.word.toLowerCase()
    if (isCorrect) { setGameScore(prev => prev + 15); toast.success('إجابة صحيحة! +15 نقاط') }
    else { toast.error(`إجابة خاطئة! الكلمة الصحيحة: ${currentWord.word}`) }
    if (gameIndex < gameWords.length - 1) {
      setGameIndex(prev => prev + 1)
      setSpellingInput('')
    } else {
      toast.success(`انتهت اللعبة! النتيجة: ${gameScore + (isCorrect ? 15 : 0)} نقطة`)
      setActiveGame(null)
      loadStats()
    }
  }

  const startScrambleGame = useCallback(() => {
    if (words.length < 3) { toast.error('تحتاج على الأقل 3 كلمات للعب'); return }
    const shuffled = shuffleArray(words).slice(0, Math.min(10, words.length))
    setGameWords(shuffled)
    setGameIndex(0)
    setGameScore(0)
    const letters = shuffled[0].word.split('').sort(() => Math.random() - 0.5)
    setScrambledLetters(letters)
    setSelectedLetters([])
    setActiveGame('scramble')
  }, [words])

  const handleScrambleClick = (index: number) => {
    if (selectedLetters.includes(index)) {
      setSelectedLetters(prev => prev.filter(i => i !== index))
    } else {
      const newSelected = [...selectedLetters, index]
      setSelectedLetters(newSelected)
      if (newSelected.length === scrambledLetters.length) {
        const formedWord = newSelected.map(i => scrambledLetters[i]).join('')
        const currentWord = gameWords[gameIndex]
        if (formedWord.toLowerCase() === currentWord.word.toLowerCase()) {
          setGameScore(prev => prev + 20)
          toast.success('أحسنت! +20 نقاط')
          if (gameIndex < gameWords.length - 1) {
            const nextIndex = gameIndex + 1
            setGameIndex(nextIndex)
            const letters = gameWords[nextIndex].word.split('').sort(() => Math.random() - 0.5)
            setScrambledLetters(letters)
            setSelectedLetters([])
          } else {
            toast.success(`انتهت اللعبة! النتيجة: ${gameScore + 20} نقطة`)
            setActiveGame(null)
            loadStats()
          }
        } else { toast.error('ترتيب خاطئ! حاول مرة أخرى'); setSelectedLetters([]) }
      }
    }
  }

  const startListeningGame = useCallback(() => {
    if (words.length < 4) { toast.error('تحتاج على الأقل 4 كلمات للعب'); return }
    if (!speechSupported) { toast.error('المتصفح لا يدعم خاصية النطق'); return }
    const shuffled = shuffleArray(words).slice(0, Math.min(10, words.length))
    setGameWords(shuffled)
    setGameIndex(0)
    setGameScore(0)
    generateQuizOptions(shuffled[0], shuffled)
    setActiveGame('listening')
    setTimeout(() => speak(shuffled[0].word), 500)
  }, [words, speechSupported, speak, generateQuizOptions])

  const handleListeningAnswer = (answer: string) => {
    const isCorrect = answer === gameOptions?.word.translation
    if (isCorrect) { setGameScore(prev => prev + 15); toast.success('إجابة صحيحة! +15 نقاط') }
    else { toast.error(`إجابة خاطئة! الترجمة: ${gameOptions?.word.translation}`) }
    if (gameIndex < gameWords.length - 1) {
      const nextIndex = gameIndex + 1
      setGameIndex(nextIndex)
      generateQuizOptions(gameWords[nextIndex], gameWords)
      setTimeout(() => speak(gameWords[nextIndex].word), 500)
    } else {
      toast.success(`انتهت اللعبة! النتيجة: ${gameScore + (isCorrect ? 15 : 0)} نقطة`)
      setActiveGame(null)
      loadStats()
    }
  }

  const startChallengeGame = useCallback(() => {
    if (words.length < 5) { toast.error('تحتاج على الأقل 5 كلمات للعب'); return }
    const shuffled = shuffleArray(words)
    setChallengeWords(shuffled)
    setChallengeScore(0)
    setTimeLeft(60)
    setTimerActive(true)
    setGameIndex(0)
    generateQuizOptions(shuffled[0], shuffled)
    setActiveGame('challenge')
  }, [words, generateQuizOptions])

  const handleChallengeAnswer = (answer: string) => {
    const isCorrect = answer === gameOptions?.word.translation
    if (isCorrect) { setChallengeScore(prev => prev + 10); toast.success('صحيح! +10') }
    else { toast.error('خطأ!') }
    if (gameIndex < challengeWords.length - 1) {
      const nextIndex = gameIndex + 1
      setGameIndex(nextIndex)
      generateQuizOptions(challengeWords[nextIndex], challengeWords)
    } else {
      const reshuffled = shuffleArray(challengeWords)
      setChallengeWords(reshuffled)
      setGameIndex(0)
      generateQuizOptions(reshuffled[0], reshuffled)
    }
  }

  // Word Card Component
  const WordCard = useCallback(({ word, index }: { word: Word; index: number }) => {
    const category = categories.find(c => c.id === word.categoryId)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.03 }} whileHover={{ y: -4 }} className="cursor-pointer" onClick={() => { setSelectedWord(word); setIsWordDetailOpen(true) }}>
        <Card className="h-full overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
          <div className="h-1.5" style={{ background: `linear-gradient(to left, ${category?.color || '#10B981'}, ${category?.color || '#10B981'}80)` }} />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{word.word}</h3>
                  {word.isFavorite && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                  {word.isLearned && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{word.translation}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
              {word.partOfSpeech && <Badge variant="secondary" className="rounded-lg text-xs">{partOfSpeechLabels[word.partOfSpeech] || word.partOfSpeech}</Badge>}
              <Badge className={cn("rounded-lg text-xs", levelConfig[word.level]?.bg, levelConfig[word.level]?.color)}>{levelConfig[word.level]?.label || word.level}</Badge>
              {category && <Badge variant="outline" className="rounded-lg text-xs" style={{ borderColor: category.color, color: category.color }}>{category.nameAr || category.name}</Badge>}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{word.nextReviewAt ? new Date(word.nextReviewAt) <= new Date() ? 'الآن' : `خلال ${Math.ceil((new Date(word.nextReviewAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} يوم` : 'جديد'}</span>
              </div>
              <span>الدقة: {word.reviewCount > 0 ? Math.round((word.correctCount / word.reviewCount) * 100) : 0}%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }, [categories])

  // ================== RENDER ==================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen || !isMobile ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className={cn("bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-50", isMobile ? "fixed left-0 top-0 h-full w-72" : "w-64")}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                <img src="/app-icon.png" alt="قاموسي الذكي" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">قاموسي</span>
            </div>
            {isMobile && (
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.id}>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 h-12 px-3 rounded-lg transition-colors duration-150",
                    (activeNav === item.id || (item.children?.some(child => child.id === activeNav)))
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => {
                    if (item.children) {
                      setExpandedMenu(expandedMenu === item.id ? null : item.id)
                    } else {
                      handleNavigation(item.id)
                    }
                  }}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-right">{item.label}</span>
                  {item.children && (
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", expandedMenu === item.id ? "rotate-180" : "")} />
                  )}
                </button>
                
                {/* Submenu Items */}
                <AnimatePresence>
                  {item.children && expandedMenu === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pr-4 py-1 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            className={cn(
                              "w-full flex items-center gap-3 h-10 px-3 rounded-lg transition-colors duration-150 text-sm",
                              activeNav === child.id 
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium" 
                                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                            )}
                            onClick={() => handleNavigation(child.id)}
                          >
                            <child.icon className="w-4 h-4 shrink-0" />
                            <span>{child.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10"><AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", avatarColor)}>{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate text-sm">{currentUser?.name || 'مستخدم'}</div>
              <div className="text-xs text-gray-500">المستوى {stats?.level || 1} • {stats?.xp || 0} XP</div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <button className="w-full flex items-center gap-3 h-11 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-sm">{darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
          </button>
          <button className="w-full flex items-center gap-3 h-11 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
            <span className="text-sm">تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-screen">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between md:hidden">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-gray-900 dark:text-white">
            {navItems.find(n => n.id === activeNav)?.label || navItems.find(n => n.children?.some(c => c.id === activeNav))?.children?.find(c => c.id === activeNav)?.label || 'الرئيسية'}
          </h1>
          <button className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
          {/* Desktop Page Header */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {navItems.find(n => n.id === activeNav)?.label || navItems.find(n => n.children?.some(c => c.id === activeNav))?.children?.find(c => c.id === activeNav)?.label || 'الرئيسية'}
              </h1>
              <p className="text-gray-500 text-sm">مرحباً، {currentUser?.name || 'مستخدم'}! 👋</p>
            </div>
            <div className="flex gap-2">
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleExport}><Download className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>تصدير JSON</TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <label className="cursor-pointer">
                  <Button variant="outline" size="icon" asChild><span><Upload className="w-4 h-4" /></span></Button>
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
              </TooltipTrigger><TooltipContent>استيراد</TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setIsExportDialogOpen(true)}><FileText className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>تصدير PDF</TooltipContent></Tooltip></TooltipProvider>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />إضافة كلمة</Button>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {/* Home Page */}
            {activeNav === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Hero */}
                <motion.div className="relative overflow-hidden rounded-2xl sm:rounded-3xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
                  <div className="relative px-4 sm:px-8 py-8 sm:py-12">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-right">
                        <Badge className="mb-3 bg-white/20 text-white border-0"><Zap className="w-3 h-3 mr-1" />يعمل بدون إنترنت</Badge>
                        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">قاموسي الذكي</h1>
                        <p className="text-white/80 mb-4 text-sm sm:text-base">تعلّم الإنجليزية بطريقة ممتعة وذكية</p>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          <Button size="sm" className="bg-white text-emerald-700 hover:bg-white/90 font-medium" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />أضف كلمة</Button>
                          <Button size="sm" className="bg-white/20 text-white border border-white/30 hover:bg-white/30 font-medium" onClick={() => startReview('need-review')}><Brain className="w-4 h-4 mr-1" />مراجعة</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4"><div className="text-2xl sm:text-3xl font-bold text-white">{stats?.totalWords || words.length}</div><div className="text-white/70 text-xs sm:text-sm">كلمة</div></div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4"><div className="text-2xl sm:text-3xl font-bold text-white">{stats?.learnedWords || 0}</div><div className="text-white/70 text-xs sm:text-sm">محفوظة</div></div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4"><div className="text-2xl sm:text-3xl font-bold text-white">{stats?.streak || 0}</div><div className="text-white/70 text-xs sm:text-sm">يوم متواصل</div></div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4"><div className="text-2xl sm:text-3xl font-bold text-white">{stats?.level || 1}</div><div className="text-white/70 text-xs sm:text-sm">المستوى</div></div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Admin Announcements - Prominent Position */}
                <AdminAnnouncements />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Brain, label: 'مراجعة ذكية', desc: 'راجع كلماتك', action: () => startReview('need-review'), color: 'from-violet-500 to-purple-600' },
                    { icon: Gamepad2, label: 'الألعاب', desc: 'تعلّم باللعب', action: () => handleNavigation('games'), color: 'from-orange-500 to-amber-600' },
                    { icon: Sparkles, label: 'المساعد الذكي', desc: 'أسئلة وإجابات', action: () => handleNavigation('ai'), color: 'from-cyan-500 to-blue-600' },
                    { icon: Trophy, label: 'الإنجازات', desc: 'تتبع تقدمك', action: () => handleNavigation('achievements'), color: 'from-rose-500 to-pink-600' },
                  ].map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <Card className="cursor-pointer hover:shadow-lg transition-all border-0" onClick={item.action}>
                        <CardContent className="p-4 text-center">
                          <div className={cn("w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br", item.color)}>
                            <item.icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-medium text-sm">{item.label}</h3>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Daily Widget */}
                <DailyWidget words={words} onStartReview={startReview} />

                {/* Recent Words */}
                {words.length > 0 && (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600" />أحدث الكلمات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {words.slice(0, 6).map((word, index) => (
                          <motion.div key={word.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{word.word}</span>
                                <span className="text-gray-500 mx-2">-</span>
                                <span className="text-sm text-gray-600">{word.translation}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => speak(word.word)}><Volume2 className="w-4 h-4" /></Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Words Page */}
            {activeNav === 'words' && (
              <motion.div key="words" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                {/* Search and Filters */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="ابحث عن كلمة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="التصنيف" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nameAr || c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="المستوى" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          <SelectItem value="beginner">مبتدئ</SelectItem>
                          <SelectItem value="intermediate">متوسط</SelectItem>
                          <SelectItem value="advanced">متقدم</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant={showOnlyFavorites ? "default" : "outline"} size="icon" onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={showOnlyFavorites ? "bg-amber-500 hover:bg-amber-600" : ""}>
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button variant={showOnlyLearned ? "default" : "outline"} size="icon" onClick={() => setShowOnlyLearned(!showOnlyLearned)} className={showOnlyLearned ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Words Grid */}
                {filteredWords.length === 0 ? (
                  <Card className="border-0 shadow-md">
                    <CardContent className="py-12 text-center">
                      <Library className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">لا توجد كلمات</p>
                      <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />أضف كلمة جديدة</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {filteredWords.map((word, index) => <WordCard key={word.id} word={word} index={index} />)}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* Review Page */}
            {activeNav === 'review' && !isReviewMode && (
              <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-600" />المراجعة الذكية</CardTitle>
                    <CardDescription>راجع كلماتك باستخدام خوارزمية التكرار المتباعد</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button className="h-24 flex-col bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700" onClick={() => startReview('need-review')}>
                        <Zap className="w-8 h-8 mb-2" />
                        <span>الكلمات المستحقة</span>
                        <span className="text-xs opacity-80">{words.filter(w => w.nextReviewAt && new Date(w.nextReviewAt) <= new Date()).length} كلمة</span>
                      </Button>
                      <Button className="h-24 flex-col bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700" onClick={() => startReview('random')}>
                        <Shuffle className="w-8 h-8 mb-2" />
                        <span>مراجعة عشوائية</span>
                        <span className="text-xs opacity-80">10 كلمات عشوائية</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Review Mode */}
            {activeNav === 'review' && isReviewMode && reviewWords[currentReviewIndex] && (
              <motion.div key="review-mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Card className="max-w-lg mx-auto shadow-xl">
                  <CardHeader className="text-center">
                    <div className="flex justify-between mb-2">
                      <Badge variant="outline">{currentReviewIndex + 1}/{reviewWords.length}</Badge>
                      <Badge className="bg-emerald-100 text-emerald-700"><Trophy className="w-3 h-3 mr-1" />{reviewScore.correct} صحيحة</Badge>
                    </div>
                    <Progress value={((currentReviewIndex + 1) / reviewWords.length) * 100} className="h-1" />
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <motion.div key={currentReviewIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                      <h2 className="text-3xl font-bold mb-4">{reviewWords[currentReviewIndex].word}</h2>
                      {speechSupported && <Button variant="outline" size="sm" className="mb-4" onClick={() => speak(reviewWords[currentReviewIndex].word)}><Volume2 className="w-4 h-4 mr-2" />استمع</Button>}
                      <AnimatePresence>
                        {showTranslation && (
                          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl text-gray-600 mb-6">{reviewWords[currentReviewIndex].translation}</motion.p>
                        )}
                      </AnimatePresence>
                      <Button variant="outline" className="mb-4" onClick={() => setShowTranslation(!showTranslation)}>{showTranslation ? <Eye className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}{showTranslation ? 'إخفاء' : 'إظهار'} الترجمة</Button>
                    </motion.div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <Button variant="outline" className="h-16 flex-col border-rose-200 hover:bg-rose-50 text-rose-600" onClick={() => handleRecordReviewAnswer(0)}><X className="w-6 h-6 mb-1" />لم أعرف</Button>
                      <Button variant="outline" className="h-16 flex-col border-amber-200 hover:bg-amber-50 text-amber-600" onClick={() => handleRecordReviewAnswer(3)}><RefreshCw className="w-6 h-6 mb-1" />صعب</Button>
                      <Button variant="outline" className="h-16 flex-col border-emerald-200 hover:bg-emerald-50 text-emerald-600" onClick={() => handleRecordReviewAnswer(5)}><Check className="w-6 h-6 mb-1" />سهل</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Games Page */}
            {activeNav === 'games' && !activeGame && (
              <motion.div key="games" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow border-0" onClick={startQuizGame}>
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-center text-white">
                        <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-1">اختيار من متعدد</h3>
                        <p className="text-sm opacity-80">اختر الترجمة الصحيحة</p>
                        <Badge className="mt-3 bg-white/20">+10 نقاط/إجابة</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow border-0" onClick={startMatchingGame}>
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-center text-white">
                        <Heart className="w-12 h-12 mx-auto mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-1">المطابقة</h3>
                        <p className="text-sm opacity-80">طابق الكلمات بالترجمات</p>
                        <Badge className="mt-3 bg-white/20">+15 نقاط/زوج</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow border-0" onClick={startSpeedGame}>
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-center text-white">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-1">السرعة</h3>
                        <p className="text-sm opacity-80">راجع كلماتك بسرعة</p>
                        <Badge className="mt-3 bg-white/20">+5 نقاط/كلمة</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow border-0" onClick={startSpellingGame}>
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-center text-white">
                        <Keyboard className="w-12 h-12 mx-auto mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-1">الإملاء</h3>
                        <p className="text-sm opacity-80">اكتب الكلمة من الترجمة</p>
                        <Badge className="mt-3 bg-white/20">+15 نقاط/إجابة</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow border-0" onClick={startScrambleGame}>
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-6 text-center text-white">
                        <Shuffle className="w-12 h-12 mx-auto mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-1">ترتيب الحروف</h3>
                        <p className="text-sm opacity-80">رتب الحروف المشوشة</p>
                        <Badge className="mt-3 bg-white/20">+20 نقاط/كلمة</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow border-0" onClick={startListeningGame}>
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-6 text-center text-white">
                        <Headphones className="w-12 h-12 mx-auto mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-1">الاستماع</h3>
                        <p className="text-sm opacity-80">استمع واختر الترجمة</p>
                        <Badge className="mt-3 bg-white/20">+15 نقاط/إجابة</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-xl transition-shadow border-0" onClick={startChallengeGame}>
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-red-500 to-orange-600 p-6 text-center text-white">
                        <Timer className="w-12 h-12 mx-auto mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-1">التحدي</h3>
                        <p className="text-sm opacity-80">60 ثانية - أجب بسرعة!</p>
                        <Badge className="mt-3 bg-white/20">+10 نقاط/إجابة</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Game Modes */}
            {activeNav === 'games' && activeGame && (
              <motion.div key={activeGame} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg mx-auto">
                {/* Quiz Game */}
                {activeGame === 'quiz' && gameOptions && (
                  <Card className="shadow-xl">
                    <CardHeader className="text-center">
                      <div className="flex justify-between mb-2">
                        <Badge variant="outline">{gameIndex + 1}/{gameWords.length}</Badge>
                        <Badge className="bg-amber-100 text-amber-700"><Trophy className="w-3 h-3 mr-1" />{gameScore}</Badge>
                      </div>
                      <Progress value={((gameIndex + 1) / gameWords.length) * 100} className="h-1" />
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                      <h2 className="text-3xl font-bold mb-6">{gameOptions.word.word}</h2>
                      <div className="grid grid-cols-1 gap-3">
                        {gameOptions.options.map((opt, i) => (
                          <Button key={i} variant="outline" className="h-12 text-lg justify-center" onClick={() => handleQuizAnswer(opt)}>{opt}</Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Matching Game */}
                {activeGame === 'matching' && (
                  <Card className="shadow-xl">
                    <CardHeader className="text-center">
                      <Badge className="bg-amber-100 text-amber-700"><Trophy className="w-3 h-3 mr-1" />{gameScore}</Badge>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-2">
                        {matchingWords.map((item, i) => (
                          <Button key={i} variant={matchedPairs.includes(i) ? "secondary" : selectedPair === i ? "default" : "outline"} className={cn("h-16 text-sm", matchedPairs.includes(i) && "opacity-50")} onClick={() => handleMatchingClick(i)} disabled={matchedPairs.includes(i)}>
                            {item.type === 'word' ? item.word : item.translation}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Speed Game */}
                {activeGame === 'speed' && gameWords[gameIndex] && (
                  <Card className="shadow-xl">
                    <CardHeader className="text-center">
                      <div className="flex justify-between mb-2">
                        <Badge variant="outline">{gameIndex + 1}/{gameWords.length}</Badge>
                        <Badge className="bg-amber-100 text-amber-700"><Trophy className="w-3 h-3 mr-1" />{gameScore}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                      <h2 className="text-3xl font-bold mb-2">{gameWords[gameIndex].word}</h2>
                      <p className="text-gray-500 mb-6">{gameWords[gameIndex].translation}</p>
                      <div className="flex gap-4">
                        <Button className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-600" onClick={() => handleSpeedAnswer(true)}><Check className="w-6 h-6 mr-2" />أعرفها</Button>
                        <Button className="flex-1 h-16 bg-rose-500 hover:bg-rose-600" onClick={() => handleSpeedAnswer(false)}><X className="w-6 h-6 mr-2" />لا أعرفها</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Spelling Game */}
                {activeGame === 'spelling' && gameWords[gameIndex] && (
                  <Card className="shadow-xl">
                    <CardHeader className="text-center">
                      <div className="flex justify-between mb-2">
                        <Badge variant="outline">{gameIndex + 1}/{gameWords.length}</Badge>
                        <Badge className="bg-amber-100 text-amber-700"><Trophy className="w-3 h-3 mr-1" />{gameScore}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500 mb-2">اكتب الكلمة الإنجليزية:</p>
                      <h2 className="text-2xl font-bold mb-4">{gameWords[gameIndex].translation}</h2>
                      <Input value={spellingInput} onChange={(e) => setSpellingInput(e.target.value)} placeholder="اكتب الكلمة..." className="text-center text-lg mb-4" onKeyPress={(e) => e.key === 'Enter' && handleSpellingAnswer()} />
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleSpellingAnswer}><Check className="w-4 h-4 mr-2" />تأكيد</Button>
                    </CardContent>
                  </Card>
                )}
                {/* Scramble Game */}
                {activeGame === 'scramble' && gameWords[gameIndex] && (
                  <Card className="shadow-xl">
                    <CardHeader className="text-center">
                      <div className="flex justify-between mb-2">
                        <Badge variant="outline">{gameIndex + 1}/{gameWords.length}</Badge>
                        <Badge className="bg-amber-100 text-amber-700"><Trophy className="w-3 h-3 mr-1" />{gameScore}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500 mb-2">رتب الحروف لتكوين الكلمة:</p>
                      <h2 className="text-xl font-bold mb-4">{gameWords[gameIndex].translation}</h2>
                      <div className="flex justify-center gap-2 mb-4 min-h-[48px] p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        {selectedLetters.length > 0 ? selectedLetters.map((i, idx) => (
                          <span key={idx} className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg font-bold">{scrambledLetters[i]}</span>
                        )) : <span className="text-gray-400">اضغط على الحروف لترتيبها</span>}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {scrambledLetters.map((letter, i) => (
                          <Button key={i} variant={selectedLetters.includes(i) ? "secondary" : "outline"} className={cn("w-12 h-12 text-xl font-bold", selectedLetters.includes(i) && "opacity-50")} onClick={() => handleScrambleClick(i)} disabled={selectedLetters.includes(i)}>{letter}</Button>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => setSelectedLetters([])}><RefreshCw className="w-4 h-4 mr-2" />إعادة المحاولة</Button>
                    </CardContent>
                  </Card>
                )}
                {/* Listening Game */}
                {activeGame === 'listening' && gameOptions && (
                  <Card className="shadow-xl">
                    <CardHeader className="text-center">
                      <div className="flex justify-between mb-2">
                        <Badge variant="outline">{gameIndex + 1}/{gameWords.length}</Badge>
                        <Badge className="bg-amber-100 text-amber-700"><Trophy className="w-3 h-3 mr-1" />{gameScore}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500 mb-4">استمع واختر الترجمة الصحيحة:</p>
                      <Button variant="outline" size="lg" className="w-24 h-24 rounded-full mb-6 border-4 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50" onClick={() => speak(gameOptions.word.word)}>
                        <Headphones className="w-12 h-12 text-emerald-600" />
                      </Button>
                      <p className="text-sm text-gray-500 mb-4">اضغط للاستماع مرة أخرى</p>
                      <div className="grid grid-cols-1 gap-3">
                        {gameOptions.options.map((opt, i) => (
                          <Button key={i} variant="outline" className="h-12 text-lg justify-center" onClick={() => handleListeningAnswer(opt)}>{opt}</Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Challenge Game */}
                {activeGame === 'challenge' && gameOptions && (
                  <Card className="shadow-xl">
                    <CardHeader className="text-center">
                      <div className="flex justify-between mb-2">
                        <Badge className={cn("text-lg px-3 py-1", timeLeft <= 10 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-cyan-100 text-cyan-700")}><Timer className="w-4 h-4 mr-1" />{timeLeft}s</Badge>
                        <Badge className="bg-amber-100 text-amber-700"><Trophy className="w-3 h-3 mr-1" />{challengeScore}</Badge>
                      </div>
                      <Progress value={(timeLeft / 60) * 100} className="h-2" />
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500 mb-2">اختر الترجمة بسرعة:</p>
                      <h2 className="text-3xl font-bold mb-6">{gameOptions.word.word}</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {gameOptions.options.map((opt, i) => (
                          <Button key={i} variant="outline" className="h-14 text-lg justify-center" onClick={() => handleChallengeAnswer(opt)}>{opt}</Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Button variant="ghost" className="w-full mt-4" onClick={() => { setActiveGame(null); setTimerActive(false); }}>إلغاء اللعبة</Button>
              </motion.div>
            )}

            {/* Other Pages */}
            {activeNav === 'stories' && (
              <motion.div key="stories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <StoriesSection currentUserId={currentUserId || ''} words={words} />
              </motion.div>
            )}
            {activeNav === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <NotesSection />
              </motion.div>
            )}
            {activeNav === 'lists' && (
              <motion.div key="lists" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <CustomLists onStartReview={(listWords) => { if (listWords.length > 0) { setReviewWords(listWords); setCurrentReviewIndex(0); setReviewScore({ correct: 0, wrong: 0 }); setShowTranslation(false); setIsReviewMode(true); setActiveNav('review'); } }} />
              </motion.div>
            )}
            {activeNav === 'paths' && (
              <motion.div key="paths" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <LearningPaths />
              </motion.div>
            )}
            {activeNav === 'learning' && (
              <motion.div key="learning" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <LearningSectionSelector words={words} userId={currentUserId || undefined} />
              </motion.div>
            )}
            {activeNav === 'voice' && (
              <motion.div key="voice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <VoiceFeatures words={words} onProgress={(result) => { if (result.passed) toast.success(`أحسنت! دقة ${result.accuracy}%`) }} />
              </motion.div>
            )}
            {activeNav === 'focus' && (
              <motion.div key="focus" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <FocusMode />
              </motion.div>
            )}
            {activeNav === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AIAssistant />
              </motion.div>
            )}
            {activeNav === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AdvancedAnalytics currentUserId={currentUserId || ''} words={words} categories={categories} />
              </motion.div>
            )}
            {activeNav === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <SmartNotifications currentUserId={currentUserId || ''} stats={{ wordsToReview: words.filter(w => w.nextReviewAt && new Date(w.nextReviewAt) <= new Date()).length, dailyGoalProgress: stats?.dailyGoalProgress || 0, currentStreak: stats?.currentStreak || 1 }} />
              </motion.div>
            )}
            {activeNav === 'data' && (
              <motion.div key="data" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ImportExport />
              </motion.div>
            )}
            {activeNav === 'community' && (
              <motion.div key="community" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <CommunityHub />
              </motion.div>
            )}
            {activeNav === 'rewards' && (
              <motion.div key="rewards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <RewardsStore />
              </motion.div>
            )}
            {activeNav === 'level-test' && (
              <motion.div key="level-test" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <LevelTest />
              </motion.div>
            )}
            {activeNav === 'achievements' && (
              <motion.div key="achievements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AchievementsSystem words={words} xp={stats?.xp || 0} level={stats?.level || 1} streak={stats?.streak || 0} longestStreak={stats?.longestStreak || 0} achievements={currentUser?.achievements || []} />
              </motion.div>
            )}
            {activeNav === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-600" />الإعدادات العامة</CardTitle>
                  </CardHeader>
                  <CardContent><AdvancedSettings /></CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-emerald-600" />إعدادات PWA</CardTitle>
                  </CardHeader>
                  <CardContent><PWAFeatures /></CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-600" />الإحصائيات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdvancedStatsSection words={words} xp={stats?.xp || 0} level={stats?.level || 1} streak={stats?.streak || 0} longestStreak={stats?.longestStreak || 0} achievements={currentUser?.achievements || []} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {activeNav === 'admin' && (
              <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AdminDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Dialogs */}
      <AddWordDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <AddCategoryDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen} />
      
      {/* Export PDF Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" />تصدير الكلمات كـ PDF</DialogTitle>
            <DialogDescription>اختر طريقة التصدير المناسبة لك</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">طريقة التصدير</Label>
              <div className="grid grid-cols-1 gap-2">
                <Button variant={exportType === 'all' ? 'default' : 'outline'} className={`justify-start h-auto py-3 ${exportType === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setExportType('all')}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${exportType === 'all' ? 'border-white bg-white' : 'border-gray-400'}`}>
                      {exportType === 'all' && <Check className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">جميع الكلمات (A-Z)</div>
                      <div className="text-xs opacity-70">ترتيب أبجدي لجميع الكلمات</div>
                    </div>
                  </div>
                </Button>
                <Button variant={exportType === 'categories' ? 'default' : 'outline'} className={`justify-start h-auto py-3 ${exportType === 'categories' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setExportType('categories')}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${exportType === 'categories' ? 'border-white bg-white' : 'border-gray-400'}`}>
                      {exportType === 'categories' && <Check className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">جميع التصنيفات</div>
                      <div className="text-xs opacity-70">كل تصنيف مع كلماته بشكل منسق</div>
                    </div>
                  </div>
                </Button>
                <Button variant={exportType === 'category' ? 'default' : 'outline'} className={`justify-start h-auto py-3 ${exportType === 'category' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setExportType('category')}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${exportType === 'category' ? 'border-white bg-white' : 'border-gray-400'}`}>
                      {exportType === 'category' && <Check className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">تصنيف محدد</div>
                      <div className="text-xs opacity-70">تصدير تصنيف واحد فقط</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
            {exportType === 'category' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">اختر التصنيف</Label>
                <Select value={exportCategory} onValueChange={setExportCategory}>
                  <SelectTrigger><SelectValue placeholder="اختر تصنيف..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const wordCount = words.filter(w => w.categoryId === cat.id).length
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span>{cat.nameAr || cat.name}</span>
                            <Badge variant="secondary" className="text-xs">{wordCount} كلمة</Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {exportType === 'category' && exportCategory ? words.filter(w => w.categoryId === exportCategory).length : words.length}
              </div>
              <div className="text-xs text-gray-500">كلمة سيتم تصديرها</div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleExportPDF} disabled={isExporting || (exportType === 'category' && !exportCategory)}>
              {isExporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري التصدير...</> : <><FileText className="w-4 h-4 mr-2" />تصدير PDF</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Word Detail Dialog */}
      <Dialog open={isWordDetailOpen} onOpenChange={setIsWordDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedWord && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    {selectedWord.word}
                    {speechSupported && <Button variant="ghost" size="icon" onClick={() => speak(selectedWord.word)}><Volume2 className="w-5 h-5 text-emerald-600" /></Button>}
                  </DialogTitle>
                </div>
                {selectedWord.pronunciation && <p className="text-gray-500">/{selectedWord.pronunciation}/</p>}
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-xl text-gray-700 dark:text-gray-300">{selectedWord.translation}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWord.partOfSpeech && <Badge variant="secondary">{partOfSpeechLabels[selectedWord.partOfSpeech]}</Badge>}
                  <Badge className={levelConfig[selectedWord.level]?.bg}>{levelConfig[selectedWord.level]?.label}</Badge>
                  {selectedWord.categoryId && categories.find(c => c.id === selectedWord.categoryId) && (
                    <Badge variant="outline" style={{ borderColor: categories.find(c => c.id === selectedWord.categoryId)?.color, color: categories.find(c => c.id === selectedWord.categoryId)?.color }}>
                      {categories.find(c => c.id === selectedWord.categoryId)?.nameAr || categories.find(c => c.id === selectedWord.categoryId)?.name}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500 flex items-center gap-1"><FolderOpen className="w-4 h-4" />تغيير التصنيف</Label>
                  <Select value={selectedWord.categoryId || "none"} onValueChange={(v) => { const newCategoryId = v === "none" ? undefined : v; updateWord(selectedWord.id, { categoryId: newCategoryId }); setSelectedWord({ ...selectedWord, categoryId: newCategoryId }); toast.success('تم تحديث التصنيف'); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون تصنيف</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} /><span>{c.nameAr || c.name}</span></div></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant={selectedWord.isFavorite ? "default" : "outline"} className="flex-1" onClick={() => { toggleFavorite(selectedWord.id); setSelectedWord({ ...selectedWord, isFavorite: !selectedWord.isFavorite }); toast.success(selectedWord.isFavorite ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة'); }}>
                    <Star className={cn("w-4 h-4 mr-2", selectedWord.isFavorite && "fill-current")} />{selectedWord.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  </Button>
                  <Button variant={selectedWord.isLearned ? "default" : "outline"} className="flex-1" onClick={() => { toggleLearned(selectedWord.id); setSelectedWord({ ...selectedWord, isLearned: !selectedWord.isLearned }); toast.success(selectedWord.isLearned ? 'تمت الإزالة من المحفوظة' : 'تمت الإضافة للمحفوظة'); }}>
                    <Check className="w-4 h-4 mr-2" />{selectedWord.isLearned ? 'غير محفوظة' : 'تم الحفظ'}
                  </Button>
                </div>
                
                <Button variant="destructive" className="w-full" onClick={() => { deleteWord(selectedWord.id); setIsWordDetailOpen(false); toast.success('تم حذف الكلمة'); }}>
                  <X className="w-4 h-4 mr-2" />حذف الكلمة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
