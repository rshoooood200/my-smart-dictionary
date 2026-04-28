'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Check, X, ChevronRight, ChevronLeft,
  Lightbulb, Clock, Target, Award, Zap, Star, Heart, Bookmark,
  Shuffle, Eye, EyeOff, Volume2, VolumeX, Sparkles, RefreshCw,
  Layers, Grid, List, Plus, Minus, Move, GripVertical, Trash2,
  Edit3, Save, Download, Upload, Share2, Copy, MoreHorizontal,
  Brain, Puzzle, FileText, MessageSquare, Image, Mic, Video,
  Trophy, Medal, Crown, Flame, TrendingUp, BarChart2, PieChart,
  Newspaper, Headphones, Tv, Quote, Calendar, BookOpen, Hash,
  ExternalLink, Maximize, Minimize, SkipBack, SkipForward,
  Settings, Info, AlertCircle, CheckCircle, XCircle, Loader2, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface Video {
  id: string
  title: string
  titleAr?: string
  description?: string
  thumbnailUrl?: string
  duration: number
  level: string
  category?: string
  views: number
  likes: number
}

interface Podcast {
  id: string
  title: string
  titleAr?: string
  coverUrl?: string
  author?: string
  totalEpisodes: number
  level: string
  category?: string
}

interface PodcastEpisode {
  id: string
  podcastId: string
  title: string
  titleAr?: string
  duration: number
  plays: number
  audioUrl: string
}

interface NewsArticle {
  id: string
  title: string
  titleAr?: string
  content: string
  summary?: string
  source?: string
  imageUrl?: string
  level: string
  category?: string
  publishDate: Date
}

interface Quote {
  id: string
  quote: string
  quoteAr?: string
  author: string
  authorAr?: string
  category?: string
  imageUrl?: string
  saves: number
}

interface Puzzle {
  id: string
  title: string
  titleAr?: string
  type: string
  level: string
  grid?: string
  clues?: string
  words?: string
  xpReward: number
}

interface WordOfTheDay {
  id: string
  word: string
  translation: string
  pronunciation?: string
  definition?: string
  example?: string
  synonyms: string[]
  date: Date
}

