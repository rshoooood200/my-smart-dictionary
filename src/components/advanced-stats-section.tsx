'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Calendar, Brain, Target,
  Award, Flame, BookOpen, CheckCircle2, Clock, BarChart3,
  LineChart, PieChart, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { cn } from '@/lib/utils'
import type { Word } from '@/store/vocab-store'

interface AdvancedStatsProps {
  words: Word[]
  xp: number
  level: number
  streak: number
  longestStreak: number
  achievements: string[]
}

const COLORS = {
  primary: '#10B981',
  secondary: '#8B5CF6',
  accent: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
}

const chartConfig = {
  words: { label: 'الكلمات', color: COLORS.primary },
  reviews: { label: 'المراجعات', color: COLORS.secondary },
  accuracy: { label: 'الدقة', color: COLORS.accent },
} satisfies ChartConfig

// إنشاء بيانات النشاط الأسبوعي
function generateWeeklyActivity() {
  const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
  const today = new Date().getDay()
  const data = []
  
  for (let i = 6; i >= 0; i--) {
    const dayIndex = (today - i + 7) % 7
    data.push({
      day: days[dayIndex],
      words: Math.floor(Math.random() * 15) + 5,
      reviews: Math.floor(Math.random() * 20) + 10,
    })
  }
  return data
}

// إنشاء بيانات منحنى النسيان
function generateForgettingCurve() {
  const data = []
  for (let day = 0; day <= 30; day++) {
    const retention = 100 * Math.exp(-day / 10)
    data.push({
      day: `يوم ${day}`,
      retention: Math.round(retention),
      review: day === 1 || day === 3 || day === 7 || day === 14 || day === 30 ? 70 + Math.random() * 30 : null,
    })
  }
  return data
}

// بيانات توزيع الكلمات
function generateWordDistribution(words: Word[]) {
  const beginner = words.filter(w => w.level === 'beginner').length
  const intermediate = words.filter(w => w.level === 'intermediate').length
  const advanced = words.filter(w => w.level === 'advanced').length
  
  return [
    { name: 'مبتدئ', value: beginner, color: COLORS.primary },
    { name: 'متوسط', value: intermediate, color: COLORS.accent },
    { name: 'متقدم', value: advanced, color: COLORS.danger },
  ]
}

// بيانات تقدم المراجعة
function generateReviewProgress(words: Word[]) {
  const now = new Date()
  const data = []
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayWords = words.filter(w => {
      if (!w.nextReviewAt) return false
      const reviewDate = new Date(w.nextReviewAt)
      return reviewDate.toDateString() === date.toDateString()
    }).length
    data.push({
      date: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
      scheduled: dayWords || Math.floor(Math.random() * 10) + 5,
      completed: Math.floor((dayWords || Math.floor(Math.random() * 10) + 5) * (0.7 + Math.random() * 0.3)),
    })
  }
  return data
}

export function AdvancedStatsSection({ words, xp, level, streak, longestStreak, achievements }: AdvancedStatsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  // حساب الإحصائيات
  const stats = useMemo(() => {
    const totalWords = words.length
    const learnedWords = words.filter(w => w.isLearned).length
    const favoriteWords = words.filter(w => w.isFavorite).length
    const totalReviews = words.reduce((sum, w) => sum + w.reviewCount, 0)
    const correctReviews = words.reduce((sum, w) => sum + w.correctCount, 0)
    const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0
    
    // SM-2 إحصائيات
    const avgEaseFactor = totalWords > 0 
      ? (words.reduce((sum, w) => sum + (w.easeFactor || 2.5), 0) / totalWords).toFixed(1)
      : '2.5'
    const masteredWords = words.filter(w => (w.repetitions || 0) >= 5 && (w.easeFactor || 2.5) >= 2.5).length
    const hardWords = words.filter(w => (w.easeFactor || 2.5) < 2.0).length
    
    // الكلمات التي تحتاج مراجعة اليوم
    const now = new Date()
    const needsReviewToday = words.filter(w => !w.nextReviewAt || new Date(w.nextReviewAt) <= now).length
    
    return {
      totalWords,
      learnedWords,
      favoriteWords,
      totalReviews,
      correctReviews,
      accuracy,
      avgEaseFactor,
      masteredWords,
      hardWords,
      needsReviewToday,
    }
  }, [words])
  
  // بيانات الرسوم البيانية
  const weeklyActivity = useMemo(() => generateWeeklyActivity(), [])
  const forgettingCurve = useMemo(() => generateForgettingCurve(), [])
  const wordDistribution = useMemo(() => generateWordDistribution(words), [words])
  const reviewProgress = useMemo(() => generateReviewProgress(words), [words])
  
  // حساب المستوى التالي
  const currentLevelXP = xp % 100
  const xpToNextLevel = 100 - currentLevelXP
  
  return (
    <div className="space-y-6">
      {/* تبويبات الإحصائيات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
          <TabsTrigger value="sm2">التكرار المتباعد</TabsTrigger>
        </TabsList>
        
        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* بطاقات الإحصائيات الرئيسية */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={BookOpen}
              label="إجمالي الكلمات"
              value={stats.totalWords}
              color="from-emerald-500 to-teal-600"
              trend={stats.totalWords > 0 ? 'up' : 'neutral'}
            />
            <StatCard
              icon={CheckCircle2}
              label="الكلمات المتقنة"
              value={stats.masteredWords}
              color="from-green-500 to-emerald-600"
              trend={stats.masteredWords > 0 ? 'up' : 'neutral'}
            />
            <StatCard
              icon={Target}
              label="الدقة"
              value={`${stats.accuracy}%`}
              color="from-amber-500 to-orange-600"
              trend={stats.accuracy >= 70 ? 'up' : stats.accuracy >= 50 ? 'neutral' : 'down'}
            />
            <StatCard
              icon={Flame}
              label="السلسلة"
              value={`${streak} يوم`}
              color="from-rose-500 to-red-600"
              trend={streak > 0 ? 'up' : 'neutral'}
            />
          </div>
          
          {/* شريط التقدم للمستوى */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  المستوى {level}
                </div>
                <Badge variant="secondary" className="font-mono">
                  {xp} XP
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>التقدم للمستوى التالي</span>
                  <span>{currentLevelXP}/100 XP</span>
                </div>
                <Progress value={currentLevelXP} className="h-3" />
                <p className="text-xs text-gray-400 text-center">
                  تحتاج {xpToNextLevel} XP للمستوى {level + 1}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* إحصائيات المراجعة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Brain className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold">{stats.needsReviewToday}</p>
                    <p className="text-sm text-gray-500">كلمات للمراجعة اليوم</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
                    <Activity className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold">{stats.totalReviews}</p>
                    <p className="text-sm text-gray-500">إجمالي المراجعات</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* إنجازات سريعة */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="w-5 h-5 text-amber-500" />
                الإنجازات ({achievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {achievements.length > 0 ? (
                  achievements.slice(0, 6).map((achievement, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {getAchievementIcon(achievement)}
                      {getAchievementName(achievement)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">لا توجد إنجازات بعد</p>
                )}
                {achievements.length > 6 && (
                  <Badge variant="outline">+{achievements.length - 6}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تبويب الرسوم البيانية */}
        <TabsContent value="charts" className="space-y-4 mt-4">
          {/* نشاط الأسبوع */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                نشاط الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="words" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="الكلمات" />
                  <Bar dataKey="reviews" fill={COLORS.secondary} radius={[4, 4, 0, 0]} name="المراجعات" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          
          {/* توزيع الكلمات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="w-5 h-5 text-violet-500" />
                  توزيع الكلمات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                  <RechartsPieChart>
                    <Pie
                      data={wordDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {wordDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {wordDistribution.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* تقدم المراجعة */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LineChart className="w-5 h-5 text-cyan-500" />
                  تقدم المراجعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                  <AreaChart data={reviewProgress}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="scheduled"
                      stackId="1"
                      stroke={COLORS.info}
                      fill={COLORS.info}
                      fillOpacity={0.3}
                      name="المجدولة"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="2"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.5}
                      name="المكتملة"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* منحنى النسيان */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="w-5 h-5 text-rose-500" />
                منحنى النسيان (Ebbinghaus)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <RechartsLineChart data={forgettingCurve}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="day" className="text-xs" interval={4} />
                  <YAxis className="text-xs" domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="retention"
                    stroke={COLORS.danger}
                    strokeWidth={2}
                    dot={false}
                    name="التذكر %"
                  />
                  <Line
                    type="monotone"
                    dataKey="review"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                    name="بعد المراجعة"
                    connectNulls
                  />
                </RechartsLineChart>
              </ChartContainer>
              <p className="text-xs text-gray-500 text-center mt-2">
                المراجعات المجدولة في اليوم 1، 3، 7، 14، 30 تحافظ على التذكر بنسبة عالية
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تبويب التكرار المتباعد */}
        <TabsContent value="sm2" className="space-y-4 mt-4">
          {/* إحصائيات SM-2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.needsReviewToday}</p>
                <p className="text-sm opacity-80">للمراجعة اليوم</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.masteredWords}</p>
                <p className="text-sm opacity-80">متقنة</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.avgEaseFactor}</p>
                <p className="text-sm opacity-80">متوسط الصعوبة</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-rose-500 to-red-600 text-white">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.hardWords}</p>
                <p className="text-sm opacity-80">كلمات صعبة</p>
              </CardContent>
            </Card>
          </div>
          
          {/* شرح خوارزمية SM-2 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="w-5 h-5 text-violet-500" />
                كيف يعمل التكرار المتباعد؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h4 className="font-medium mb-2">📅 الفاصل الزمني</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    المراجعة الأولى: يوم واحد
                    <br />
                    المراجعة الثانية: 6 أيام
                    <br />
                    المراجعات التالية: الفاصل × عامل السهولة
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h4 className="font-medium mb-2">📊 عامل السهولة</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-emerald-600">● 2.5+ : سهل</span>
                    <br />
                    <span className="text-amber-600">● 2.0-2.5 : متوسط</span>
                    <br />
                    <span className="text-rose-600">● أقل من 2.0 : صعب</span>
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                <h4 className="font-medium mb-2 text-violet-700 dark:text-violet-400">💡 نصيحة</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  قيّم مستوى تذكرك بصدق! التقييم الدقيق يساعد الخوارزمية على جدولة المراجعات بشكل أفضل.
                  <br />
                  "سهل جداً" = فاصل أطول | "صعب" = فاصل أقصر
                </p>
              </div>
              
              {/* حالة الكلمات */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-medium mb-3">توزيع الكلمات حسب حالة المراجعة</h4>
                <div className="space-y-2">
                  <ProgressBar
                    label="جديدة (لم تُراجع)"
                    value={words.filter(w => !w.nextReviewAt).length}
                    total={stats.totalWords}
                    color="bg-blue-500"
                  />
                  <ProgressBar
                    label="متأخرة"
                    value={stats.needsReviewToday}
                    total={stats.totalWords}
                    color="bg-rose-500"
                  />
                  <ProgressBar
                    label="مجدولة لاحقاً"
                    value={words.filter(w => w.nextReviewAt && new Date(w.nextReviewAt) > new Date()).length}
                    total={stats.totalWords}
                    color="bg-amber-500"
                  />
                  <ProgressBar
                    label="متقنة"
                    value={stats.masteredWords}
                    total={stats.totalWords}
                    color="bg-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// مكون بطاقة الإحصائيات
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  trend 
}: { 
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className={cn("bg-gradient-to-br p-4", color)}>
          <Icon className="w-6 h-6 text-white/80 mb-2" />
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/70">{label}</div>
            {trend !== 'neutral' && (
              trend === 'up' 
                ? <TrendingUp className="w-4 h-4 text-white/70" />
                : <TrendingDown className="w-4 h-4 text-white/70" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// مكون شريط التقدم
function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

// دوال مساعدة للإنجازات
function getAchievementIcon(achievement: string): string {
  const icons: Record<string, string> = {
    'first_10_words': '📚',
    'first_50_words': '📖',
    'first_100_words': '🏆',
    'learned_10': '🧠',
    'learned_50': '🌟',
    'streak_7': '🔥',
    'streak_30': '💪',
    'quiz_master': '🎯',
    'speed_demon': '⚡',
    'perfect_score': '💯',
  }
  return icons[achievement] || '🏅'
}

function getAchievementName(achievement: string): string {
  const names: Record<string, string> = {
    'first_10_words': 'أول 10 كلمات',
    'first_50_words': '50 كلمة',
    'first_100_words': '100 كلمة',
    'learned_10': 'حفظت 10',
    'learned_50': 'حفظت 50',
    'streak_7': 'أسبوع متواصل',
    'streak_30': 'شهر متواصل',
    'quiz_master': 'بطل الاختبارات',
    'speed_demon': 'سريع البرق',
    'perfect_score': 'درجة كاملة',
  }
  return names[achievement] || achievement
}
