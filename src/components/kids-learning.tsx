'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Baby, Play, Check, Clock, BookOpen, Award,
  Star, Heart, Video, Music, Gamepad2,
  Palette, Cat, Apple, Home,
  Crown, Sparkles, Tv, ExternalLink,
  GraduationCap, StickyNote, Pin, FileText, Maximize2,
  X, Search, Filter, ChevronLeft, ChevronRight,
  TrendingUp, Target, Zap, RefreshCw, Rocket, Medal,
  Brain, Trophy, Flame, Coins, Gift, Puzzle,
  Timer, HelpCircle, Lightbulb, ThumbsUp, Shuffle,
  Volume2, VolumeX, RotateCcw, ArrowRight, Pause
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// أنواع المحتوى
interface KidsContent {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  category: string
  type: 'video' | 'song' | 'story' | 'game' | 'activity'
  videoUrl?: string
  thumbnailUrl?: string
  duration: number
  ageGroup: '5-7' | '7-9' | '9-11' | '11-14'
  difficulty: 'easy' | 'medium' | 'hard'
  isFavorite: boolean
  isWatched: boolean
  progress: number
  isAdmin?: boolean
  createdAt: string
  updatedAt: string
}

// تصنيفات المحتوى
const categories = [
  { id: 'alphabet', label: 'الحروف', labelEn: 'Alphabet', icon: '🔤', color: 'from-rose-400 to-pink-500', borderColor: 'border-rose-300' },
  { id: 'numbers', label: 'الأرقام', labelEn: 'Numbers', icon: '🔢', color: 'from-amber-400 to-orange-500', borderColor: 'border-amber-300' },
  { id: 'colors', label: 'الألوان', labelEn: 'Colors', icon: '🎨', color: 'from-violet-400 to-purple-500', borderColor: 'border-violet-300' },
  { id: 'animals', label: 'الحيوانات', labelEn: 'Animals', icon: '🦁', color: 'from-emerald-400 to-teal-500', borderColor: 'border-emerald-300' },
  { id: 'songs', label: 'الأغاني', labelEn: 'Songs', icon: '🎵', color: 'from-cyan-400 to-blue-500', borderColor: 'border-cyan-300' },
  { id: 'stories', label: 'القصص', labelEn: 'Stories', icon: '📖', color: 'from-pink-400 to-rose-500', borderColor: 'border-pink-300' },
  { id: 'games', label: 'الألعاب', labelEn: 'Games', icon: '🎮', color: 'from-green-400 to-emerald-500', borderColor: 'border-green-300' },
  { id: 'daily', label: 'يومي', labelEn: 'Daily', icon: '🏠', color: 'from-sky-400 to-cyan-500', borderColor: 'border-sky-300' },
  { id: 'body', label: 'الجسم', labelEn: 'Body', icon: '🧒', color: 'from-fuchsia-400 to-pink-500', borderColor: 'border-fuchsia-300' },
  { id: 'food', label: 'الطعام', labelEn: 'Food', icon: '🍎', color: 'from-red-400 to-rose-500', borderColor: 'border-red-300' }
]

// الفئات العمرية الجديدة
const ageGroups = [
  { id: '5-7', label: '5-7 سنوات', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: '7-9', label: '7-9 سنوات', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: '9-11', label: '9-11 سنوات', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: '11-14', label: '11-14 سنة', color: 'bg-amber-100 text-amber-700 border-amber-200' }
]

interface KidsLearningProps {
  userId?: string
}