// Main Component
export function AdvancedContentHub() {
  const [activeTab, setActiveTab] = useState<string>('videos')

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            مركز المحتوى المتقدم
          </h2>
          <p className="text-gray-500 text-sm mt-1">تعلم الإنجليزية بطرق متنوعة وممتعة</p>
        </div>
      </div>

      {/* Content Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-1 h-auto p-1">
          <TabsTrigger value="videos" className="flex flex-col gap-1 py-2">
            <Tv className="w-4 h-4" />
            <span className="text-xs">فيديوهات</span>
          </TabsTrigger>
          <TabsTrigger value="podcasts" className="flex flex-col gap-1 py-2">
            <Headphones className="w-4 h-4" />
            <span className="text-xs">بودكاست</span>
          </TabsTrigger>
          <TabsTrigger value="news" className="flex flex-col gap-1 py-2">
            <Newspaper className="w-4 h-4" />
            <span className="text-xs">أخبار</span>
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex flex-col gap-1 py-2 hidden sm:flex">
            <Quote className="w-4 h-4" />
            <span className="text-xs">اقتباسات</span>
          </TabsTrigger>
          <TabsTrigger value="puzzles" className="flex flex-col gap-1 py-2 hidden sm:flex">
            <Puzzle className="w-4 h-4" />
            <span className="text-xs">ألغاز</span>
          </TabsTrigger>
          <TabsTrigger value="wordoftheday" className="flex flex-col gap-1 py-2 hidden lg:flex">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">كلمة اليوم</span>
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex flex-col gap-1 py-2 hidden lg:flex">
            <Brain className="w-4 h-4" />
            <span className="text-xs">تمارين</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-4">
          <EducationalVideosSection />
        </TabsContent>
        <TabsContent value="podcasts" className="mt-4">
          <PodcastsSection />
        </TabsContent>
        <TabsContent value="news" className="mt-4">
          <DailyNewsSection />
        </TabsContent>
        <TabsContent value="quotes" className="mt-4">
          <FamousQuotesSection />
        </TabsContent>
        <TabsContent value="puzzles" className="mt-4">
          <WordPuzzlesSection />
        </TabsContent>
        <TabsContent value="wordoftheday" className="mt-4">
          <WordOfTheDaySection />
        </TabsContent>
        <TabsContent value="exercises" className="mt-4">
          <InteractiveExercisesSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================
// Educational Videos Section
// ============================================
function EducationalVideosSection() {
  const [videos] = useState<Video[]>([
    { id: '1', title: 'English Grammar Basics', titleAr: 'أساسيات القواعد الإنجليزية', description: 'Learn the fundamental grammar rules', duration: 1200, level: 'beginner', category: 'grammar', views: 1500, likes: 120 },
    { id: '2', title: 'Daily Conversation Practice', titleAr: 'ممارسة المحادثة اليومية', description: 'Practice everyday English conversations', duration: 900, level: 'intermediate', category: 'conversation', views: 2300, likes: 180 },
    { id: '3', title: 'Advanced Vocabulary Building', titleAr: 'بناء المفردات المتقدمة', description: 'Expand your vocabulary with advanced words', duration: 1500, level: 'advanced', category: 'vocabulary', views: 800, likes: 65 },
    { id: '4', title: 'Pronunciation Masterclass', titleAr: 'ورشة إتقان النطق', description: 'Perfect your English pronunciation', duration: 1800, level: 'intermediate', category: 'pronunciation', views: 1100, likes: 95 },
    { id: '5', title: 'Business English Essentials', titleAr: 'أساسيات الإنجليزية للأعمال', description: 'Professional English for the workplace', duration: 2100, level: 'advanced', category: 'business', views: 650, likes: 55 },
    { id: '6', title: 'English Idioms & Expressions', titleAr: 'التعابير والأمثال الإنجليزية', description: 'Learn common English idioms', duration: 750, level: 'intermediate', category: 'vocabulary', views: 980, likes: 78 },
  ])

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [filter, setFilter] = useState('all')

  const filteredVideos = useMemo(() => {
    if (filter === 'all') return videos
    return videos.filter(v => v.level === filter)
  }, [videos, filter])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const levelColors: Record<string, string> = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-rose-100 text-rose-700'
  }

  const levelLabels: Record<string, string> = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم'
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">تصفية حسب المستوى:</span>
        <div className="flex gap-2">
          {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
            <Button
              key={level}
              variant={filter === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(level)}
            >
              {level === 'all' ? 'الكل' : levelLabels[level]}
            </Button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden" onClick={() => setSelectedVideo(video)}>
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-emerald-600 mr-[-4px]" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{video.titleAr || video.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{video.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={levelColors[video.level]}>{levelLabels[video.level]}</Badge>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {video.views}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {video.likes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          {selectedVideo && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedVideo.titleAr || selectedVideo.title}</DialogTitle>
                <DialogDescription>{selectedVideo.description}</DialogDescription>
              </DialogHeader>
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-400">Video Player Placeholder</p>
                  <p className="text-sm text-gray-500 mt-2">Video URL would be: {selectedVideo.id}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={levelColors[selectedVideo.level]}>{levelLabels[selectedVideo.level]}</Badge>
                  <span className="text-sm text-gray-500">{formatDuration(selectedVideo.duration)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4 ml-1" />
                    إعجاب
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bookmark className="w-4 h-4 ml-1" />
                    حفظ
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// Podcasts Section
// ============================================
function PodcastsSection() {
  const [podcasts] = useState<Podcast[]>([
    { id: '1', title: 'English Learning Daily', titleAr: 'الإنجليزية يومياً', author: 'John Smith', totalEpisodes: 45, level: 'beginner', category: 'learning' },
    { id: '2', title: 'Business English Pod', titleAr: 'بودكاست الإنجليزية للأعمال', author: 'Sarah Johnson', totalEpisodes: 32, level: 'advanced', category: 'business' },
    { id: '3', title: 'British English Stories', titleAr: 'قصص بالإنجليزية البريطانية', author: 'Emma Watson', totalEpisodes: 28, level: 'intermediate', category: 'stories' },
    { id: '4', title: 'Vocabulary Boost', titleAr: 'تعزيز المفردات', author: 'Mike Brown', totalEpisodes: 60, level: 'intermediate', category: 'vocabulary' },
  ])

  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)

  const episodes: PodcastEpisode[] = useMemo(() => [
    { id: '1', podcastId: '1', title: 'Introduction to English', titleAr: 'مقدمة في الإنجليزية', duration: 1200, plays: 1500, audioUrl: '/audio/ep1.mp3' },
    { id: '2', podcastId: '1', title: 'Common Greetings', titleAr: 'التحيات الشائعة', duration: 900, plays: 1200, audioUrl: '/audio/ep2.mp3' },
    { id: '3', podcastId: '1', title: 'Numbers and Counting', titleAr: 'الأرقام والعد', duration: 1500, plays: 980, audioUrl: '/audio/ep3.mp3' },
    { id: '4', podcastId: '1', title: 'Days and Months', titleAr: 'الأيام والشهور', duration: 1100, plays: 850, audioUrl: '/audio/ep4.mp3' },
  ], [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} دقيقة`
  }

  return (
    <div className="space-y-4">
      {/* Podcast Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {podcasts.map((podcast, index) => (
          <motion.div
            key={podcast.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedPodcast(podcast)}>
              <CardContent className="p-4">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 mb-4 flex items-center justify-center">
                  <Headphones className="w-16 h-16 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{podcast.titleAr || podcast.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{podcast.author}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{podcast.totalEpisodes} حلقة</span>
                  <Badge variant="outline" className="text-xs">{podcast.level === 'beginner' ? 'مبتدئ' : podcast.level === 'intermediate' ? 'متوسط' : 'متقدم'}</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Podcast Detail Dialog */}
      <Dialog open={!!selectedPodcast} onOpenChange={() => setSelectedPodcast(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {selectedPodcast && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div>{selectedPodcast.titleAr || selectedPodcast.title}</div>
                    <div className="text-sm font-normal text-gray-500">{selectedPodcast.author}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="h-96">
                <div className="space-y-2 pr-4">
                  {episodes.map((episode, index) => (
                    <motion.div
                      key={episode.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={cn("cursor-pointer transition-all", currentEpisode?.id === episode.id && "border-emerald-500")}
                        onClick={() => setCurrentEpisode(episode)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {currentEpisode?.id === episode.id && isPlaying ? (
                              <Pause className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Play className="w-4 h-4 text-gray-600 ml-0.5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{episode.titleAr || episode.title}</div>
                            <div className="text-xs text-gray-500">{formatDuration(episode.duration)} • {episode.plays} استماع</div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Audio Player */}
              {currentEpisode && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-4 mb-3">
                    <Button
                      size="icon"
                      className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </Button>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{currentEpisode.titleAr || currentEpisode.title}</div>
                      <Progress value={playbackProgress} className="h-2 mt-1" />
                    </div>
                    <div className="text-sm text-gray-500">{formatDuration(currentEpisode.duration)}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// Daily News Section
// ============================================
function DailyNewsSection() {
  const [news] = useState<NewsArticle[]>([
    { 
      id: '1', 
      title: 'Technology Advances in Education', 
      titleAr: 'التقدم التقني في التعليم',
      content: 'New technologies are transforming how students learn around the world. Virtual reality, artificial intelligence, and interactive platforms are making education more accessible and engaging than ever before...',
      summary: 'New technologies are transforming education worldwide.',
      source: 'Tech News Daily',
      level: 'intermediate',
      category: 'technology',
      publishDate: new Date()
    },
    { 
      id: '2', 
      title: 'Climate Change and Global Efforts', 
      titleAr: 'تغير المناخ والجهود العالمية',
      content: 'Countries around the world are implementing new policies to combat climate change. Renewable energy sources are becoming more affordable and widespread...',
      summary: 'Global efforts to fight climate change are increasing.',
      source: 'World News',
      level: 'advanced',
      category: 'environment',
      publishDate: new Date()
    },
    { 
      id: '3', 
      title: 'New Discoveries in Space', 
      titleAr: 'اكتشافات جديدة في الفضاء',
      content: 'Scientists have discovered new exoplanets that could potentially support life. These findings bring us closer to understanding our universe...',
      summary: 'Scientists find new planets that might support life.',
      source: 'Science Today',
      level: 'beginner',
      category: 'science',
      publishDate: new Date()
    },
  ])

  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null)
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set())

  const levelColors: Record<string, string> = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-rose-100 text-rose-700'
  }

  const levelLabels: Record<string, string> = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم'
  }

  const categoryIcons: Record<string, any> = {
    technology: Tv,
    environment: Brain,
    science: Lightbulb,
    culture: BookOpen,
    sports: Trophy
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-500" />
          أخبار اليوم
        </h3>
        <Badge variant="outline">{news.length} مقالات</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {news.map((article, index) => {
          const Icon = categoryIcons[article.category || 'culture'] || Newspaper
          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn("cursor-pointer hover:shadow-lg transition-all", readArticles.has(article.id) && "opacity-75")}
                onClick={() => {
                  setSelectedNews(article)
                  setReadArticles(prev => new Set([...prev, article.id]))
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {article.titleAr || article.title}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{article.summary}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={levelColors[article.level]}>{levelLabels[article.level]}</Badge>
                        <span className="text-xs text-gray-400">{article.source}</span>
                        {readArticles.has(article.id) && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-2xl">
          {selectedNews && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={levelColors[selectedNews.level]}>{levelLabels[selectedNews.level]}</Badge>
                  <span className="text-sm text-gray-500">{selectedNews.source}</span>
                </div>
                <DialogTitle>{selectedNews.titleAr || selectedNews.title}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <div className="prose prose-sm dark:prose-invert">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedNews.content}
                  </p>
                </div>
              </ScrollArea>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Volume2 className="w-4 h-4 ml-2" />
                  استماع
                </Button>
                <Button className="w-full sm:w-auto">
                  <Check className="w-4 h-4 ml-2" />
                  تم القراءة
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// Famous Quotes Section
// ============================================
function FamousQuotesSection() {
  const [quotes] = useState<Quote[]>([
    { id: '1', quote: "The only way to do great work is to love what you do.", quoteAr: "الطريقة الوحيدة للقيام بعمل عظيم هي أن تحب ما تفعله.", author: "Steve Jobs", authorAr: "ستيف جوبز", category: 'motivation', saves: 1250 },
    { id: '2', quote: "In three words I can sum up everything I've learned about life: it goes on.", quoteAr: "في ثلاث كلمات يمكنني تلخيص كل ما تعلمته عن الحياة: تستمر.", author: "Robert Frost", authorAr: "روبرت فروست", category: 'life', saves: 980 },
    { id: '3', quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", quoteAr: "النجاح ليس نهائياً، والفشل ليس قاتلاً: الشجاعة للاستمرار هي ما يهم.", author: "Winston Churchill", authorAr: "ونستون تشرشل", category: 'success', saves: 1450 },
    { id: '4', quote: "Education is the most powerful weapon which you can use to change the world.", quoteAr: "التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم.", author: "Nelson Mandela", authorAr: "نيلسون مانديلا", category: 'learning', saves: 1680 },
    { id: '5', quote: "The future belongs to those who believe in the beauty of their dreams.", quoteAr: "المستقبل ينتمي لأولئك الذين يؤمنون بجمال أحلامهم.", author: "Eleanor Roosevelt", authorAr: "إليانور روزفلت", category: 'motivation', saves: 1120 },
    { id: '6', quote: "Learning never exhausts the mind.", quoteAr: "التعلم لا يستنزف العقل أبداً.", author: "Leonardo da Vinci", authorAr: "ليوناردو دافنشي", category: 'learning', saves: 890 },
  ])

  const [savedQuotes, setSavedQuotes] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('all')
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)

  const categories = ['all', 'motivation', 'life', 'success', 'learning', 'wisdom']

  const categoryLabels: Record<string, string> = {
    all: 'الكل',
    motivation: 'تحفيز',
    life: 'حياة',
    success: 'نجاح',
    learning: 'تعلم',
    wisdom: 'حكمة'
  }

  const filteredQuotes = useMemo(() => {
    if (filter === 'all') return quotes
    return quotes.filter(q => q.category === filter)
  }, [quotes, filter])

  const toggleSave = (id: string) => {
    setSavedQuotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
        toast.info('تم إزالة الاقتباس من المحفوظات')
      } else {
        newSet.add(id)
        toast.success('تم حفظ الاقتباس!')
      }
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {categoryLabels[cat]}
          </Button>
        ))}
      </div>

      {/* Quote of the Day */}
      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-5 h-5" />
            <span className="text-sm opacity-90">اقتباس اليوم</span>
          </div>
          <blockquote className="text-xl font-bold mb-3">
            "{quotes[0].quoteAr || quotes[0].quote}"
          </blockquote>
          <p className="opacity-80">— {quotes[0].authorAr || quotes[0].author}</p>
        </CardContent>
      </Card>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuotes.map((quote, index) => (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="p-5">
                <Quote className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-gray-700 dark:text-gray-300 mb-3 italic">
                  "{quote.quoteAr || quote.quote}"
                </p>
                <p className="text-sm text-gray-500 mb-4">— {quote.authorAr || quote.author}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{categoryLabels[quote.category || 'wisdom']}</Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSave(quote.id)}
                    >
                      <Heart className={cn("w-4 h-4", savedQuotes.has(quote.id) && "fill-rose-500 text-rose-500")} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Word Puzzles Section
// ============================================
function WordPuzzlesSection() {
  const [puzzles] = useState<Puzzle[]>([
    { id: '1', title: 'Daily Crossword', titleAr: 'كلمات متقاطعة يومية', type: 'crossword', level: 'intermediate', xpReward: 50 },
    { id: '2', title: 'Word Search', titleAr: 'بحث عن الكلمات', type: 'wordsearch', level: 'beginner', xpReward: 30 },
    { id: '3', title: 'Word Scramble', titleAr: 'ترتيب الحروف', type: 'scramble', level: 'beginner', xpReward: 20 },
    { id: '4', title: 'Anagram Challenge', titleAr: 'تحدي الأناغرام', type: 'anagram', level: 'advanced', xpReward: 40 },
    { id: '5', title: 'Hangman', titleAr: 'لعبة المشنقة', type: 'hangman', level: 'beginner', xpReward: 25 },
    { id: '6', title: 'Word Ladder', titleAr: 'سلم الكلمات', type: 'wordladder', level: 'advanced', xpReward: 60 },
  ])

  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null)
  const [puzzleState, setPuzzleState] = useState<{
    guesses: string[]
    correct: number
    wrong: number
    completed: boolean
  }>({ guesses: [], correct: 0, wrong: 0, completed: false })

  // Scramble Game State
  const [scrambledWord, setScrambledWord] = useState('')
  const [originalWord, setOriginalWord] = useState('')
  const [userGuess, setUserGuess] = useState('')
  const [score, setScore] = useState(0)

  const words = ['apple', 'banana', 'orange', 'computer', 'language', 'beautiful', 'excellent', 'wonderful']

  const startScrambleGame = useCallback(() => {
    const word = words[Math.floor(Math.random() * words.length)]
    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('')
    setOriginalWord(word)
    setScrambledWord(scrambled)
    setUserGuess('')
  }, [])

  const checkScrambleAnswer = () => {
    if (userGuess.toLowerCase() === originalWord) {
      setScore(prev => prev + 10)
      toast.success('صحيح! +10 نقاط')
      startScrambleGame()
    } else {
      toast.error('خطأ! حاول مرة أخرى')
    }
  }

  const puzzleIcons: Record<string, any> = {
    crossword: Grid,
    wordsearch: Search,
    scramble: Shuffle,
    anagram: Lightbulb,
    hangman: Target,
    wordladder: Layers
  }

  const levelColors: Record<string, string> = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-rose-100 text-rose-700'
  }

  const levelLabels: Record<string, string> = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم'
  }

  return (
    <div className="space-y-4">
      {/* Puzzle Type Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {puzzles.map((puzzle) => {
          const Icon = puzzleIcons[puzzle.type] || Puzzle
          return (
            <motion.div
              key={puzzle.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn("cursor-pointer transition-all", activePuzzle?.id === puzzle.id && "border-emerald-500 ring-2 ring-emerald-200")}
                onClick={() => {
                  setActivePuzzle(puzzle)
                  if (puzzle.type === 'scramble') startScrambleGame()
                }}
              >
                <CardContent className="p-3 text-center">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <div className="font-medium text-sm">{puzzle.titleAr}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Badge className={cn("text-xs", levelColors[puzzle.level])}>{levelLabels[puzzle.level]}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Active Puzzle Area */}
      {activePuzzle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(puzzleIcons[activePuzzle.type] || Puzzle, { className: "w-5 h-5 text-emerald-500" })}
                  {activePuzzle.titleAr}
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-700">
                  <Zap className="w-3 h-3 ml-1" />
                  {activePuzzle.xpReward} XP
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activePuzzle.type === 'scramble' && (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">رتب الحروف لتكوين الكلمة الصحيحة:</p>
                    <div className="text-3xl font-bold text-emerald-600 tracking-widest mb-4">
                      {scrambledWord.toUpperCase().split('').join(' ')}
                    </div>
                    <Input
                      value={userGuess}
                      onChange={(e) => setUserGuess(e.target.value)}
                      placeholder="اكتب الكلمة..."
                      className="text-center text-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      <Star className="w-4 h-4 ml-1 text-amber-500" />
                      {score} نقطة
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={startScrambleGame}>
                        <RefreshCw className="w-4 h-4 ml-2" />
                        كلمة جديدة
                      </Button>
                      <Button onClick={checkScrambleAnswer}>
                        <Check className="w-4 h-4 ml-2" />
                        تحقق
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activePuzzle.type === 'crossword' && (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Grid className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">كلمات متقاطعة تفاعلية</p>
                  <p className="text-sm text-gray-400 mt-2">سيتم تحميل اللعبة...</p>
                </div>
              )}

              {activePuzzle.type === 'wordsearch' && (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">ابحث عن الكلمات المخفية</p>
                  <p className="text-sm text-gray-400 mt-2">سيتم تحميل اللعبة...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

// ============================================
// Word of the Day Section
// ============================================
function WordOfTheDaySection() {
  const [wordOfTheDay] = useState<WordOfTheDay>({
    id: '1',
    word: 'Serendipity',
    translation: 'الصدفة السعيدة',
    pronunciation: '/ˌser.ənˈdɪp.ə.ti/',
    definition: 'The occurrence of events by chance in a happy or beneficial way.',
    example: 'Finding that old photo was pure serendipity.',
    synonyms: ['luck', 'fortune', 'chance', 'providence'],
    date: new Date()
  })

  const [showTranslation, setShowTranslation] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [hasPracticed, setHasPracticed] = useState(false)

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Word Card */}
      <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-24 translate-y-24" />
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-white/20 text-white border-0">
              <Calendar className="w-3 h-3 ml-1" />
              كلمة اليوم
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsSaved(!isSaved)}
              >
                <Heart className={cn("w-5 h-5", isSaved && "fill-white")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => speak(wordOfTheDay.word)}
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-2">{wordOfTheDay.word}</h2>
          <p className="text-white/80 text-lg mb-1">{wordOfTheDay.pronunciation}</p>
          
          <motion.div
            initial={false}
            animate={{ height: showTranslation ? 'auto' : 0, opacity: showTranslation ? 1 : 0 }}
            className="overflow-hidden"
          >
            <p className="text-2xl font-bold text-amber-300 mt-4">{wordOfTheDay.translation}</p>
          </motion.div>

          <Button
            variant="ghost"
            className="mt-4 text-white hover:bg-white/20"
            onClick={() => setShowTranslation(!showTranslation)}
          >
            {showTranslation ? <EyeOff className="w-4 h-4 ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
            {showTranslation ? 'إخفاء الترجمة' : 'إظهار الترجمة'}
          </Button>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Definition & Example */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              التعريف والمثال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">التعريف:</p>
              <p className="text-gray-700 dark:text-gray-300">{wordOfTheDay.definition}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">مثال:</p>
              <p className="text-gray-700 dark:text-gray-300 italic">"{wordOfTheDay.example}"</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => speak(wordOfTheDay.example || '')}
              >
                <Volume2 className="w-4 h-4 ml-1" />
                استمع للمثال
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Synonyms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="w-5 h-5 text-emerald-500" />
              المرادفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {wordOfTheDay.synonyms.map((synonym, i) => (
                <Badge key={i} variant="secondary" className="text-sm py-1.5 cursor-pointer hover:bg-emerald-100" onClick={() => speak(synonym)}>
                  {synonym}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practice Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            تمرين سريع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              هل تعرف معنى كلمة "{wordOfTheDay.word}"؟
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setHasPracticed(true)
                  toast.success('أحسنت! استمر في التعلم')
                }}
              >
                <Check className="w-4 h-4 ml-2" />
                نعم، أعرفها
              </Button>
              <Button
                onClick={() => {
                  setShowTranslation(true)
                  setHasPracticed(true)
                }}
              >
                <Lightbulb className="w-4 h-4 ml-2" />
                أريد التعلم
              </Button>
            </div>
          </div>
          {hasPracticed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center"
            >
              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-emerald-700 dark:text-emerald-400">تم التمرين! +10 XP</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// Interactive Exercises Section
// ============================================
function InteractiveExercisesSection() {
  const [currentExercise, setCurrentExercise] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  const exercises = [
    {
      id: 1,
      type: 'fill_blank',
      question: 'The cat is ___ the table.',
      questionAr: 'القطة ___ الطاولة.',
      options: ['on', 'in', 'at', 'to'],
      correct: 'on'
    },
    {
      id: 2,
      type: 'translation',
      question: 'What is the meaning of "beautiful"?',
      questionAr: 'ما معنى كلمة "beautiful"؟',
      options: ['جميل', 'كبير', 'صغير', 'سريع'],
      correct: 'جميل'
    },
    {
      id: 3,
      type: 'grammar',
      question: 'She ___ to school every day.',
      questionAr: 'هي ___ إلى المدرسة كل يوم.',
      options: ['go', 'goes', 'going', 'went'],
      correct: 'goes'
    },
    {
      id: 4,
      type: 'vocabulary',
      question: 'Choose the synonym of "happy":',
      questionAr: 'اختر مرادف كلمة "happy":',
      options: ['sad', 'joyful', 'angry', 'tired'],
      correct: 'joyful'
    },
    {
      id: 5,
      type: 'spelling',
      question: 'Which spelling is correct?',
      questionAr: 'أي تهجئة صحيحة؟',
      options: ['recieve', 'receive', 'receeve', 'recive'],
      correct: 'receive'
    }
  ]

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentExercise]: answer }))
    
    if (answer === exercises[currentExercise].correct) {
      setScore(prev => prev + 20)
      toast.success('إجابة صحيحة! +20 نقطة')
    } else {
      toast.error('إجابة خاطئة!')
    }

    if (currentExercise < exercises.length - 1) {
      setTimeout(() => setCurrentExercise(prev => prev + 1), 500)
    } else {
      setTimeout(() => setShowResults(true), 500)
    }
  }

  const reset = () => {
    setCurrentExercise(0)
    setAnswers({})
    setShowResults(false)
    setScore(0)
  }

  if (showResults) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">تم إنهاء التمارين!</h3>
          <div className="text-4xl font-bold text-emerald-600 mb-4">{score} نقطة</div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <div className="text-xl font-bold">{Object.entries(answers).filter(([i, a]) => exercises[parseInt(i)].correct === a).length}</div>
              <div className="text-xs text-gray-500">صحيح</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
              <X className="w-6 h-6 text-rose-500 mx-auto mb-1" />
              <div className="text-xl font-bold">{exercises.length - Object.entries(answers).filter(([i, a]) => exercises[parseInt(i)].correct === a).length}</div>
              <div className="text-xs text-gray-500">خطأ</div>
            </div>
          </div>
          <Button onClick={reset}>تمارين جديدة</Button>
        </CardContent>
      </Card>
    )
  }

  const exercise = exercises[currentExercise]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">السؤال {currentExercise + 1} من {exercises.length}</span>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Star className="w-4 h-4 ml-1 text-amber-500" />
          {score} نقطة
        </Badge>
      </div>
      <Progress value={((currentExercise + 1) / exercises.length) * 100} />

      {/* Exercise Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{exercise.question}</CardTitle>
          <CardDescription>{exercise.questionAr}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {exercise.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => !answers[currentExercise] && handleAnswer(option)}
              disabled={!!answers[currentExercise]}
              className={cn(
                "w-full p-4 rounded-xl text-right transition-all",
                "border-2",
                answers[currentExercise] === option && option === exercise.correct && "bg-emerald-50 border-emerald-500",
                answers[currentExercise] === option && option !== exercise.correct && "bg-rose-50 border-rose-500",
                !answers[currentExercise] && "border-gray-200 hover:border-emerald-400 bg-white dark:bg-gray-800"
              )}
            >
              <span className="text-sm text-gray-400 ml-2">{['أ', 'ب', 'ج', 'د'][index]}</span>
              {option}
            </motion.button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvancedContentHub
