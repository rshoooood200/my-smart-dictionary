'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, Clock, Target, Brain,
  Calendar, Award, Flame, Zap, Eye, ChevronRight, Activity,
  PieChart, LineChart, Loader2, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AdvancedAnalyticsProps {
  currentUserId: string
  words: any[]
  categories: any[]
}

interface DailyAnalytics {
  date: Date
  totalStudyTime: number
  wordsReviewed: number
  wordsLearned: number
  correctAnswers: number
  wrongAnswers: number
  accuracy: number
  xpEarned: number
}

interface CategoryAnalysis {
  id: string
  name: string
  nameAr?: string
  color: string
  totalWords: number
  masteredWords: number
  learningWords: number
  strength: number
}

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export function AdvancedAnalytics({ currentUserId, words, categories }: AdvancedAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Analytics data
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [totals, setTotals] = useState<any>({})
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([])
  const [weeklyComparison, setWeeklyComparison] = useState<any>({})
  const [retentionData, setRetentionData] = useState<any>({})
  const [bestHour, setBestHour] = useState<number | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [currentUserId])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [overviewRes, categoryRes, weeklyRes, retentionRes] = await Promise.all([
        fetch(`/api/analytics?userId=${currentUserId}&type=overview`),
        fetch(`/api/analytics?userId=${currentUserId}&type=category-analysis`),
        fetch(`/api/analytics?userId=${currentUserId}&type=weekly-comparison`),
        fetch(`/api/analytics?userId=${currentUserId}&type=retention-analysis`)
      ])

      const overviewData = await overviewRes.json()
      const categoryData = await categoryRes.json()
      const weeklyData = await weeklyRes.json()
      const retentionDataRes = await retentionRes.json()

      setDailyAnalytics(overviewData.dailyAnalytics || [])
      setTotals(overviewData.totals || {})
      setBestHour(overviewData.bestHour)
      setCategoryAnalysis(categoryData.categories || [])
      setWeeklyComparison(weeklyData)
      setRetentionData(retentionDataRes)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('حدث خطأ في تحميل التحليلات')
    } finally {
      setLoading(false)
    }
  }

  // Format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours} ساعة ${mins > 0 ? `${mins} دقيقة` : ''}`
  }

  // Get hour label
  const getHourLabel = (hour: number) => {
    if (hour === null) return 'غير محدد'
    const period = hour >= 12 ? 'م' : 'ص'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:00 ${period}`
  }

  // Calculate stats
  const averageAccuracy = totals.correctAnswers + totals.wrongAnswers > 0
    ? Math.round((totals.correctAnswers / (totals.correctAnswers + totals.wrongAnswers)) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">التحليلات المتقدمة</h2>
          <p className="text-gray-500 text-sm">تتبع تقدمك وحسّن أدائك</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics}>
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{formatTime(totals.totalStudyTime || 0)}</div>
                <div className="text-sm opacity-80">وقت الدراسة</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{averageAccuracy}%</div>
                <div className="text-sm opacity-80">معدل الدقة</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{totals.wordsLearned || 0}</div>
                <div className="text-sm opacity-80">كلمات تعلمتها</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{totals.xpEarned || 0}</div>
                <div className="text-sm opacity-80">نقاط XP</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">
            <PieChart className="w-4 h-4 ml-2" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="categories">
            <BarChart3 className="w-4 h-4 ml-2" />
            التصنيفات
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <Calendar className="w-4 h-4 ml-2" />
            مقارنة أسبوعية
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Brain className="w-4 h-4 ml-2" />
            التذكر
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Best Learning Time */}
          {bestHour !== null && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">أفضل وقت للتعلم</h4>
                    <p className="text-sm text-gray-500">
                      أنت أكثر إنتاجية في الساعة {getHourLabel(bestHour)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Chart (Simple Bar Chart) */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">نشاطك خلال 30 يوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-32">
                {dailyAnalytics.slice(-30).map((day, index) => {
                  const height = Math.max(4, (day.wordsReviewed / Math.max(...dailyAnalytics.map(d => d.wordsReviewed), 1)) * 100)
                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      className="flex-1 bg-emerald-500 rounded-t min-w-[4px] hover:bg-emerald-600 transition-colors cursor-pointer"
                      title={`${new Date(day.date).toLocaleDateString('ar-SA')}: ${day.wordsReviewed} كلمة`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>قبل 30 يوم</span>
                <span>اليوم</span>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  ملخص الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">إجمالي المراجعات</span>
                  <span className="font-bold">{totals.wordsReviewed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">الإجابات الصحيحة</span>
                  <span className="font-bold text-emerald-600">{totals.correctAnswers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">الإجابات الخاطئة</span>
                  <span className="font-bold text-rose-600">{totals.wrongAnswers || 0}</span>
                </div>
                <Progress value={averageAccuracy} className="h-2" />
                <p className="text-sm text-center text-gray-500">معدل الدقة: {averageAccuracy}%</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  نصائح للتحسين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {averageAccuracy < 70 && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      💡 حاول مراجعة الكلمات بشكل متكرر لتحسين معدل الدقة
                    </p>
                  </div>
                )}
                {(totals.totalStudyTime || 0) < 60 && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ⏰ خصص 15 دقيقة يومياً للمراجعة للحصول على نتائج أفضل
                    </p>
                  </div>
                )}
                {averageAccuracy >= 80 && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      🌟 أداء ممتاز! استمر في الحفاظ على هذا المستوى
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">قوة التصنيفات</CardTitle>
              <CardDescription>توزيع إتقانك للكلمات حسب التصنيف</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryAnalysis.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد تصنيفات بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryAnalysis.map((cat, index) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium">{cat.nameAr || cat.name}</span>
                        </div>
                        <Badge className={cn(
                          cat.strength >= 80 ? "bg-emerald-100 text-emerald-700" :
                          cat.strength >= 50 ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {Math.round(cat.strength)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-gray-500 mb-2">
                        <span>إجمالي: {cat.totalWords}</span>
                        <span className="text-emerald-600">متقن: {cat.masteredWords}</span>
                        <span className="text-amber-600">تعلم: {cat.learningWords}</span>
                      </div>
                      <Progress value={cat.strength} className="h-2" />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Comparison Tab */}
        <TabsContent value="weekly" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">هذا الأسبوع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">كلمات تعلمتها</span>
                  <span className="font-bold">{weeklyComparison.thisWeek?.wordsLearned || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">كلمات راجعتها</span>
                  <span className="font-bold">{weeklyComparison.thisWeek?.wordsReviewed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">نقاط XP</span>
                  <span className="font-bold text-amber-600">{weeklyComparison.thisWeek?.xpEarned || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">وقت الدراسة</span>
                  <span className="font-bold">{formatTime(weeklyComparison.thisWeek?.studyTime || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">الأسبوع الماضي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">كلمات تعلمتها</span>
                  <span className="font-bold">{weeklyComparison.lastWeek?.wordsLearned || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">كلمات راجعتها</span>
                  <span className="font-bold">{weeklyComparison.lastWeek?.wordsReviewed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">نقاط XP</span>
                  <span className="font-bold">{weeklyComparison.lastWeek?.xpEarned || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">وقت الدراسة</span>
                  <span className="font-bold">{formatTime(weeklyComparison.lastWeek?.studyTime || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Improvement */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">مقارنة التحسن</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {weeklyComparison.improvement?.wordsLearned >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                  )}
                  <div className="text-2xl font-bold">
                    {weeklyComparison.improvement?.wordsLearned >= 0 ? '+' : ''}
                    {weeklyComparison.improvement?.wordsLearned || 0}
                  </div>
                  <div className="text-sm text-gray-500">كلمات جديدة</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {weeklyComparison.improvement?.wordsReviewed >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                  )}
                  <div className="text-2xl font-bold">
                    {weeklyComparison.improvement?.wordsReviewed >= 0 ? '+' : ''}
                    {weeklyComparison.improvement?.wordsReviewed || 0}
                  </div>
                  <div className="text-sm text-gray-500">مراجعات</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {weeklyComparison.improvement?.xpEarned >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                  )}
                  <div className="text-2xl font-bold">
                    {weeklyComparison.improvement?.xpEarned >= 0 ? '+' : ''}
                    {weeklyComparison.improvement?.xpEarned || 0}
                  </div>
                  <div className="text-sm text-gray-500">نقاط XP</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {weeklyComparison.improvement?.studyTime >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                  )}
                  <div className="text-2xl font-bold">
                    {weeklyComparison.improvement?.studyTime >= 0 ? '+' : ''}
                    {formatTime(Math.abs(weeklyComparison.improvement?.studyTime || 0))}
                  </div>
                  <div className="text-sm text-gray-500">وقت الدراسة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">معدل التذكر</CardTitle>
              <CardDescription>نسبة الكلمات التي تتذكرها مع مرور الوقت</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'يوم', data: retentionData.retentionBuckets?.day1 },
                  { label: '3 أيام', data: retentionData.retentionBuckets?.day3 },
                  { label: 'أسبوع', data: retentionData.retentionBuckets?.day7 },
                  { label: 'أسبوعين', data: retentionData.retentionBuckets?.day14 },
                  { label: 'شهر', data: retentionData.retentionBuckets?.day30 }
                ].map((bucket, index) => {
                  const rate = bucket.data?.total > 0 
                    ? Math.round((bucket.data.remembered / bucket.data.total) * 100)
                    : 0
                  return (
                    <div key={index} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="text-2xl font-bold mb-1">{rate}%</div>
                      <div className="text-sm text-gray-500">{bucket.label}</div>
                      <Progress value={rate} className="h-2 mt-2" />
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium text-emerald-700 dark:text-emerald-300 mb-2">💡 نصائح لتحسين التذكر</h4>
                <ul className="text-sm text-emerald-600 dark:text-emerald-400 space-y-1">
                  <li>• راجع الكلمات الجديدة في اليوم التالي لتعزيز الذاكرة</li>
                  <li>• استخدم الكلمات في جمل لتسهيل تذكرها</li>
                  <li>• قسم التعلم إلى جلسات قصيرة ومتكررة</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