export function KidsLearning({ userId }: KidsLearningProps) {
  const [content, setContent] = useState<KidsContent[]>([])
  const [adminContent, setAdminContent] = useState<KidsContent[]>([])
  const [adminLessons, setAdminLessons] = useState<any[]>([])
  const [adminNotes, setAdminNotes] = useState<any[]>([])
  const [localCategories, setLocalCategories] = useState<any[]>([])
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('videos')
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [selectedContent, setSelectedContent] = useState<KidsContent | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null)
  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [watchedLessons, setWatchedLessons] = useState<string[]>([])
  const [watchedNotes, setWatchedNotes] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // New states for quizzes, games, challenges, flashcards
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [userProgress, setUserProgress] = useState({ xp: 0, level: 1, streak: 0, coins: 0 })
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null)
  const [selectedGame, setSelectedGame] = useState<any | null>(null)
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [showGameDialog, setShowGameDialog] = useState(false)
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Game states
  const [isPlayingGame, setIsPlayingGame] = useState(false)
  const [gameConfig, setGameConfig] = useState<any>(null)
  const [gameScore, setGameScore] = useState(0)
  
  // Memory game states
  const [memoryCards, setMemoryCards] = useState<any[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  
  // Matching game states
  const [matchingPairs, setMatchingPairs] = useState<any[]>([])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [matchedMatching, setMatchedMatching] = useState<string[]>([])
  
  // Scramble game states
  const [scrambleWords, setScrambleWords] = useState<any[]>([])
  const [currentScrambleIndex, setCurrentScrambleIndex] = useState(0)
  const [scrambleInput, setScrambleInput] = useState('')
  const [scrambleScore, setScrambleScore] = useState(0)
  
  // Listening game states
  const [listeningLetters, setListeningLetters] = useState<any[]>([])
  const [currentListeningLetter, setCurrentListeningLetter] = useState<any | null>(null)
  const [listeningProgress, setListeningProgress] = useState(0)
  const [listeningScore, setListeningScore] = useState(0)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [shuffledLetters, setShuffledLetters] = useState<any[]>([])

  // تحميل المحتوى
  useEffect(() => {
    const loadData = async () => {
      const savedContent = localStorage.getItem('kids-learning-content')
      if (savedContent) {
        try {
          setContent(JSON.parse(savedContent))
        } catch {
          setContent([])
        }
      } else {
        setContent([])
      }

      const savedCategories = localStorage.getItem('kids-learning-categories')
      if (savedCategories) {
        try {
          setLocalCategories(JSON.parse(savedCategories))
        } catch {
          setLocalCategories([])
        }
      }

      const savedWatchedLessons = localStorage.getItem('watched-lessons')
      if (savedWatchedLessons) {
        try {
          setWatchedLessons(JSON.parse(savedWatchedLessons))
        } catch {
          setWatchedLessons([])
        }
      }

      const savedWatchedNotes = localStorage.getItem('watched-notes')
      if (savedWatchedNotes) {
        try {
          setWatchedNotes(JSON.parse(savedWatchedNotes))
        } catch {
          setWatchedNotes([])
        }
      }

      const savedWatchedVideos = localStorage.getItem('watched-videos')
      if (savedWatchedVideos) {
        try {
          const watchedIds = JSON.parse(savedWatchedVideos)
          setContent(prev => prev.map(item => ({
            ...item,
            isWatched: watchedIds.includes(item.id)
          })))
        } catch {
          // ignore
        }
      }

      try {
        // Load watched videos from localStorage first
        const savedWatchedVideos = localStorage.getItem('watched-videos')
        const watchedVideoIds: string[] = savedWatchedVideos ? JSON.parse(savedWatchedVideos) : []
        
        const videosResponse = await fetch('/api/admin/videos')
        if (videosResponse.ok) {
          const adminVideos = await videosResponse.json()
          const formattedAdminContent: KidsContent[] = adminVideos.map((v: any) => {
            const videoId = `admin-${v.id}`
            const isWatched = watchedVideoIds.includes(videoId)
            return {
              id: videoId,
              title: v.title,
              titleAr: v.titleAr,
              description: v.description,
              descriptionAr: v.descriptionAr,
              category: v.category,
              type: v.type as KidsContent['type'],
              videoUrl: v.url,
              thumbnailUrl: v.thumbnail,
              duration: v.duration,
              ageGroup: v.ageGroup as KidsContent['ageGroup'] || '5-7',
              difficulty: v.difficulty as KidsContent['difficulty'] || 'easy',
              isFavorite: false,
              isWatched,
              progress: isWatched ? 100 : 0,
              createdAt: v.createdAt,
              updatedAt: v.updatedAt,
              isAdmin: true
            }
          })
          setAdminContent(formattedAdminContent)
        }

        const lessonsResponse = await fetch('/api/admin/lessons')
        if (lessonsResponse.ok) {
          const lessons = await lessonsResponse.json()
          setAdminLessons(lessons)
        }

        const notesResponse = await fetch('/api/admin/notes')
        if (notesResponse.ok) {
          const notes = await notesResponse.json()
          setAdminNotes(notes)
        }

        const categoriesResponse = await fetch('/api/admin/categories?type=kids&includeInactive=true')
        if (categoriesResponse.ok) {
          const adminCats = await categoriesResponse.json()
          setAdminCategories(adminCats)
        }

        // Fetch quizzes
        const quizzesResponse = await fetch('/api/kids/quizzes')
        if (quizzesResponse.ok) {
          const quizzesData = await quizzesResponse.json()
          setQuizzes(quizzesData)
        }

        // Fetch games
        const gamesResponse = await fetch('/api/kids/games')
        if (gamesResponse.ok) {
          const gamesData = await gamesResponse.json()
          setGames(gamesData)
        }

        // Fetch challenges
        const challengesResponse = await fetch('/api/kids/challenges')
        if (challengesResponse.ok) {
          const challengesData = await challengesResponse.json()
          setChallenges(challengesData)
        }

        // Fetch flashcards
        const flashcardsResponse = await fetch('/api/kids/flashcards')
        if (flashcardsResponse.ok) {
          const flashcardsData = await flashcardsResponse.json()
          setFlashcards(flashcardsData)
        }

        // Load user progress - from API if userId exists, otherwise from localStorage
        if (userId) {
          try {
            const progressResponse = await fetch(`/api/kids/progress/user?userId=${userId}`)
            if (progressResponse.ok) {
              const progressData = await progressResponse.json()
              setUserProgress({
                xp: progressData.xp || 0,
                level: progressData.level || 1,
                streak: progressData.currentStreak || 0,
                coins: progressData.coins || 0
              })
            }
          } catch (error) {
            console.error('Error fetching user progress:', error)
          }
        } else {
          // Fallback to localStorage for anonymous users
          const savedProgress = localStorage.getItem('kids-user-progress')
          if (savedProgress) {
            try {
              setUserProgress(JSON.parse(savedProgress))
            } catch {
              // ignore
            }
          }
        }
      } catch (error) {
        console.error('Error loading admin content:', error)
      }

      setIsLoading(false)
    }
    loadData()
  }, [userId])

  // Function to update progress (saves to API if userId exists, otherwise to localStorage)
  const updateProgress = useCallback(async (updates: Partial<typeof userProgress>) => {
    const newProgress = { ...userProgress, ...updates }
    setUserProgress(newProgress)

    if (userId) {
      try {
        await fetch('/api/kids/progress/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            action: 'update',
            data: updates
          })
        })
      } catch (error) {
        console.error('Error saving progress:', error)
      }
    } else {
      localStorage.setItem('kids-user-progress', JSON.stringify(newProgress))
    }
  }, [userId, userProgress])

  const saveContent = useCallback((newContent: KidsContent[]) => {
    setContent(newContent)
    localStorage.setItem('kids-learning-content', JSON.stringify(newContent))
  }, [])

  const toggleFavorite = (id: string) => {
    const updatedContent = content.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    saveContent(updatedContent)
  }

  const markLessonAsWatched = (id: string) => {
    const newWatched = [...new Set([...watchedLessons, id])]
    setWatchedLessons(newWatched)
    localStorage.setItem('watched-lessons', JSON.stringify(newWatched))
  }

  const markNoteAsWatched = (id: string) => {
    const newWatched = [...new Set([...watchedNotes, id])]
    setWatchedNotes(newWatched)
    localStorage.setItem('watched-notes', JSON.stringify(newWatched))
  }

  const markVideoAsWatched = (id: string) => {
    // Update local content if exists
    const updatedContent = content.map(item =>
      item.id === id ? { ...item, isWatched: true, progress: 100 } : item
    )
    saveContent(updatedContent)
    
    // Update admin content if exists
    setAdminContent(prev => prev.map(item =>
      item.id === id ? { ...item, isWatched: true, progress: 100 } : item
    ))
    
    // Save to localStorage
    const watchedVideos = JSON.parse(localStorage.getItem('watched-videos') || '[]')
    const newWatched = [...new Set([...watchedVideos, id])]
    localStorage.setItem('watched-videos', JSON.stringify(newWatched))
    
    // Update progress in database if userId exists
    if (userId) {
      fetch('/api/kids/progress/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'watch_video',
          data: { videoId: id }
        })
      }).catch(error => console.error('Error updating progress:', error))
    }
    
    // Close the video dialog
    setShowVideoDialog(false)
    
    // Show success toast
    toast.success('تم تسجيل المشاهدة! 🎉 +5 نقاط')
    
    // Update local progress
    updateProgress({ 
      xp: userProgress.xp + 5,
      coins: userProgress.coins + 2
    })
  }

  const allCategories = useMemo(() => {
    // Get IDs of deleted categories (isActive === false) from adminCategories
    const deletedIds = adminCategories
      .filter((cat: any) => cat.isActive === false)
      .map((cat: any) => cat.id)
    
    // Start with admin categories from database (only active ones)
    const dbFormatted = adminCategories
      .filter((cat: any) => cat.isActive !== false) // Exclude deleted categories
      .map((cat: any) => ({
        id: cat.id,
        label: cat.nameAr,
        labelEn: cat.name,
        icon: cat.icon || '📁',
        color: `from-${(cat.color || '#10B981').replace('#', '')}-400 to-${(cat.color || '#10B981').replace('#', '')}-500`,
        borderColor: `border-${(cat.color || '#10B981').replace('#', '')}-300`,
        isAdmin: true,
        existsInDb: true
      }))
    
    // Get IDs of categories from database
    const dbIds = dbFormatted.map((c: any) => c.id)
    
    // Add default categories only if:
    // 1. They don't exist in database AND
    // 2. They haven't been deleted (not in deletedIds)
    const defaultCategories = categories
      .filter(cat => !dbIds.includes(cat.id) && !deletedIds.includes(cat.id))
      .map(cat => ({
        ...cat,
        isDefault: true,
        existsInDb: false
      }))
    
    // Add local categories from localStorage (only those not in database, defaults, or deleted)
    const localFormatted = localCategories
      .filter((cat: any) => 
        !dbIds.includes(cat.id) && 
        !deletedIds.includes(cat.id) &&
        !dbIds.includes(cat.id.replace('local-', '')) &&
        !deletedIds.includes(cat.id.replace('local-', ''))
      )
      .map((cat: any) => ({
        id: `local-${cat.id}`,
        label: cat.nameAr,
        labelEn: cat.name,
        icon: cat.emoji || '📁',
        color: `from-${cat.color}-400 to-${cat.color}-500`,
        borderColor: `border-${cat.color}-300`,
        isLocal: true
      }))
    
    return [...dbFormatted, ...defaultCategories, ...localFormatted]
  }, [localCategories, adminCategories])

  const allContent = [...adminContent, ...content]
  const filteredContent = allContent.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!item.title.toLowerCase().includes(query) &&
          !item.titleAr.toLowerCase().includes(query)) {
        return false
      }
    }
    if (selectedCategory && item.category !== selectedCategory) {
      if (selectedCategory.startsWith('admin-')) {
        const catId = selectedCategory.replace('admin-', '')
        if (item.category !== catId && item.category !== selectedCategory) {
          return false
        }
      } else if (selectedCategory.startsWith('local-')) {
        const catId = selectedCategory.replace('local-', '')
        if (item.category !== catId && item.category !== selectedCategory) {
          return false
        }
      } else {
        return false
      }
    }
    if (selectedAgeGroup && item.ageGroup !== selectedAgeGroup) {
      return false
    }
    return true
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getYoutubeId = (url: string) => {
    if (!url) return null
    // Patterns for different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) return match[1]
    }
    // If the URL is just the video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
    return null
  }

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = getYoutubeId(url)
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
    // If it's not a YouTube URL, return as is
    return url
  }

  const getThumbnail = (item: KidsContent) => {
    if (item.thumbnailUrl) return item.thumbnailUrl
    const youtubeId = getYoutubeId(item.videoUrl || '')
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    }
    return null
  }

  // إحصائيات
  const stats = {
    total: allContent.length,
    watched: allContent.filter(c => c.isWatched).length,
    favorites: allContent.filter(c => c.isFavorite).length,
    lessons: adminLessons.length,
    notes: adminNotes.length,
    lessonsWatched: watchedLessons.length,
    notesWatched: watchedNotes.length,
    quizzes: quizzes.length,
    games: games.length,
    challenges: challenges.length,
    flashcards: flashcards.length,
    xp: userProgress.xp,
    level: userProgress.level,
    streak: userProgress.streak,
    coins: userProgress.coins
  }

  const overallProgress = stats.total > 0 ? Math.round((stats.watched / stats.total) * 100) : 0

  // ==================== GAME LOGIC ====================
  
  // Start game function
  const startGame = (game: any) => {
    let config: any = {}
    try {
      config = JSON.parse(game.config || '{}')
    } catch (e) {
      console.error('Error parsing game config:', e)
      config = {}
    }
    console.log('Starting game:', game.type, 'Config:', config)
    setSelectedGame({ ...game, parsedConfig: config })
    setGameConfig(config)
    setIsPlayingGame(true)
    setGameScore(0)

    // Initialize game based on type
    switch (game.type) {
      case 'memory':
        initMemoryGame(config)
        break
      case 'matching':
        initMatchingGame(config)
        break
      case 'scramble':
        initScrambleGame(config)
        break
      case 'listening':
        initListeningGame(config)
        break
      case 'adventure':
      case 'custom':
        // For adventure/custom games, just set the config
        break
      default:
        // Try to detect game type from config structure
        if (config.cards || config.pairs?.[0]?.word) {
          initMemoryGame(config)
        } else if (config.pairs) {
          initMatchingGame(config)
        } else if (config.words) {
          initScrambleGame(config)
        } else if (config.alphabet && config.settings?.autoSpeak) {
          initListeningGame(config)
        }
    }
  }

  const initMemoryGame = (config: any) => {
    const cards = config.cards || config.pairs || []
    const gameCards = cards.flatMap((card: any, idx: number) => [
      { id: idx * 2, word: card.word || card.left, type: 'word', pairId: idx },
      { id: idx * 2 + 1, word: card.translation || card.right || card.wordAr, type: 'translation', pairId: idx }
    ]).sort(() => Math.random() - 0.5)
    setMemoryCards(gameCards)
    setFlippedCards([])
    setMatchedPairs([])
  }

  const initMatchingGame = (config: any) => {
    const pairs = config.pairs || []
    setMatchingPairs(pairs)
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatchedMatching([])
  }

  const initScrambleGame = (config: any) => {
    const words = config.words || []
    setScrambleWords(words)
    setCurrentScrambleIndex(0)
    setScrambleInput('')
    setScrambleScore(0)
  }
  
  // Listening game initialization
  const initListeningGame = (config: any) => {
    const alphabet = config.alphabet || []
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5)
    setListeningLetters(alphabet)
    setShuffledLetters(shuffled)
    setCurrentListeningLetter(shuffled[0])
    setListeningProgress(0)
    setListeningScore(0)
    setIsCorrect(null)
    
    // Speak the first letter automatically
    setTimeout(() => {
      speakLetter(shuffled[0].letter)
    }, 500)
  }
  
  // Speak letter function
  const speakLetter = (letter: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(letter)
      utterance.lang = 'en-US'
      utterance.rate = 0.7
      speechSynthesis.speak(utterance)
    }
  }
  
  // Handle listening game letter click
  const handleListeningClick = (letter: any) => {
    if (isCorrect !== null) return // Prevent clicking during animation
    
    if (letter.letter === currentListeningLetter?.letter) {
      // Correct answer
      setIsCorrect(true)
      setListeningScore(prev => prev + 1)
      
      setTimeout(() => {
        const nextProgress = listeningProgress + 1
        setListeningProgress(nextProgress)
        setIsCorrect(null)
        
        if (nextProgress < listeningLetters.length) {
          const nextLetter = shuffledLetters[nextProgress]
          setCurrentListeningLetter(nextLetter)
          setTimeout(() => speakLetter(nextLetter.letter), 300)
        }
      }, 1200)
    } else {
      // Wrong answer
      setIsCorrect(false)
      setTimeout(() => {
        setIsCorrect(null)
        // Speak the letter again
        speakLetter(currentListeningLetter?.letter || '')
      }, 800)
    }
  }

  // Memory game handlers
  const handleMemoryCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return
    if (flippedCards.includes(cardId)) return
    if (matchedPairs.includes(memoryCards.find(c => c.id === cardId)?.pairId ?? -1)) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped.map(id => memoryCards.find(c => c.id === id))
      if (first?.pairId === second?.pairId) {
        setMatchedPairs(prev => [...prev, first.pairId])
        setGameScore(prev => prev + 10)
        setTimeout(() => setFlippedCards([]), 500)
      } else {
        setTimeout(() => setFlippedCards([]), 1000)
      }
    }
  }

  // Matching game handlers
  const handleMatchingClick = (side: 'left' | 'right', value: string) => {
    if (matchedMatching.includes(value)) return

    if (side === 'left') {
      setSelectedLeft(value)
    } else {
      setSelectedRight(value)
    }

    if ((side === 'left' && selectedRight) || (side === 'right' && selectedLeft)) {
      const leftVal = side === 'left' ? value : selectedLeft
      const rightVal = side === 'right' ? value : selectedRight

      const isMatch = matchingPairs.some(p => p.left === leftVal && p.right === rightVal)
      if (isMatch) {
        setMatchedMatching(prev => [...prev, leftVal, rightVal])
        setGameScore(prev => prev + 10)
        toast.success('مطابق! 🎉')
      } else {
        toast.error('غير صحيح، حاول مرة أخرى')
      }
      setSelectedLeft(null)
      setSelectedRight(null)
    }
  }

  // Scramble game handlers
  const handleScrambleSubmit = () => {
    const currentWord = scrambleWords[currentScrambleIndex]
    if (scrambleInput.toLowerCase().trim() === currentWord.original?.toLowerCase()) {
      setScrambleScore(prev => prev + 10)
      setGameScore(prev => prev + 10)
      toast.success('صحيح! 🎉')
    } else {
      toast.error(`الإجابة الصحيحة: ${currentWord.original}`)
    }

    if (currentScrambleIndex < scrambleWords.length - 1) {
      setCurrentScrambleIndex(prev => prev + 1)
      setScrambleInput('')
    } else {
      // Game complete - use endGame function which respects xpReward setting
      endGame()
    }
  }

  // End game and award XP based on game's xpReward setting
  const endGame = () => {
    const earnedXp = selectedGame?.xpReward || 0
    if (earnedXp > 0) {
      toast.success(`🎉 انتهت اللعبة! حصلت على ${earnedXp} نقطة`)
      updateProgress({
        xp: userProgress.xp + earnedXp,
        coins: userProgress.coins + Math.floor(earnedXp / 5)
      })
    } else {
      toast.success(`🎉 انتهت اللعبة!`)
    }
    resetGame()
  }

  const resetGame = () => {
    setIsPlayingGame(false)
    setSelectedGame(null)
    setShowGameDialog(false)
    setGameScore(0)
    setGameConfig(null)
    setMemoryCards([])
    setFlippedCards([])
    setMatchedPairs([])
    setMatchingPairs([])
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatchedMatching([])
    setScrambleWords([])
    setCurrentScrambleIndex(0)
    setScrambleInput('')
    setScrambleScore(0)
  }

  return (
    <div className="space-y-6">
      {/* Hero Section - Professional Design */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 md:p-8 shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 15, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full"
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          {/* Floating Icons */}
          <motion.div 
            className="absolute top-8 left-8 text-4xl"
            animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ⭐
          </motion.div>
          <motion.div 
            className="absolute top-12 right-24 text-3xl"
            animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🚀
          </motion.div>
          <motion.div 
            className="absolute bottom-8 right-8 text-4xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
          >
            🎯
          </motion.div>
          <motion.div 
            className="absolute bottom-12 left-16 text-3xl"
            animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity }}
          >
            🏆
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Rocket className="w-12 h-12 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  تعليم الأشبال
                </h1>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/30 text-white border-0 px-3 py-1 text-sm">
                    5 - 14 سنة
                  </Badge>
                  <p className="text-white/90 text-sm md:text-base">
                    رحلة ممتعة لتعلم الإنجليزية 🎨
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Ring */}
            <motion.div 
              className="flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-xl"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${overallProgress * 2.2} 220`}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 220' }}
                    animate={{ strokeDasharray: `${overallProgress * 2.2} 220` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{overallProgress}%</span>
                </div>
              </div>
              <div className="text-white">
                <p className="font-bold text-lg">التقدم الكلي</p>
                <p className="text-white/80">{stats.watched} من {stats.total} فيديو</p>
              </div>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
            {[
              { icon: Trophy, label: 'المستوى', value: stats.level, gradient: 'from-purple-500 to-violet-600' },
              { icon: Zap, label: 'النقاط', value: stats.xp, gradient: 'from-amber-500 to-yellow-600' },
              { icon: Flame, label: 'التتابع', value: `${stats.streak} يوم`, gradient: 'from-orange-500 to-red-600' },
              { icon: Coins, label: 'العملات', value: stats.coins, gradient: 'from-yellow-500 to-amber-600' },
              { icon: Brain, label: 'اختبارات', value: stats.quizzes, gradient: 'from-pink-500 to-rose-600' },
              { icon: Gamepad2, label: 'ألعاب', value: stats.games, gradient: 'from-cyan-500 to-blue-600' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className={cn(
                  "bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-white text-center cursor-default",
                  "hover:bg-white/30 transition-all shadow-lg"
                )}
              >
                <div className={cn(
                  "w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center bg-gradient-to-br",
                  stat.gradient
                )}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Challenge Banner */}
      {challenges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-4 md:p-6 shadow-xl"
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-0 left-1/4 w-20 h-20 bg-white/10 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">تحدي اليوم! 🎯</h3>
                <p className="text-white/90">{challenges[0].titleAr}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/30 text-white border-0 px-3 py-1">
                <Zap className="w-4 h-4 mr-1" />
                +{challenges[0].xpReward} نقطة
              </Badge>
              <Button className="bg-white text-purple-600 hover:bg-white/90 rounded-xl">
                ابدأ التحدي
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-1.5 rounded-2xl h-auto shadow-md">
          <TabsTrigger 
            value="videos" 
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-amber-600"
          >
            <div className="flex flex-col items-center gap-1">
              <Tv className="w-4 h-4" />
              <span className="text-xs font-medium">فيديوهات</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="quizzes"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-pink-600"
          >
            <div className="flex flex-col items-center gap-1">
              <Brain className="w-4 h-4" />
              <span className="text-xs font-medium">اختبارات</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="games"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-cyan-600"
          >
            <div className="flex flex-col items-center gap-1">
              <Gamepad2 className="w-4 h-4" />
              <span className="text-xs font-medium">ألعاب</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="flashcards"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-violet-600"
          >
            <div className="flex flex-col items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium">بطاقات</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="lessons"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-blue-600"
          >
            <div className="flex flex-col items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              <span className="text-xs font-medium">دروس</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="notes"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-emerald-600"
          >
            <div className="flex flex-col items-center gap-1">
              <StickyNote className="w-4 h-4" />
              <span className="text-xs font-medium">ملاحظات</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6 mt-6">
          {/* Categories Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-lg">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                التصنيفات
              </h3>
              {selectedCategory && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory(null)}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء الفلتر
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {allCategories.map((cat: any, index: number) => {
                const count = allContent.filter(c => c.category === cat.id || c.category === cat.id.replace('admin-', '').replace('local-', '')).length
                const isSelected = selectedCategory === cat.id
                
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "relative flex flex-col items-center p-3 rounded-2xl transition-all",
                      "border-2 shadow-md",
                      isSelected 
                        ? `bg-gradient-to-br ${cat.color} text-white border-transparent shadow-lg` 
                        : "bg-white dark:bg-gray-800 hover:shadow-lg border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className={cn(
                      "text-[10px] mt-1 font-medium text-center",
                      isSelected ? "text-white" : "text-gray-600 dark:text-gray-400"
                    )}>
                      {cat.label}
                    </span>
                    {count > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold",
                          isSelected ? "bg-white/30 text-white" : "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                        )}
                      >
                        {count}
                      </motion.span>
                    )}
                    {cat.isAdmin && (
                      <Crown className="absolute -top-1 -left-1 w-4 h-4 text-amber-500 drop-shadow" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "gap-2 rounded-xl",
                  showFilters && "bg-gradient-to-r from-amber-500 to-orange-500"
                )}
              >
                <Filter className="w-4 h-4" />
                الفلاتر
                {(selectedAgeGroup || selectedCategory) && (
                  <Badge variant="secondary" className="ml-1 px-1.5 bg-white/20">فعّال</Badge>
                )}
              </Button>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="ابحث عن فيديو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-11 bg-white dark:bg-gray-800 rounded-xl border-2 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Age Filter */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md space-y-3"
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الفئة العمرية:</p>
                <div className="flex flex-wrap gap-2">
                  {ageGroups.map((age) => (
                    <motion.button
                      key={age.id}
                      onClick={() => setSelectedAgeGroup(selectedAgeGroup === age.id ? null : age.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                        selectedAgeGroup === age.id
                          ? age.color
                          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-amber-300"
                      )}
                    >
                      {age.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse overflow-hidden rounded-2xl">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContent.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">🎬</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا يوجد فيديوهات
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة محتوى تعليمي ممتع قريباً من المؤسس
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContent.map((item, index) => {
                const category = categories.find(c => c.id === item.category)
                const thumbnail = getThumbnail(item)

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    layout
                  >
                    <Card 
                      className="group border-0 shadow-lg hover:shadow-2xl transition-all overflow-hidden cursor-pointer bg-white dark:bg-gray-800 rounded-2xl"
                      onClick={() => {
                        setSelectedContent(item)
                        setShowVideoDialog(true)
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video relative overflow-hidden">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className={cn(
                            "w-full h-full flex items-center justify-center bg-gradient-to-br",
                            category?.color || 'from-gray-400 to-gray-500'
                          )}>
                            <span className="text-5xl opacity-70">{category?.icon || '📺'}</span>
                          </div>
                        )}

                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileHover={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
                              <Play className="w-7 h-7 text-amber-500 ml-1" />
                            </div>
                          </motion.div>
                        </div>

                        {/* Duration */}
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/80 rounded-lg text-white text-xs font-medium backdrop-blur-sm">
                          {formatDuration(item.duration)}
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-2 right-2">
                          {item.type === 'song' ? (
                            <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 rounded-lg">
                              <Music className="w-3 h-3 mr-1" />
                              أغنية
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 rounded-lg">
                              <Video className="w-3 h-3 mr-1" />
                              فيديو
                            </Badge>
                          )}
                        </div>

                        {/* Favorite */}
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(item.id)
                          }}
                          className="absolute top-2 left-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4 transition-colors",
                              item.isFavorite ? "text-rose-500 fill-rose-500" : "text-gray-400"
                            )}
                          />
                        </motion.button>

                        {/* Watched Badge */}
                        {item.isWatched && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2"
                          >
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 rounded-lg">
                              <Check className="w-3 h-3 mr-1" />
                              تمت المشاهدة
                            </Badge>
                          </motion.div>
                        )}
                      </div>

                      {/* Content */}
                      <CardContent className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1">
                          {item.titleAr}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mb-2">{item.title}</p>
                        
                        {item.progress > 0 && item.progress < 100 && (
                          <Progress value={item.progress} className="h-1.5 mb-3 rounded-full" />
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs rounded-lg border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                            {category?.icon} {category?.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs rounded-lg border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                            {ageGroups.find(a => a.id === item.ageGroup)?.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="mt-6">
          {adminLessons.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">📚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد دروس
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة دروس تعليمية قريباً من المؤسس
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminLessons.map((lesson: any, index: number) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedLesson(lesson)
                    setShowLessonDialog(true)
                  }}
                >
                  <Card className="h-full border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 shadow-lg hover:shadow-2xl transition-all overflow-hidden group bg-white dark:bg-gray-800 rounded-2xl">
                    {/* Header Gradient */}
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600" />
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {lesson.titleAr}
                              {watchedLessons.includes(lesson.id) && (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs border-0">
                                  <Check className="w-3 h-3 mr-1" />
                                  تمت المشاهدة
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{lesson.title}</CardDescription>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 dark:bg-blue-900/30 rounded-xl"
                        >
                          <Maximize2 className="w-4 h-4 text-blue-600" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                        {lesson.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 rounded-lg">
                          {lesson.category}
                        </Badge>
                        {lesson.level && (
                          <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 rounded-lg">
                            {lesson.level}
                          </Badge>
                        )}
                        {lesson.duration && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 rounded-lg">
                            <Clock className="w-3 h-3" />
                            {lesson.duration} دقيقة
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-6">
          {quizzes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد اختبارات
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة اختبارات تفاعلية قريباً
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedQuiz(quiz)
                    setShowQuizDialog(true)
                  }}
                >
                  <Card className="h-full border-2 border-transparent hover:border-pink-300 dark:hover:border-pink-700 shadow-lg hover:shadow-2xl transition-all overflow-hidden group bg-white dark:bg-gray-800 rounded-2xl">
                    <div className="h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600" />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30">
                            <Brain className="w-6 h-6 text-pink-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{quiz.titleAr}</CardTitle>
                            <CardDescription>{quiz.title}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                        {quiz.descriptionAr}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 rounded-lg">
                          {quiz.category}
                        </Badge>
                        <Badge variant="outline" className="bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 rounded-lg">
                          {quiz.difficulty === 'easy' ? 'سهل' : quiz.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                        </Badge>
                        {quiz.xpReward > 0 ? (
                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 rounded-lg">
                            <Zap className="w-3 h-3 mr-1" />
                            +{quiz.xpReward} نقطة
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0 rounded-lg">
                            بدون نقاط
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="mt-6">
          {games.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">🎮</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد ألعاب
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة ألعاب تعليمية ممتعة قريباً
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedGame(game)
                    setShowGameDialog(true)
                  }}
                >
                  <Card className="h-full border-2 border-transparent hover:border-cyan-300 dark:hover:border-cyan-700 shadow-lg hover:shadow-2xl transition-all overflow-hidden group bg-white dark:bg-gray-800 rounded-2xl">
                    <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600" />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                            <Gamepad2 className="w-6 h-6 text-cyan-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{game.titleAr}</CardTitle>
                            <CardDescription>{game.title}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                        {game.descriptionAr}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 rounded-lg">
                          {game.type === 'memory' ? '🧠 ذاكرة' : game.type === 'matching' ? '🔗 مطابقة' : '🎯 أخرى'}
                        </Badge>
                        {game.xpReward > 0 ? (
                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 rounded-lg">
                            <Zap className="w-3 h-3 mr-1" />
                            +{game.xpReward} نقطة
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0 rounded-lg">
                            بدون نقاط
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="mt-6">
          {flashcards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">📚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد بطاقات تعليمية
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة بطاقات تعليمية قريباً
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {flashcards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setCurrentFlashcardIndex(index)
                    setShowFlashcardDialog(true)
                    setIsFlipped(false)
                  }}
                >
                  <Card className="h-48 border-2 border-transparent hover:border-violet-300 dark:hover:border-violet-700 shadow-lg hover:shadow-2xl transition-all overflow-hidden group bg-white dark:bg-gray-800 rounded-2xl">
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.word} className="w-20 h-20 object-cover rounded-xl mb-3" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-3">
                          <BookOpen className="w-10 h-10 text-violet-500" />
                        </div>
                      )}
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">{card.word}</h4>
                      <p className="text-sm text-gray-500">{card.wordAr}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-6">
          {adminNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد ملاحظات
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة ملاحظات ونصائح قريباً من المؤسس
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminNotes.map((note: any, index: number) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedNote(note)
                    setShowNoteDialog(true)
                  }}
                >
                  <Card 
                    className="h-full border-2 border-transparent hover:border-emerald-300 dark:hover:border-emerald-700 shadow-lg hover:shadow-2xl transition-all overflow-hidden group bg-white dark:bg-gray-800 rounded-2xl"
                  >
                    {/* Color Bar */}
                    <div 
                      className="h-2"
                      style={{ background: note.color || 'linear-gradient(to right, #10B981, #14B8A6)' }}
                    />
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {note.isPinned ? (
                            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                              <Pin className="w-5 h-5 text-amber-600" />
                            </div>
                          ) : (
                            <div 
                              className="p-3 rounded-xl"
                              style={{ backgroundColor: `${note.color}20` || 'rgba(16, 185, 129, 0.2)' }}
                            >
                              <FileText className="w-5 h-5" style={{ color: note.color || '#10B981' }} />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                              {note.title}
                              {watchedNotes.includes(note.id) && (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs border-0">
                                  <Check className="w-3 h-3 mr-1" />
                                  تمت القراءة
                                </Badge>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                        {note.content}
                      </p>
                      {note.category && (
                        <Badge variant="outline" className="rounded-lg" style={{ borderColor: note.color, color: note.color }}>
                          {note.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl">
          {selectedContent && (
            <>
              <div className="aspect-video relative bg-black">
                <iframe
                  src={getYoutubeEmbedUrl(selectedContent.videoUrl || '')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl">{selectedContent.titleAr}</DialogTitle>
                  <DialogDescription>{selectedContent.title}</DialogDescription>
                </DialogHeader>
                {selectedContent.descriptionAr && (
                  <p className="mt-4 text-gray-600 dark:text-gray-400">{selectedContent.descriptionAr}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => markVideoAsWatched(selectedContent.id)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    تمت المشاهدة
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedLesson && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedLesson.titleAr}</DialogTitle>
                <DialogDescription>{selectedLesson.title}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 prose dark:prose-invert max-h-[60vh] overflow-y-auto">
                <p className="whitespace-pre-wrap">{selectedLesson.content}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => markLessonAsWatched(selectedLesson.id)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  تمت المشاهدة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-xl rounded-2xl">
          {selectedNote && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedNote.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 prose dark:prose-invert max-h-[60vh] overflow-y-auto">
                <p className="whitespace-pre-wrap">{selectedNote.content}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => markNoteAsWatched(selectedNote.id)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  تمت القراءة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedQuiz && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Brain className="w-6 h-6 text-pink-500" />
                  {selectedQuiz.titleAr}
                </DialogTitle>
                <DialogDescription>{selectedQuiz.title}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800">
                  <p className="text-gray-700 dark:text-gray-300">{selectedQuiz.descriptionAr || 'اختبر معلوماتك في هذا الاختبار التفاعلي!'}</p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedQuiz.xpReward > 0 ? (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                      <Zap className="w-4 h-4 mr-1" />
                      +{selectedQuiz.xpReward} نقطة
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 border-0">
                      بدون نقاط
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-pink-300 text-pink-600">
                    {selectedQuiz.difficulty === 'easy' ? 'سهل' : selectedQuiz.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                  </Badge>
                  {selectedQuiz.timeLimit && (
                    <Badge variant="outline" className="border-violet-300 text-violet-600">
                      <Timer className="w-4 h-4 mr-1" />
                      {selectedQuiz.timeLimit} ثانية
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={() => {
                    // TODO: Start quiz
                    toast.info('سيتم بدء الاختبار قريباً!')
                    setShowQuizDialog(false)
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                >
                  <Play className="w-4 h-4 mr-2" />
                  ابدأ الاختبار
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Game Dialog */}
      <Dialog open={showGameDialog} onOpenChange={setShowGameDialog}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedGame && !isPlayingGame && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-cyan-500" />
                  {selectedGame.titleAr}
                </DialogTitle>
                <DialogDescription>{selectedGame.title}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800">
                  <p className="text-gray-700 dark:text-gray-300">{selectedGame.descriptionAr || 'استمتع وتعلم مع هذه اللعبة التعليمية!'}</p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedGame.xpReward > 0 ? (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                      <Zap className="w-4 h-4 mr-1" />
                      +{selectedGame.xpReward} نقطة
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 border-0">
                      بدون نقاط
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-cyan-300 text-cyan-600">
                    {selectedGame.type === 'memory' ? '🧠 ذاكرة' : selectedGame.type === 'matching' ? '🔗 مطابقة' : selectedGame.type === 'scramble' ? '📝 ترتيب' : '🎯 أخرى'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={() => {
                    startGame(selectedGame)
                    setShowGameDialog(false)
                  }}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  <Play className="w-4 h-4 mr-2" />
                  ابدأ اللعب
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Playing Game Dialog */}
      <Dialog open={isPlayingGame} onOpenChange={(open) => { if (!open) resetGame() }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          {selectedGame && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-cyan-500" />
                    {selectedGame.titleAr}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700">
                      <Zap className="w-4 h-4 mr-1" />
                      {gameScore} نقطة
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="mt-4">
                {/* Memory Game */}
                {selectedGame.type === 'memory' && memoryCards.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {memoryCards.map((card) => {
                      const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.pairId)
                      const isMatched = matchedPairs.includes(card.pairId)
                      
                      return (
                        <motion.button
                          key={card.id}
                          onClick={() => handleMemoryCardClick(card.id)}
                          className="h-24 rounded-xl transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={cn(
                            "w-full h-full rounded-xl flex items-center justify-center text-lg font-bold transition-all",
                            isFlipped
                              ? isMatched
                                ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-400"
                                : "bg-cyan-100 dark:bg-cyan-900/30 border-2 border-cyan-400"
                              : "bg-gradient-to-br from-cyan-400 to-blue-500 text-white"
                          )}>
                            {isFlipped ? card.word : '?'}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}

                {/* Matching Game */}
                {selectedGame.type === 'matching' && matchingPairs.length > 0 && (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-center font-bold text-gray-600 dark:text-gray-400 mb-2">الحروف</h4>
                      {matchingPairs.filter(p => !matchedMatching.includes(p.left)).map((pair, i) => (
                        <motion.button
                          key={`left-${i}`}
                          onClick={() => handleMatchingClick('left', pair.left)}
                          className={cn(
                            "w-full p-4 rounded-xl text-center text-lg font-bold transition-all",
                            selectedLeft === pair.left
                              ? "bg-cyan-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {pair.left}
                        </motion.button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-center font-bold text-gray-600 dark:text-gray-400 mb-2">المعاني</h4>
                      {[...matchingPairs].sort(() => Math.random() - 0.5).filter(p => !matchedMatching.includes(p.right)).map((pair, i) => (
                        <motion.button
                          key={`right-${i}`}
                          onClick={() => handleMatchingClick('right', pair.right)}
                          className={cn(
                            "w-full p-4 rounded-xl text-center text-lg font-bold transition-all",
                            selectedRight === pair.right
                              ? "bg-pink-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {pair.right}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scramble Game */}
                {selectedGame.type === 'scramble' && scrambleWords.length > 0 && scrambleWords[currentScrambleIndex] && (
                  <div className="text-center space-y-6">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <p className="text-gray-500 mb-2">رتب الحروف لتكوين:</p>
                      <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {scrambleWords[currentScrambleIndex].hint || scrambleWords[currentScrambleIndex].original}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      {scrambleWords[currentScrambleIndex].scrambled?.split('').map((letter: string, i: number) => (
                        <span
                          key={i}
                          className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center text-xl font-bold"
                        >
                          {letter}
                        </span>
                      ))}
                    </div>
                    
                    <Input
                      value={scrambleInput}
                      onChange={(e) => setScrambleInput(e.target.value)}
                      placeholder="اكتب الكلمة الصحيحة..."
                      className="text-center text-xl h-14"
                    />
                    
                    <div className="flex justify-center gap-2">
                      <Button onClick={handleScrambleSubmit} className="bg-gradient-to-r from-cyan-500 to-blue-500">
                        تحقق
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      السؤال {currentScrambleIndex + 1} من {scrambleWords.length}
                    </p>
                  </div>
                )}

                {/* Adventure/Custom/Other games */}
                {(selectedGame.type === 'adventure' || selectedGame.type === 'custom' || !['memory', 'matching', 'scramble'].includes(selectedGame.type)) && gameConfig && (
                  <div className="space-y-6">
                    {/* Instructions */}
                    {gameConfig.instructions && (
                      <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl text-center">
                        <p className="text-gray-700 dark:text-gray-300">{gameConfig.instructions}</p>
                      </div>
                    )}
                    
                    {/* Gameplay stages */}
                    {gameConfig.gameplay && gameConfig.gameplay.length > 0 && (
                      <div className="space-y-4">
                        {gameConfig.gameplay.map((stage: any, stageIndex: number) => (
                          <div key={stageIndex} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                            <p className="text-xl font-bold text-center mb-4">{stage.question}</p>
                            {stage.choices && (
                              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto" dir="rtl">
                                {stage.choices.map((choice: any, i: number) => (
                                  <motion.button
                                    key={i}
                                    onClick={() => {
                                      // Speak the letter
                                      if ('speechSynthesis' in window) {
                                        const utterance = new SpeechSynthesisUtterance(choice.letter)
                                        utterance.lang = 'en-US'
                                        utterance.rate = 0.8
                                        speechSynthesis.speak(utterance)
                                      }
                                      
                                      if (choice.letter === stage.correct_answer) {
                                        setGameScore(prev => prev + 10)
                                        toast.success(gameConfig.feedback?.correct || 'صحيح! 🎉')
                                      } else {
                                        toast.error(gameConfig.feedback?.incorrect || 'حاول مرة أخرى!')
                                      }
                                    }}
                                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow hover:shadow-lg transition-all text-center"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <div className="text-3xl mb-2">{choice.image}</div>
                                    <div className="text-xl font-bold">{choice.letter}</div>
                                  </motion.button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Pairs for matching */}
                    {gameConfig.pairs && gameConfig.pairs.length > 0 && (
                      <div className="text-center">
                        <p className="text-gray-500 mb-4">لعبة مطابقة - {gameConfig.pairs.length} أزواج</p>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            {gameConfig.pairs.map((pair: any, i: number) => (
                              <div key={`left-${i}`} className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg font-bold">
                                {pair.left}
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            {gameConfig.pairs.map((pair: any, i: number) => (
                              <div key={`right-${i}`} className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg font-bold">
                                {pair.right}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Cards for memory */}
                    {gameConfig.cards && gameConfig.cards.length > 0 && (
                      <div className="text-center">
                        <p className="text-gray-500 mb-4">لعبة ذاكرة - {gameConfig.cards.length} بطاقات</p>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {gameConfig.cards.map((card: any, i: number) => (
                            <div key={i} className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-lg text-center">
                              <div className="font-bold">{card.word}</div>
                              <div className="text-sm opacity-80">{card.translation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Words for scramble */}
                    {gameConfig.words && gameConfig.words.length > 0 && (
                      <div className="text-center">
                        <p className="text-gray-500 mb-4">لعبة ترتيب - {gameConfig.words.length} كلمات</p>
                        <div className="space-y-2">
                          {gameConfig.words.map((word: any, i: number) => (
                            <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex justify-between items-center">
                              <span className="font-mono text-lg">{word.scrambled}</span>
                              <span className="text-gray-500">{word.hint}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Questions for image_quiz */}
                    {gameConfig.questions && gameConfig.questions.length > 0 && (
                      <div className="space-y-6">
                        <p className="text-center text-gray-500">اختبار صور - {gameConfig.questions.length} أسئلة</p>
                        {gameConfig.questions.map((q: any, qIndex: number) => (
                          <div key={qIndex} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                            <div className="text-center mb-4">
                              <span className="text-5xl mb-2 block">{q.image}</span>
                              <p className="text-lg font-bold">{q.question}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options?.map((opt: any, i: number) => (
                                <motion.button
                                  key={i}
                                  onClick={() => {
                                    const isCorrect = typeof opt === 'object' 
                                      ? opt.value === q.correctAnswer 
                                      : i === q.correctAnswer
                                    if (isCorrect) {
                                      setGameScore(prev => prev + 10)
                                      toast.success(gameConfig.feedback?.correct || 'صحيح! 🎉')
                                    } else {
                                      toast.error(gameConfig.feedback?.incorrect || 'حاول مرة أخرى!')
                                    }
                                  }}
                                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-all font-medium"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  {typeof opt === 'object' ? opt.text : opt}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Alphabet for exploration games */}
                    {gameConfig.alphabet && gameConfig.alphabet.length > 0 && selectedGame.type !== 'listening' && (
                      <div className="space-y-4" dir="ltr">
                        <div className="text-center mb-4">
                          <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                            {gameConfig.instructions || 'اضغط على الحرف لسماعه!'}
                          </p>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                          {gameConfig.alphabet.map((letter: any, i: number) => {
                            // Determine which letter to display (small or capital)
                            const displayLetter = gameConfig.settings?.showSmallLetters 
                              ? (letter.letterSmall || letter.letter.toLowerCase()) 
                              : letter.letter
                            
                            return (
                              <motion.button
                                key={i}
                                onClick={() => {
                                  // Speak the letter and word
                                  if ('speechSynthesis' in window) {
                                    // Cancel any ongoing speech
                                    speechSynthesis.cancel()
                                    
                                    // Speak letter first
                                    const letterUtterance = new SpeechSynthesisUtterance(letter.letter)
                                    letterUtterance.lang = 'en-US'
                                    letterUtterance.rate = 0.8
                                    
                                    // Speak word after letter
                                    const wordUtterance = new SpeechSynthesisUtterance(letter.word)
                                    wordUtterance.lang = 'en-US'
                                    wordUtterance.rate = 0.9
                                    
                                    speechSynthesis.speak(letterUtterance)
                                    setTimeout(() => {
                                      speechSynthesis.speak(wordUtterance)
                                    }, 500)
                                  }
                                  
                                  toast.success(`${letter.emoji} ${letter.letter} - ${letter.word} (${letter.wordAr || ''})`)
                                }}
                                className={cn(
                                  "p-4 rounded-2xl text-center transition-all shadow-lg",
                                  letter.color ? `bg-gradient-to-br ${letter.color}` : "bg-gradient-to-br from-cyan-400 to-blue-500"
                                )}
                                whileHover={{ scale: 1.1, y: -8, rotate: [0, -5, 5, 0] }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                              >
                                <div className="text-4xl font-bold text-white drop-shadow-lg">{displayLetter}</div>
                                <div className="text-3xl my-1">{letter.emoji}</div>
                                <div className="text-sm font-bold text-white/90">{letter.word}</div>
                                {letter.wordAr && (
                                  <div className="text-xs text-white/70">{letter.wordAr}</div>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                        
                        {/* Completion message */}
                        {gameConfig.completion_message && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl text-center border-2 border-green-200 dark:border-green-800">
                            <p className="text-green-700 dark:text-green-400 text-lg font-bold">{gameConfig.completion_message}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Listening Game - استمع واختر */}
                    {selectedGame.type === 'listening' && listeningLetters.length > 0 && (
                      <div className="space-y-6">
                        {/* Game completed */}
                        {listeningProgress >= listeningLetters.length ? (
                          <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-6xl mb-4"
                            >
                              🎉
                            </motion.div>
                            <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                              أحسنت! أكملت كل الحروف!
                            </h3>
                            <p className="text-green-600 dark:text-green-500">
                              حصلت على {listeningScore} من {listeningLetters.length}
                            </p>
                            <Button
                              onClick={() => initListeningGame(gameConfig)}
                              className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500"
                            >
                              العب مرة أخرى
                            </Button>
                          </div>
                        ) : (
                          <>
                            {/* Current letter speaker */}
                            <div className="text-center">
                              <motion.button
                                onClick={() => speakLetter(currentListeningLetter?.letter || '')}
                                className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                animate={{ 
                                  boxShadow: ['0 0 0 0 rgba(251, 191, 36, 0.4)', '0 0 0 20px rgba(251, 191, 36, 0)', '0 0 0 0 rgba(251, 191, 36, 0)']
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <span className="text-6xl">🔊</span>
                              </motion.button>
                              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                                اضغط للاستماع للحرف
                              </p>
                            </div>
                            
                            {/* Progress */}
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm text-gray-500">
                                الحرف {listeningProgress + 1} من {listeningLetters.length}
                              </span>
                              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((listeningProgress + 1) / listeningLetters.length) * 100}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* Feedback message */}
                            <AnimatePresence>
                              {isCorrect === true && (
                                <motion.div
                                  initial={{ opacity: 0, y: -20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-xl"
                                >
                                  <span className="text-2xl">⭐</span>
                                  <span className="text-green-700 dark:text-green-400 font-bold mr-2">ممتاز!</span>
                                </motion.div>
                              )}
                              {isCorrect === false && (
                                <motion.div
                                  initial={{ opacity: 0, y: -20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-xl"
                                >
                                  <span className="text-2xl">🔄</span>
                                  <span className="text-red-700 dark:text-red-400 font-bold mr-2">حاول مرة أخرى!</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            {/* Letters grid */}
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3" dir="ltr">
                              {listeningLetters.map((letter: any, i: number) => (
                                <motion.button
                                  key={i}
                                  onClick={() => handleListeningClick(letter)}
                                  disabled={isCorrect !== null}
                                  className={cn(
                                    "p-4 rounded-2xl text-center transition-all shadow-lg",
                                    letter.color ? `bg-gradient-to-br ${letter.color}` : "bg-gradient-to-br from-cyan-400 to-blue-500",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    isCorrect === true && letter.letter === currentListeningLetter?.letter && "ring-4 ring-green-400"
                                  )}
                                  whileHover={{ scale: isCorrect === null ? 1.05 : 1 }}
                                  whileTap={{ scale: isCorrect === null ? 0.95 : 1 }}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.02 }}
                                >
                                  <div className="text-3xl font-bold text-white drop-shadow-lg">{letter.letter}</div>
                                  <div className="text-2xl">{letter.emoji}</div>
                                </motion.button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Levels for multi-level games */}
                    {gameConfig.levels && gameConfig.levels.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-center text-gray-500">المستويات - {gameConfig.levels.length} مراحل</p>
                        <div className="grid gap-2">
                          {gameConfig.levels.map((level: any, i: number) => (
                            <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="font-bold">{level.title}</span>
                                <span className="text-xs text-gray-500 mr-2">({level.difficulty})</span>
                              </div>
                              <Badge variant="outline">{level.level_number}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Completion message */}
                    {gameConfig.completion_message && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                        <p className="text-green-700 dark:text-green-400">{gameConfig.completion_message}</p>
                      </div>
                    )}
                    
                    {/* Fallback message if no recognized content */}
                    {!gameConfig.gameplay && !gameConfig.pairs && !gameConfig.cards && !gameConfig.words && !gameConfig.questions && !gameConfig.alphabet && !gameConfig.levels && (
                      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 font-bold mb-2">لم يتم العثور على محتوى اللعبة</p>
                        <p className="text-sm text-gray-400 mb-4">تأكد من صحة تنسيق JSON في إعدادات اللعبة</p>
                        
                        {/* Debug info */}
                        <div className="text-left bg-white dark:bg-gray-700 p-3 rounded-lg text-xs overflow-auto max-h-32">
                          <p className="font-bold mb-1">نوع اللعبة: {selectedGame.type}</p>
                          <p className="font-bold mb-1">الخصائص المتوفرة: {Object.keys(gameConfig).join(', ')}</p>
                        </div>
                        
                        <p className="text-xs text-amber-600 mt-3">
                          💡 نصيحة: استخدم زر "تحميل مثال" عند إضافة اللعبة للحصول على التنسيق الصحيح
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback for empty game state */}
                {!gameConfig && (
                  <div className="text-center p-8">
                    <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">جاري تحميل اللعبة...</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={endGame} className="flex-1">
                  إنهاء اللعبة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Flashcard Dialog */}
      <Dialog open={showFlashcardDialog} onOpenChange={setShowFlashcardDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          {flashcards[currentFlashcardIndex] && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-center">البطاقة التعليمية</DialogTitle>
                <DialogDescription className="text-center">
                  {currentFlashcardIndex + 1} من {flashcards.length}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <motion.div
                  className="relative h-64 cursor-pointer perspective-1000"
                  onClick={() => setIsFlipped(!isFlipped)}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <div 
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl",
                      "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30",
                      "border-2 border-violet-300 dark:border-violet-700 shadow-xl"
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {flashcards[currentFlashcardIndex].imageUrl ? (
                      <img 
                        src={flashcards[currentFlashcardIndex].imageUrl} 
                        alt={flashcards[currentFlashcardIndex].word} 
                        className="w-24 h-24 object-cover rounded-xl mb-4"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-white/50 flex items-center justify-center mb-4">
                        <BookOpen className="w-12 h-12 text-violet-500" />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {flashcards[currentFlashcardIndex].word}
                    </h3>
                    <p className="text-gray-500 mt-2">{flashcards[currentFlashcardIndex].wordAr}</p>
                    <p className="text-xs text-violet-500 mt-4">انقر للقلب</p>
                  </div>
                  
                  {/* Back */}
                  <div 
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl",
                      "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30",
                      "border-2 border-amber-300 dark:border-amber-700 shadow-xl"
                    )}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {flashcards[currentFlashcardIndex].translation}
                    </h3>
                    <p className="text-gray-500 mt-2">{flashcards[currentFlashcardIndex].translationAr}</p>
                    {flashcards[currentFlashcardIndex].example && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center italic">
                        "{flashcards[currentFlashcardIndex].example}"
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsFlipped(false)
                    setCurrentFlashcardIndex(prev => Math.max(0, prev - 1))
                  }}
                  disabled={currentFlashcardIndex === 0}
                >
                  <ChevronRight className="w-4 h-4 ml-2" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsFlipped(false)
                    setCurrentFlashcardIndex(prev => Math.min(flashcards.length - 1, prev + 1))
                  }}
                  disabled={currentFlashcardIndex === flashcards.length - 1}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
