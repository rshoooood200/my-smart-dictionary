'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Lightbulb, Target, TrendingUp, Calendar,
  Clock, Zap, AlertTriangle, CheckCircle, XCircle,
  Sparkles, Plus, ChevronRight, Play, Pause, RotateCcw,
  BarChart3, BookOpen, Gamepad2, Star, Award, Settings,
  RefreshCw, Filter, Eye, EyeOff, Trash2, Edit, Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useVocabStore } from '@/store/vocab-store'

interface Recommendation {
  id: string
  type: string
  priority: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  reason?: string
  reasonAr?: string
  score: number
  isShown: boolean
  isActed: boolean
  createdAt: string
}

interface StudyPlan {
  id: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  goalType: string
  goalValue: number
  currentValue: number
  isActive: boolean
  isCompleted: boolean
  preferredTime?: string
  duration: number
  frequency: number
  difficulty: string
  aiGenerated: boolean
  streakDays: number
  bestStreak: number
  endDate?: string
  createdAt: string
}

interface WeakAreaAnalysis {
  id: string
  categoryId?: string
  categoryName?: string
  weaknessType: string
  severity: string
  affectedWords: number
  totalWords: number
  averageScore: number
  rootCause?: string
  rootCauseAr?: string
  suggestions: string
  suggestedActions: string
  improvementScore: number
}

interface LearningPattern {
  peakHours: string
  peakDays: string
  averageSessionTime: number
  preferredSessionLen: number
  learningStyle: string
  preferredMode: string
  averageAccuracy: number
  averageRetention: number
  streakTendency: number
  engagementScore: number
  insights: string
}

interface SmartLearningIntelligenceProps {
  currentUserId?: string
}

