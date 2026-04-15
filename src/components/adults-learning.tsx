'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Play, Check, Clock, BookOpen, Award,
  Briefcase, MessageSquare, PenTool, Mic, FileText,
  TrendingUp, Target, Zap, RefreshCw, Crown, Sparkles,
  X, Search, Filter, ChevronLeft, ChevronRight,
  Building2, Users, Globe, Presentation, BarChart3,
  Maximize2, ExternalLink, Star, Heart, Rocket, Medal,
  Brain, Trophy
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
interface AdultContent {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  category: string
  type: 'video' | 'article' | 'exercise' | 'quiz'
  videoUrl?: string
  thumbnailUrl?: string
  duration: number
  level: 'intermediate' | 'advanced' | 'professional'
  difficulty: 'medium' | 'hard' | 'expert'
  isFavorite: boolean
  isCompleted: boolean
  progress: number
  isAdmin?: boolean
  createdAt: string
  updatedAt: string
}

// تصنيفات المحتوى للكبار
const defaultCategories = [
  { id: 'business', label: 'الأعمال', labelEn: 'Business', icon: '💼', color: 'from-slate-600 to-slate-700', borderColor: 'border-slate-500' },
  { id: 'academic', label: 'أكاديمي', labelEn: 'Academic', icon: '🎓', color: 'from-indigo-600 to-indigo-700', borderColor: 'border-indigo-500' },
  { id: 'communication', label: 'التواصل', labelEn: 'Communication', icon: '💬', color: 'from-teal-600 to-teal-700', borderColor: 'border-teal-500' },
  { id: 'writing', label: 'الكتابة', labelEn: 'Writing', icon: '✍️', color: 'from-amber-600 to-amber-700', borderColor: 'border-amber-500' },
  { id: 'speaking', label: 'المحادثة', labelEn: 'Speaking', icon: '🎤', color: 'from-rose-600 to-rose-700', borderColor: 'border-rose-500' },
  { id: 'presentation', label: 'العروض', labelEn: 'Presentation', icon: '📊', color: 'from-cyan-600 to-cyan-700', borderColor: 'border-cyan-500' },
  { id: 'negotiation', label: 'التفاوض', labelEn: 'Negotiation', icon: '🤝', color: 'from-purple-600 to-purple-700', borderColor: 'border-purple-500' },
  { id: 'networking', label: 'التشبيك', labelEn: 'Networking', icon: '🌐', color: 'from-emerald-600 to-emerald-700', borderColor: 'border-emerald-500' },
]

// مستويات الصعوبة
const difficultyLevels = [
  { id: 'intermediate', label: 'متوسط', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'advanced', label: 'متقدم', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'professional', label: 'احترافي', color: 'bg-amber-100 text-amber-700 border-amber-200' }
]

// واجهة الخصائص
interface AdultsLearningProps {
  words: Array<{
    id: string
    word: string
    translation: string
    pronunciation?: string
    definition?: string
    level: string
  }>
}

