'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, TrendingUp, Clock, Target, Award, Flame,
  Calendar, ChevronRight, Brain, BookOpen, CheckCircle,
  XCircle, Zap, Trophy, Star, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface StatsData {
  overview: {
    totalWords: number
    learnedWords: number
    favoriteWords: number
    dueWords: number
    categoriesCount: number
    totalReviews: number
    accuracy: number
    avgWordsPerDay: number
    totalStudyTime: number
    currentStreak: number
    longestStreak: number
    xp: number
    level: number
    wordsMastered: number
  }
  categories: Array<{
    id: string
    name: string
    nameAr?: string
    color: string
    wordsCount: number
  }>
  recentWords: Array<{
    id: string
    word: string
    translation: string
    createdAt: string
  }>
  chartData: {
    dailyActivity: Array<{
      date: string
      wordsAdded: number
      wordsReviewed: number
      studyTime: number
    }>
    levelDistribution: Array<{
      level: string
      count: number
      label: string
    }>
    categoryDistribution: Array<{
      categoryId: string
      name: string
      color: string
      count: number
    }>
    progressCurve: Array<{
      day: number
      date: string
      accumulated: number
    }>
  }
  heatmapData: Array<{
    date: string
    level: number
    words: number
  }>
  goals: {
    daily: { target: number; current: number; achieved: boolean }
    weekly: { target: number; current: number; achieved: boolean }
    mastery: { target: number; current: number; progress: number }
  }
  achievements: string[]
}

interface AdvancedStatsProps {
  userId: string
}

const levelColors: Record<string, string> = {
  beginner: 'from-emerald-400 to-emerald-600',
  intermediate: 'from-amber-400 to-amber-600',
  advanced: 'from-rose-400 to-rose-600',
}

const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export function AdvancedStats({ userId }: AdvancedStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('week')
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'heatmap'>('overview')

  useEffect(() => {
    fetchStats()
  }, [userId, period])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/stats/advanced?userId=${userId}&period=${period}`)
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (!stats) return null

  const { overview, chartData, heatmapData, goals, achievements } = stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الإحصائيات المتقدمة</h2>
          <p className="text-gray-500 text-sm">تتبع تقدمك وحقق أهدافك</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">أسبوع</SelectItem>
            <SelectItem value="month">شهر</SelectItem>
            <SelectItem value="year">سنة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'الكلمات', value: overview.totalWords, icon: BookOpen, color: 'text-blue-500' },
          { label: 'المحفوظة', value: overview.learnedWords, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'المراجعات', value: overview.totalReviews, icon: Brain, color: 'text-violet-500' },
          { label: 'الدقة', value: `${overview.accuracy}%`, icon: Target, color: 'text-amber-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                  <stat.icon className={cn('w-8 h-8', stat.color)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Goals Progress */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            الأهداف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'daily', label: 'هدف يومي', icon: Calendar },
            { key: 'weekly', label: 'هدف أسبوعي', icon: Activity },
            { key: 'mastery', label: 'الإتقان', icon: Award },
          ].map((goal) => {
            const data = goals[goal.key as keyof typeof goals]
            const progress = goal.key === 'mastery' 
              ? data.progress 
              : Math.min(100, Math.round((data.current / data.target) * 100))
            
            return (
              <div key={goal.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <goal.icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{goal.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {data.current} / {data.target}
                    </span>
                    {'achieved' in data && data.achieved && (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Streak & XP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-rose-500 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Flame className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">سلسلة الإنجاز</p>
                  <p className="text-3xl font-bold">{overview.currentStreak} يوم</p>
                  <p className="text-white/60 text-xs">الأطول: {overview.longestStreak} يوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">النقاط</p>
                  <p className="text-3xl font-bold">{overview.xp} XP</p>
                  <p className="text-white/60 text-xs">المستوى {overview.level}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity Heatmap */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            نشاط الدراسة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-0.5 min-w-fit">
              {heatmapData.map((day, i) => (
                <div
                  key={day.date}
                  className={cn(
                    'w-3 h-3 rounded-sm cursor-pointer transition-colors',
                    day.level === 0 && 'bg-gray-100 dark:bg-gray-800',
                    day.level === 1 && 'bg-emerald-200',
                    day.level === 2 && 'bg-emerald-400',
                    day.level === 3 && 'bg-emerald-500',
                    day.level === 4 && 'bg-emerald-600'
                  )}
                  title={`${day.date}: ${day.words} كلمة`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>أقل</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={cn(
                  'w-3 h-3 rounded-sm',
                  level === 0 && 'bg-gray-100 dark:bg-gray-800',
                  level === 1 && 'bg-emerald-200',
                  level === 2 && 'bg-emerald-400',
                  level === 3 && 'bg-emerald-500',
                  level === 4 && 'bg-emerald-600'
                )}
              />
            ))}
            <span>أكثر</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Level Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">توزيع الكلمات حسب المستوى</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.levelDistribution.map((level, i) => {
                const total = chartData.levelDistribution.reduce((sum, l) => sum + l.count, 0)
                const percentage = total > 0 ? Math.round((level.count / total) * 100) : 0
                
                return (
                  <div key={level.level} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{level.label}</span>
                      <span className="text-gray-500">{level.count} ({percentage}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={cn('h-full rounded-full', `bg-gradient-to-r ${levelColors[level.level] || 'bg-gray-400'}`)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">الكلمات حسب التصنيف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chartData.categoryDistribution.slice(0, 5).map((cat, i) => (
                <motion.div
                  key={cat.categoryId || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <Badge variant="secondary">{cat.count}</Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            منحنى التقدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 relative">
            {/* Y Axis Labels */}
            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 pr-2">
              <span>{Math.max(...chartData.progressCurve.map(d => d.accumulated))}</span>
              <span>{Math.round(Math.max(...chartData.progressCurve.map(d => d.accumulated)) / 2)}</span>
              <span>0</span>
            </div>
            
            {/* Chart Area */}
            <div className="absolute right-8 left-0 top-0 bottom-0">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2].map(i => (
                  <div key={i} className="border-b border-gray-100 dark:border-gray-800" />
                ))}
              </div>
              
              {/* Bars */}
              <div className="absolute inset-0 flex items-end gap-1 px-2">
                {chartData.progressCurve.map((day, i) => {
                  const max = Math.max(...chartData.progressCurve.map(d => d.accumulated), 1)
                  const height = (day.accumulated / max) * 100
                  
                  return (
                    <motion.div
                      key={day.day}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.02 }}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm min-w-[4px]"
                      title={`اليوم ${day.day}: ${day.accumulated} كلمة`}
                    />
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* X Axis Labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-400 mr-8">
            <span>اليوم 1</span>
            <span>اليوم {chartData.progressCurve.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            آخر الكلمات المضافة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentWords.map((word, i) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div>
                  <p className="font-medium">{word.word}</p>
                  <p className="text-sm text-gray-500">{word.translation}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(word.createdAt).toLocaleDateString('ar-SA')}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