export function SmartLearningIntelligence({ currentUserId }: SmartLearningIntelligenceProps) {
  const { words, categories, stats } = useVocabStore()
  
  const [activeTab, setActiveTab] = useState('recommendations')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [analysis, setAnalysis] = useState<WeakAreaAnalysis[]>([])
  const [pattern, setPattern] = useState<LearningPattern | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Dialogs
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false)
  const [newPlan, setNewPlan] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    goalType: 'daily',
    goalValue: 10,
    duration: 15,
    frequency: 1,
    preferredTime: 'morning'
  })

  // جلب البيانات
  useEffect(() => {
    fetchData()
  }, [currentUserId])

  const fetchData = async () => {
    if (!currentUserId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/smart-learning?userId=${currentUserId}&type=all`)
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
        setPlans(data.plans || [])
        setAnalysis(data.analysis || [])
        setPattern(data.pattern)
      }
    } catch (error) {
      console.error('Error fetching smart learning data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // توليد توصيات جديدة
  const generateRecommendations = async () => {
    if (!currentUserId) return
    setIsGenerating(true)
    try {
      const response = await fetch('/api/smart-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'generate_recommendations'
        })
      })
      if (response.ok) {
        toast.success('تم توليد توصيات جديدة')
        fetchData()
      }
    } catch (error) {
      toast.error('فشل في توليد التوصيات')
    } finally {
      setIsGenerating(false)
    }
  }

  // إجراء توصية
  const actOnRecommendation = async (id: string) => {
    try {
      await fetch('/api/smart-learning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'act_recommendation',
          id
        })
      })
      setRecommendations(prev => prev.filter(r => r.id !== id))
      toast.success('تم اتخاذ الإجراء')
    } catch (error) {
      toast.error('فشل في اتخاذ الإجراء')
    }
  }

  // رفض توصية
  const dismissRecommendation = async (id: string) => {
    try {
      await fetch('/api/smart-learning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'dismiss_recommendation',
          id
        })
      })
      setRecommendations(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      toast.error('فشل في رفض التوصية')
    }
  }

  // إنشاء خطة دراسية
  const createPlan = async () => {
    if (!newPlan.title) {
      toast.error('الرجاء إدخال عنوان الخطة')
      return
    }

    try {
      const response = await fetch('/api/smart-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'create_plan',
          data: newPlan
        })
      })
      if (response.ok) {
        const data = await response.json()
        setPlans(prev => [...prev, data.plan])
        setIsCreatePlanOpen(false)
        setNewPlan({
          title: '',
          titleAr: '',
          description: '',
          descriptionAr: '',
          goalType: 'daily',
          goalValue: 10,
          duration: 15,
          frequency: 1,
          preferredTime: 'morning'
        })
        toast.success('تم إنشاء الخطة بنجاح')
      }
    } catch (error) {
      toast.error('فشل في إنشاء الخطة')
    }
  }

  // تحديث تقدم الخطة
  const updatePlanProgress = async (id: string, increment: number = 1) => {
    try {
      await fetch('/api/smart-learning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'update_plan_progress',
          id,
          data: { increment }
        })
      })
      fetchData()
    } catch (error) {
      toast.error('فشل في تحديث التقدم')
    }
  }

  // الحصول على لون الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-amber-500'
      case 'low': return 'bg-emerald-500'
      default: return 'bg-gray-500'
    }
  }

  // الحصول على أيقونة النوع
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'word': return BookOpen
      case 'review': return Target
      case 'game': return Gamepad2
      case 'category': return BarChart3
      case 'story': return BookOpen
      default: return Lightbulb
    }
  }

  // عرض شريط التقدم للخطة
  const PlanProgress = ({ plan }: { plan: StudyPlan }) => {
    const progress = Math.min(100, (plan.currentValue / plan.goalValue) * 100)
    const isComplete = plan.currentValue >= plan.goalValue

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{plan.currentValue} / {plan.goalValue}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className={cn("h-2", isComplete && "bg-emerald-500")} />
        {isComplete && (
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            تم إكمال الهدف اليومي!
          </p>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-emerald-500" />
            الذكاء التعليمي
          </h2>
          <p className="text-gray-500">توصيات ذكية مخصصة لك</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateRecommendations}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            توليد توصيات
          </Button>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">
            <Lightbulb className="w-4 h-4 mr-2" />
            التوصيات
          </TabsTrigger>
          <TabsTrigger value="plans">
            <Target className="w-4 h-4 mr-2" />
            خططي
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <TrendingUp className="w-4 h-4 mr-2" />
            تحليلي
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <Brain className="w-4 h-4 mr-2" />
            أنماطي
          </TabsTrigger>
        </TabsList>

        {/* التوصيات */}
        <TabsContent value="recommendations" className="mt-6">
          {recommendations.length > 0 ? (
            <div className="grid gap-4">
              {recommendations.map((rec, index) => {
                const TypeIcon = getTypeIcon(rec.type)
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <div className={cn(
                        "h-1",
                        getPriorityColor(rec.priority)
                      )} />
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center",
                            rec.priority === 'urgent' ? "bg-rose-100 text-rose-600" :
                            rec.priority === 'high' ? "bg-orange-100 text-orange-600" :
                            rec.priority === 'medium' ? "bg-amber-100 text-amber-600" :
                            "bg-emerald-100 text-emerald-600"
                          )}>
                            <TypeIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-lg">
                                  {rec.titleAr || rec.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {rec.descriptionAr || rec.description}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {Math.round(rec.score * 100)}% ثقة
                              </Badge>
                            </div>
                            {rec.reasonAr && (
                              <p className="text-xs text-gray-400 mt-2">
                                💡 {rec.reasonAr}
                              </p>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={() => actOnRecommendation(rec.id)}>
                                <Play className="w-4 h-4 mr-1" />
                                ابدأ الآن
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissRecommendation(rec.id)}
                              >
                                لاحقاً
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد توصيات جديدة
              </h3>
              <p className="text-gray-500 mb-4">
                اضغط على "توليد توصيات" للحصول على توصيات مخصصة
              </p>
              <Button onClick={generateRecommendations} disabled={isGenerating}>
                <Sparkles className="w-4 h-4 mr-2" />
                توليد توصيات
              </Button>
            </div>
          )}
        </TabsContent>

        {/* خططي */}
        <TabsContent value="plans" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">خططي الدراسية</h3>
            <Button onClick={() => setIsCreatePlanOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              خطة جديدة
            </Button>
          </div>

          {plans.length > 0 ? (
            <div className="grid gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={cn(
                  !plan.isActive && "opacity-60"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold flex items-center gap-2">
                          {plan.titleAr || plan.title}
                          {plan.aiGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {plan.descriptionAr || plan.description}
                        </p>
                      </div>
                      {plan.streakDays > 0 && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Zap className="w-4 h-4" />
                          <span className="font-bold">{plan.streakDays}</span>
                        </div>
                      )}
                    </div>

                    <PlanProgress plan={plan} />

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePlanProgress(plan.id)}
                        disabled={plan.currentValue >= plan.goalValue}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        أكملت كلمة
                      </Button>
                      {plan.preferredTime && (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {plan.preferredTime === 'morning' ? 'صباحاً' :
                           plan.preferredTime === 'afternoon' ? 'ظهراً' :
                           plan.preferredTime === 'evening' ? 'مساءً' : 'ليلاً'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد خطط دراسية
              </h3>
              <p className="text-gray-500 mb-4">
                أنشئ خطة دراسية لتنظيم تعلمك
              </p>
              <Button onClick={() => setIsCreatePlanOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء خطة
              </Button>
            </div>
          )}
        </TabsContent>

        {/* تحليلي */}
        <TabsContent value="analysis" className="mt-6">
          {analysis.length > 0 ? (
            <div className="grid gap-4">
              {analysis.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        item.severity === 'severe' ? "bg-rose-100 text-rose-600" :
                        item.severity === 'moderate' ? "bg-amber-100 text-amber-600" :
                        "bg-emerald-100 text-emerald-600"
                      )}>
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold">
                            {item.categoryName || 'عام'}
                          </h4>
                          <Badge variant={
                            item.severity === 'severe' ? 'destructive' :
                            item.severity === 'moderate' ? 'secondary' : 'outline'
                          }>
                            {item.severity === 'severe' ? 'شديد' :
                             item.severity === 'moderate' ? 'متوسط' : 'خفيف'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.weaknessType === 'accuracy' ? 'دقة' :
                           item.weaknessType === 'retention' ? 'احتفاظ' :
                           item.weaknessType === 'pronunciation' ? 'نطق' : 'استخدام'}
                        </p>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>الكلمات المتأثرة</span>
                            <span>{item.affectedWords} / {item.totalWords}</span>
                          </div>
                          <Progress value={(item.affectedWords / Math.max(1, item.totalWords)) * 100} className="h-2" />
                        </div>

                        {item.rootCauseAr && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium">السبب: </span>
                              {item.rootCauseAr}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا يوجد تحليل بعد
              </h3>
              <p className="text-gray-500">
                استخدم التطبيق أكثر للحصول على تحليل دقيق
              </p>
            </div>
          )}
        </TabsContent>

        {/* أنماطي */}
        <TabsContent value="analysis" className="mt-6">
          {pattern ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* نمط الوقت */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">أنماط الوقت</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">متوسط وقت الجلسة</p>
                    <p className="text-2xl font-bold">{pattern.averageSessionTime} دقيقة</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">طول الجلسة المفضل</p>
                    <p className="text-lg font-medium">{pattern.preferredSessionLen} دقيقة</p>
                  </div>
                </CardContent>
              </Card>

              {/* نمط التعلم */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">نمط التعلم</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">الأسلوب</span>
                    <span className="font-medium">
                      {pattern.learningStyle === 'visual' ? 'بصري' :
                       pattern.learningStyle === 'auditory' ? 'سمعي' :
                       pattern.learningStyle === 'kinesthetic' ? 'حركي' : 'متوازن'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">الوضع المفضل</span>
                    <span className="font-medium">
                      {pattern.preferredMode === 'flashcard' ? 'بطاقات' :
                       pattern.preferredMode === 'quiz' ? 'اختبارات' :
                       pattern.preferredMode === 'game' ? 'ألعاب' : 'متنوع'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* الأداء */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">مقاييس الأداء</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>الدقة</span>
                      <span>{Math.round(pattern.averageAccuracy)}%</span>
                    </div>
                    <Progress value={pattern.averageAccuracy} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>الاحتفاظ</span>
                      <span>{Math.round(pattern.averageRetention)}%</span>
                    </div>
                    <Progress value={pattern.averageRetention} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>المشاركة</span>
                      <span>{Math.round(pattern.engagementScore)}%</span>
                    </div>
                    <Progress value={pattern.engagementScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* السلوك */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">السلوك التعليمي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">معدل التخطي</span>
                    <span className="font-medium">{Math.round(pattern.skipRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">استخدام التلميحات</span>
                    <span className="font-medium">{Math.round(pattern.hintUsageRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">إعادة المحاولة</span>
                    <span className="font-medium">{Math.round(pattern.retryRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ميول السلسلة</span>
                    <span className="font-medium">{Math.round(pattern.streakTendency * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لم يتم تحليل أنماطك بعد
              </h3>
              <p className="text-gray-500">
                استمر في التعلم للحصول على تحليل أنماطك
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* نافذة إنشاء خطة */}
      <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء خطة دراسية جديدة</DialogTitle>
            <DialogDescription>
              حدد أهدافك وسيساعدك الذكاء الاصطناعي على تحقيقها
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان الخطة</Label>
              <Input
                value={newPlan.title}
                onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: تعلم 10 كلمات يومياً"
              />
            </div>
            <div>
              <Label>نوع الهدف</Label>
              <Select
                value={newPlan.goalType}
                onValueChange={(v) => setNewPlan(prev => ({ ...prev, goalType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>عدد الكلمات: {newPlan.goalValue}</Label>
              <Slider
                value={[newPlan.goalValue]}
                onValueChange={([v]) => setNewPlan(prev => ({ ...prev, goalValue: v }))}
                min={5}
                max={50}
                step={5}
              />
            </div>
            <div>
              <Label>الوقت المفضل</Label>
              <Select
                value={newPlan.preferredTime}
                onValueChange={(v) => setNewPlan(prev => ({ ...prev, preferredTime: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">صباحاً</SelectItem>
                  <SelectItem value="afternoon">ظهراً</SelectItem>
                  <SelectItem value="evening">مساءً</SelectItem>
                  <SelectItem value="night">ليلاً</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>مدة الجلسة: {newPlan.duration} دقيقة</Label>
              <Slider
                value={[newPlan.duration]}
                onValueChange={([v]) => setNewPlan(prev => ({ ...prev, duration: v }))}
                min={5}
                max={60}
                step={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={createPlan}>
              إنشاء الخطة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