export function AdultsLearning({ words }: AdultsLearningProps) {
  const [content, setContent] = useState<AdultContent[]>([])
  const [adminContent, setAdminContent] = useState<AdultContent[]>([])
  const [adminLessons, setAdminLessons] = useState<any[]>([])
  const [adminNotes, setAdminNotes] = useState<any[]>([])
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('videos')
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [selectedContent, setSelectedContent] = useState<AdultContent | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null)
  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [completedNotes, setCompletedNotes] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // تحميل المحتوى
  useEffect(() => {
    const loadData = async () => {
      const savedContent = localStorage.getItem('adults-learning-content')
      if (savedContent) {
        try {
          setContent(JSON.parse(savedContent))
        } catch {
          setContent([])
        }
      } else {
        setContent([])
      }

      const savedCompletedLessons = localStorage.getItem('adults-completed-lessons')
      if (savedCompletedLessons) {
        try {
          setCompletedLessons(JSON.parse(savedCompletedLessons))
        } catch {
          setCompletedLessons([])
        }
      }

      const savedCompletedNotes = localStorage.getItem('adults-completed-notes')
      if (savedCompletedNotes) {
        try {
          setCompletedNotes(JSON.parse(savedCompletedNotes))
        } catch {
          setCompletedNotes([])
        }
      }

      const savedCompletedVideos = localStorage.getItem('adults-completed-videos')
      if (savedCompletedVideos) {
        try {
          const completedIds = JSON.parse(savedCompletedVideos)
          setContent(prev => prev.map(item => ({
            ...item,
            isCompleted: completedIds.includes(item.id)
          })))
        } catch {
          // ignore
        }
      }

      try {
        const videosResponse = await fetch('/api/admin/videos?type=adults')
        if (videosResponse.ok) {
          const adminVideos = await videosResponse.json()
          const formattedAdminContent: AdultContent[] = adminVideos
            .filter((v: any) => v.type === 'adults' || v.ageGroup === 'adults')
            .map((v: any) => ({
              id: `admin-${v.id}`,
              title: v.title,
              titleAr: v.titleAr,
              description: v.description,
              descriptionAr: v.descriptionAr,
              category: v.category,
              type: 'video' as AdultContent['type'],
              videoUrl: v.url,
              thumbnailUrl: v.thumbnail,
              duration: v.duration,
              level: v.difficulty as AdultContent['level'] || 'intermediate',
              difficulty: v.difficulty as AdultContent['difficulty'] || 'medium',
              isFavorite: false,
              isCompleted: false,
              progress: 0,
              createdAt: v.createdAt,
              updatedAt: v.updatedAt,
              isAdmin: true
            }))
          setAdminContent(formattedAdminContent)
        }

        const lessonsResponse = await fetch('/api/admin/lessons?type=adults')
        if (lessonsResponse.ok) {
          const lessons = await lessonsResponse.json()
          setAdminLessons(lessons.filter((l: any) => l.type === 'adults' || l.level !== 'beginner'))
        }

        const notesResponse = await fetch('/api/admin/notes?type=adults')
        if (notesResponse.ok) {
          const notes = await notesResponse.json()
          setAdminNotes(notes.filter((n: any) => n.type === 'adults'))
        }

        const categoriesResponse = await fetch('/api/admin/categories?type=adults&includeInactive=true')
        if (categoriesResponse.ok) {
          const adminCats = await categoriesResponse.json()
          setAdminCategories(adminCats)
        }
      } catch (error) {
        console.error('Error loading admin content:', error)
      }

      setIsLoading(false)
    }
    loadData()
  }, [])

  const saveContent = useCallback((newContent: AdultContent[]) => {
    setContent(newContent)
    localStorage.setItem('adults-learning-content', JSON.stringify(newContent))
  }, [])

  const toggleFavorite = (id: string) => {
    const updatedContent = content.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    saveContent(updatedContent)
  }

  const markLessonAsCompleted = (id: string) => {
    const newCompleted = [...new Set([...completedLessons, id])]
    setCompletedLessons(newCompleted)
    localStorage.setItem('adults-completed-lessons', JSON.stringify(newCompleted))
  }

  const markNoteAsCompleted = (id: string) => {
    const newCompleted = [...new Set([...completedNotes, id])]
    setCompletedNotes(newCompleted)
    localStorage.setItem('adults-completed-notes', JSON.stringify(newCompleted))
  }

  const markVideoAsCompleted = (id: string) => {
    const updatedContent = content.map(item =>
      item.id === id ? { ...item, isCompleted: true, progress: 100 } : item
    )
    saveContent(updatedContent)
    const completedVideos = JSON.parse(localStorage.getItem('adults-completed-videos') || '[]')
    const newCompleted = [...new Set([...completedVideos, id])]
    localStorage.setItem('adults-completed-videos', JSON.stringify(newCompleted))
  }

  const allCategories = useMemo(() => {
    // Get IDs of deleted categories (isActive === false) from adminCategories
    const deletedIds = adminCategories
      .filter((cat: any) => cat.isActive === false)
      .map((cat: any) => cat.id)
    
    // Start with admin categories from database (only active ones with type adults)
    const dbFormatted = adminCategories
      .filter((cat: any) => cat.isActive !== false && cat.type === 'adults')
      .map((cat: any) => ({
        id: cat.id,
        label: cat.nameAr,
        labelEn: cat.name,
        icon: cat.icon || '📁',
        color: `from-slate-600 to-slate-700`,
        borderColor: `border-slate-500`,
        isAdmin: true,
        existsInDb: true
      }))
    
    // Get IDs of categories from database
    const dbIds = dbFormatted.map((c: any) => c.id)
    
    // Add default categories only if:
    // 1. They don't exist in database AND
    // 2. They haven't been deleted (not in deletedIds)
    const defaultsToAdd = defaultCategories
      .filter(cat => !dbIds.includes(cat.id) && !deletedIds.includes(cat.id))
      .map(cat => ({
        ...cat,
        isDefault: true,
        existsInDb: false
      }))
    
    return [...dbFormatted, ...defaultsToAdd]
  }, [adminCategories])

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
      } else {
        return false
      }
    }
    if (selectedDifficulty && item.level !== selectedDifficulty) {
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

  const getThumbnail = (item: AdultContent) => {
    if (item.thumbnailUrl) return item.thumbnailUrl
    const youtubeId = getYoutubeId(item.videoUrl || '')
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    }
    return null
  }

  // إحصائيات
  const intermediateWords = words.filter(w => w.level === 'intermediate')
  const advancedWords = words.filter(w => w.level === 'advanced')
  const stats = {
    totalVideos: allContent.length,
    completed: allContent.filter(c => c.isCompleted).length,
    favorites: allContent.filter(c => c.isFavorite).length,
    lessons: adminLessons.length,
    notes: adminNotes.length,
    completedLessons: completedLessons.length,
    completedNotes: completedNotes.length,
    intermediateWords: intermediateWords.length,
    advancedWords: advancedWords.length
  }

  const overallProgress = stats.totalVideos > 0 ? Math.round((stats.completed / stats.totalVideos) * 100) : 0
  const wordsProgress = words.length > 0 ? Math.round(((intermediateWords.length + advancedWords.length) / words.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Hero Section - Professional Design */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 md:p-8 shadow-2xl">
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
            💼
          </motion.div>
          <motion.div 
            className="absolute top-12 right-24 text-3xl"
            animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🎯
          </motion.div>
          <motion.div 
            className="absolute bottom-8 right-8 text-4xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
          >
            🏆
          </motion.div>
          <motion.div 
            className="absolute bottom-12 left-16 text-3xl"
            animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity }}
          >
            🧠
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl"
                whileHover={{ scale: 1.05 }}
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  تعليم الكبار
                </h1>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/30 text-white border-0 px-3 py-1 text-sm font-bold">
                    15+ سنة
                  </Badge>
                  <p className="text-white/90 text-sm md:text-base">
                    محتوى متقدم واحترافي 💼
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
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${overallProgress * 2.2} 220`}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 220' }}
                    animate={{ strokeDasharray: `${overallProgress * 2.2} 220` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{overallProgress}%</span>
                </div>
              </div>
              <div className="text-white">
                <p className="font-bold text-lg">التقدم الكلي</p>
                <p className="text-white/80">{stats.completed} من {stats.totalVideos}</p>
              </div>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: Play, label: 'فيديوهات', value: stats.totalVideos, gradient: 'from-indigo-500 to-indigo-600' },
              { icon: Check, label: 'مكتمل', value: stats.completed, gradient: 'from-teal-500 to-teal-600' },
              { icon: BookOpen, label: 'دروس', value: stats.lessons, gradient: 'from-purple-500 to-purple-600' },
              { icon: FileText, label: 'مقالات', value: stats.notes, gradient: 'from-amber-500 to-amber-600' }
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

          {/* Words Progress */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/90 font-medium">كلمات متوسطة</span>
                <Badge className="bg-blue-500/30 text-blue-200 font-bold">{stats.intermediateWords}</Badge>
              </div>
              <Progress value={stats.intermediateWords * 5} className="h-2 bg-white/20 rounded-full" />
            </motion.div>
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/90 font-medium">كلمات متقدمة</span>
                <Badge className="bg-purple-500/30 text-purple-200 font-bold">{stats.advancedWords}</Badge>
              </div>
              <Progress value={stats.advancedWords * 5} className="h-2 bg-white/20 rounded-full" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-1.5 rounded-2xl h-auto shadow-md">
          <TabsTrigger 
            value="videos" 
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-indigo-600"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span className="font-medium">الفيديوهات</span>
              {stats.totalVideos > 0 && (
                <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-700">{stats.totalVideos}</Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="lessons"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-purple-600"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">الدروس</span>
              {stats.lessons > 0 && (
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700">{stats.lessons}</Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="articles"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all py-3 data-[state=active]:text-amber-600"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-medium">المقالات</span>
              {stats.notes > 0 && (
                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">{stats.notes}</Badge>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6 mt-6">
          {/* Categories Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-lg">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                </div>
                التصنيفات المهنية
              </h3>
              {selectedCategory && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory(null)}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء الفلتر
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {allCategories.map((cat: any, index: number) => {
                const count = allContent.filter(c => c.category === cat.id || c.category === cat.id.replace('admin-', '')).length
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
                          isSelected ? "bg-white/30 text-white" : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
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
                  showFilters && "bg-gradient-to-r from-indigo-500 to-purple-500"
                )}
              >
                <Filter className="w-4 h-4" />
                الفلاتر
                {(selectedDifficulty || selectedCategory) && (
                  <Badge variant="secondary" className="ml-1 px-1.5 bg-white/20">فعّال</Badge>
                )}
              </Button>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="ابحث عن محتوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-11 bg-white dark:bg-gray-800 rounded-xl border-2 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md space-y-3"
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">مستوى الصعوبة:</p>
                <div className="flex flex-wrap gap-2">
                  {difficultyLevels.map((level) => (
                    <motion.button
                      key={level.id}
                      onClick={() => setSelectedDifficulty(selectedDifficulty === level.id ? null : level.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                        selectedDifficulty === level.id
                          ? level.color
                          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300"
                      )}
                    >
                      {level.label}
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
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">📚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا يوجد محتوى
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة محتوى تعليمي متقدم قريباً من المؤسس
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContent.map((item, index) => {
                const category = defaultCategories.find(c => c.id === item.category)
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
                            category?.color || 'from-gray-600 to-gray-700'
                          )}>
                            <span className="text-5xl opacity-70">{category?.icon || '📚'}</span>
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
                              <Play className="w-7 h-7 text-indigo-500 ml-1" />
                            </div>
                          </motion.div>
                        </div>

                        {/* Duration */}
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/80 rounded-lg text-white text-xs font-medium backdrop-blur-sm">
                          {formatDuration(item.duration)}
                        </div>

                        {/* Level Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge className={cn(
                            "text-white border-0 rounded-lg",
                            item.level === 'professional' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            item.level === 'advanced' ? 'bg-gradient-to-r from-purple-500 to-violet-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          )}>
                            {item.level === 'professional' ? 'احترافي' :
                             item.level === 'advanced' ? 'متقدم' : 'متوسط'}
                          </Badge>
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

                        {/* Completed Badge */}
                        {item.isCompleted && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2"
                          >
                            <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 rounded-lg">
                              <Check className="w-3 h-3 mr-1" />
                              مكتمل
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
                          <Badge variant="outline" className="text-xs rounded-lg border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20">
                            {category?.icon} {category?.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs rounded-lg border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                            {difficultyLevels.find(d => d.id === item.difficulty)?.label}
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
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">📖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد دروس متقدمة
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة دروس متقدمة قريباً من المؤسس
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
                  <Card className="h-full border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-700 shadow-lg hover:shadow-2xl transition-all overflow-hidden group bg-white dark:bg-gray-800 rounded-2xl">
                    {/* Header Gradient */}
                    <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                            <GraduationCap className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {lesson.titleAr}
                              {completedLessons.includes(lesson.id) && (
                                <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs border-0">
                                  <Check className="w-3 h-3 mr-1" />
                                  مكتمل
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{lesson.title}</CardDescription>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-100 dark:bg-indigo-900/30 rounded-xl"
                        >
                          <Maximize2 className="w-4 h-4 text-indigo-600" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                        {lesson.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 rounded-lg">
                          {lesson.category}
                        </Badge>
                        {lesson.level && (
                          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 rounded-lg">
                            {lesson.level}
                          </Badge>
                        )}
                        {lesson.duration && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 rounded-lg">
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

        {/* Articles Tab */}
        <TabsContent value="articles" className="mt-6">
          {adminNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center shadow-lg">
                <span className="text-6xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد مقالات
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                سيتم إضافة مقالات ونصائح مهنية قريباً من المؤسس
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
                    className="h-full border-2 border-transparent hover:border-amber-300 dark:hover:border-amber-700 shadow-lg hover:shadow-2xl transition-all overflow-hidden group bg-white dark:bg-gray-800 rounded-2xl"
                  >
                    {/* Color Bar */}
                    <div 
                      className="h-2"
                      style={{ background: note.color || 'linear-gradient(to right, #6366f1, #14b8a6)' }}
                    />
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-3 rounded-xl"
                            style={{ backgroundColor: `${note.color}20` || 'rgba(99, 102, 241, 0.2)' }}
                          >
                            <FileText className="w-5 h-5" style={{ color: note.color || '#6366f1' }} />
                          </div>
                          <div>
                            <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                              {note.title}
                              {completedNotes.includes(note.id) && (
                                <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs border-0">
                                  <Check className="w-3 h-3 mr-1" />
                                  مقروء
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
                    onClick={() => markVideoAsCompleted(selectedContent.id)}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    إتمام المشاهدة
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
                  onClick={() => markLessonAsCompleted(selectedLesson.id)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  إتمام الدرس
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
                  onClick={() => markNoteAsCompleted(selectedNote.id)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  تمت القراءة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
