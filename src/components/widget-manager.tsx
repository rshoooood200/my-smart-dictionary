'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  LayoutGrid, List, Plus, Settings, X, RefreshCw, Clock,
  BookOpen, Target, Flame, Zap, Trophy, Brain, Star,
  GripVertical, Eye, EyeOff, Trash2, RotateCcw, Sparkles,
  ChevronUp, ChevronDown, Palette, Monitor, Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useVocabStore, type Word } from '@/store/vocab-store'

interface Widget {
  id: string
  type: string
  position: string
  order: number
  size: string
  isEnabled: boolean
  settings: string
  refreshInterval: number
  lastRefreshed?: string
}

interface WidgetPreference {
  layoutMode: string
  columns: number
  showTitles: boolean
  showIcons: boolean
  animations: boolean
  transparency: number
  borderRadius: number
  spacing: number
}

// أنواع الودجات المتاحة
const widgetTypes = [
  {
    id: 'daily_word',
    name: 'كلمة اليوم',
    nameEn: 'Daily Word',
    icon: BookOpen,
    description: 'عرض كلمة جديدة كل يوم مع نطقها وترجمتها',
    defaultSize: 'medium',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'progress',
    name: 'التقدم',
    nameEn: 'Progress',
    icon: Target,
    description: 'عرض التقدم اليومي والأسبوعي',
    defaultSize: 'medium',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'streak',
    name: 'السلسلة',
    nameEn: 'Streak',
    icon: Flame,
    description: 'عرض سلسلة الأيام المتتالية',
    defaultSize: 'small',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'quick_review',
    name: 'مراجعة سريعة',
    nameEn: 'Quick Review',
    icon: Brain,
    description: 'ودجة للمراجعة السريعة مع أسئلة',
    defaultSize: 'large',
    color: 'from-purple-500 to-violet-600'
  },
  {
    id: 'random_word',
    name: 'كلمة عشوائية',
    nameEn: 'Random Word',
    icon: Sparkles,
    description: 'عرض كلمة عشوائية من القاموس',
    defaultSize: 'small',
    color: 'from-pink-500 to-rose-600'
  },
  {
    id: 'quiz',
    name: 'اختبار سريع',
    nameEn: 'Quick Quiz',
    icon: Trophy,
    description: 'اختبار سريع مع 5 أسئلة',
    defaultSize: 'large',
    color: 'from-amber-500 to-yellow-600'
  },
  {
    id: 'stats',
    name: 'الإحصائيات',
    nameEn: 'Statistics',
    icon: Star,
    description: 'إحصائيات سريعة عن التعلم',
    defaultSize: 'medium',
    color: 'from-indigo-500 to-blue-600'
  }
]

interface WidgetManagerProps {
  currentUserId?: string
}

export function WidgetManager({ currentUserId }: WidgetManagerProps) {
  const { words, stats } = useVocabStore()
  
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', type: 'daily_word', position: 'home', order: 0, size: 'medium', isEnabled: true, settings: '{}', refreshInterval: 60 },
    { id: '2', type: 'progress', position: 'home', order: 1, size: 'medium', isEnabled: true, settings: '{}', refreshInterval: 60 },
    { id: '3', type: 'streak', position: 'home', order: 2, size: 'small', isEnabled: true, settings: '{}', refreshInterval: 60 },
    { id: '4', type: 'quick_review', position: 'home', order: 3, size: 'large', isEnabled: false, settings: '{}', refreshInterval: 30 }
  ])
  
  const [preferences, setPreferences] = useState<WidgetPreference>({
    layoutMode: 'grid',
    columns: 2,
    showTitles: true,
    showIcons: true,
    animations: true,
    transparency: 100,
    borderRadius: 12,
    spacing: 16
  })
  
  const [activeTab, setActiveTab] = useState('widgets')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null)
  const [quizState, setQuizState] = useState<{
    isActive: boolean
    currentQuestion: number
    score: number
    questions: { word: Word; options: string[]; correct: string }[]
  }>({
    isActive: false,
    currentQuestion: 0,
    score: 0,
    questions: []
  })

  // الحصول على كلمة عشوائية
  const randomWord = useMemo(() => {
    if (words.length === 0) return null
    return words[Math.floor(Math.random() * words.length)]
  }, [words])

  // توليد أسئلة الاختبار
  const generateQuizQuestions = useCallback(() => {
    if (words.length < 4) return []
    
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 5)
    
    return shuffled.map(word => {
      const wrongOptions = words
        .filter(w => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.translation)
      
      const options = [...wrongOptions, word.translation].sort(() => Math.random() - 0.5)
      
      return {
        word,
        options,
        correct: word.translation
      }
    })
  }, [words])

  const handleAddWidget = useCallback(async (type: string) => {
    const widgetType = widgetTypes.find(t => t.id === type)
    if (!widgetType) return

    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      position: 'home',
      order: widgets.length,
      size: widgetType.defaultSize,
      isEnabled: true,
      settings: '{}',
      refreshInterval: 60
    }

    setWidgets(prev => [...prev, newWidget])
    setIsAddDialogOpen(false)
    toast.success(`تمت إضافة ودجة "${widgetType.name}"`)
  }, [widgets.length])

  const handleRemoveWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
    toast.success('تم حذف الودجة')
  }, [])

  const handleToggleWidget = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, isEnabled: !w.isEnabled } : w
    ))
  }, [])

  const handleReorderWidgets = useCallback((newOrder: Widget[]) => {
    setWidgets(newOrder.map((w, i) => ({ ...w, order: i })))
  }, [])

  const handleResetWidgets = useCallback(() => {
    setWidgets([
      { id: '1', type: 'daily_word', position: 'home', order: 0, size: 'medium', isEnabled: true, settings: '{}', refreshInterval: 60 },
      { id: '2', type: 'progress', position: 'home', order: 1, size: 'medium', isEnabled: true, settings: '{}', refreshInterval: 60 },
      { id: '3', type: 'streak', position: 'home', order: 2, size: 'small', isEnabled: true, settings: '{}', refreshInterval: 60 }
    ])
    toast.success('تم إعادة تعيين الودجات')
  }, [])

  // مكون الودجة
  const WidgetCard = ({ widget }: { widget: Widget }) => {
    const widgetType = widgetTypes.find(t => t.id === widget.type)
    if (!widgetType) return null

    const Icon = widgetType.icon
    const isEnabled = widget.isEnabled

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isEnabled ? 1 : 0.5, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "relative rounded-xl overflow-hidden transition-all duration-300",
          widget.size === 'small' && "col-span-1",
          widget.size === 'medium' && "col-span-1 sm:col-span-1",
          widget.size === 'large' && "col-span-1 sm:col-span-2"
        )}
        style={{
          borderRadius: preferences.borderRadius,
          opacity: preferences.transparency / 100
        }}
      >
        <div className={cn(
          "bg-gradient-to-br p-4 text-white h-full min-h-[120px]",
          widgetType.color
        )}>
          {/* العنوان */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {preferences.showIcons && <Icon className="w-5 h-5" />}
              {preferences.showTitles && (
                <h3 className="font-bold">{widgetType.name}</h3>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded hover:bg-white/20 transition-colors"
                onClick={() => handleToggleWidget(widget.id)}
              >
                {isEnabled ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                className="p-1 rounded hover:bg-white/20 transition-colors"
                onClick={() => handleRemoveWidget(widget.id)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* المحتوى */}
          <div className="text-center">
            {widget.type === 'daily_word' && randomWord && (
              <div>
                <p className="text-2xl font-bold mb-1">{randomWord.word}</p>
                <p className="text-sm opacity-90">{randomWord.translation}</p>
              </div>
            )}

            {widget.type === 'progress' && (
              <div>
                <p className="text-3xl font-bold">{stats?.wordsLearned || 0}</p>
                <p className="text-sm opacity-90">كلمة تم تعلمها</p>
                <Progress 
                  value={Math.min(100, ((stats?.wordsLearned || 0) / Math.max(1, stats?.totalWords || 1)) * 100)} 
                  className="mt-2 h-2 bg-white/30"
                />
              </div>
            )}

            {widget.type === 'streak' && (
              <div>
                <div className="flex items-center justify-center gap-2">
                  <Flame className="w-8 h-8" />
                  <span className="text-4xl font-bold">{stats?.currentStreak || 0}</span>
                </div>
                <p className="text-sm opacity-90">يوم متتالي</p>
              </div>
            )}

            {widget.type === 'random_word' && randomWord && (
              <div>
                <p className="text-xl font-bold">{randomWord.word}</p>
                <p className="text-sm opacity-75">{randomWord.translation}</p>
              </div>
            )}

            {widget.type === 'quick_review' && (
              <div>
                <p className="text-lg mb-2">هل تريد مراجعة سريعة؟</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const questions = generateQuizQuestions()
                    if (questions.length > 0) {
                      setQuizState({
                        isActive: true,
                        currentQuestion: 0,
                        score: 0,
                        questions
                      })
                    }
                  }}
                >
                  ابدأ المراجعة
                </Button>
              </div>
            )}

            {widget.type === 'quiz' && (
              <div>
                <p className="text-lg mb-2">اختبار سريع</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const questions = generateQuizQuestions()
                    if (questions.length > 0) {
                      setQuizState({
                        isActive: true,
                        currentQuestion: 0,
                        score: 0,
                        questions
                      })
                    }
                  }}
                >
                  ابدأ الاختبار
                </Button>
              </div>
            )}

            {widget.type === 'stats' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-2xl font-bold">{words.length}</p>
                  <p className="text-xs opacity-75">كلمة</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.xp || 0}</p>
                  <p className="text-xs opacity-75">XP</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // واجهة الاختبار
  const QuizInterface = () => {
    const currentQ = quizState.questions[quizState.currentQuestion]
    if (!currentQ) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>اختبار سريع</CardTitle>
              <Badge>
                {quizState.currentQuestion + 1} / {quizState.questions.length}
              </Badge>
            </div>
            <Progress 
              value={(quizState.currentQuestion / quizState.questions.length) * 100} 
              className="h-2"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold mb-2">{currentQ.word.word}</p>
              <p className="text-gray-500">ما هي الترجمة الصحيحة؟</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {currentQ.options.map((option, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start h-12"
                  onClick={() => {
                    const isCorrect = option === currentQ.correct
                    if (isCorrect) {
                      toast.success('إجابة صحيحة! 🎉')
                      setQuizState(prev => ({
                        ...prev,
                        score: prev.score + 10
                      }))
                    } else {
                      toast.error(`إجابة خاطئة! الصحيح: ${currentQ.correct}`)
                    }

                    setTimeout(() => {
                      if (quizState.currentQuestion < quizState.questions.length - 1) {
                        setQuizState(prev => ({
                          ...prev,
                          currentQuestion: prev.currentQuestion + 1
                        }))
                      } else {
                        toast.success(`انتهى الاختبار! النتيجة: ${quizState.score + (isCorrect ? 10 : 0)} نقطة`)
                        setQuizState({
                          isActive: false,
                          currentQuestion: 0,
                          score: 0,
                          questions: []
                        })
                      }
                    }, 1000)
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setQuizState({
                isActive: false,
                currentQuestion: 0,
                score: 0,
                questions: []
              })}
            >
              إلغاء
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-7 h-7 text-emerald-500" />
            إدارة الودجات
          </h2>
          <p className="text-gray-500">خصص ودجات الصفحة الرئيسية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            إعدادات
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة ودجة
          </Button>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="widgets">الودجات</TabsTrigger>
          <TabsTrigger value="preview">معاينة</TabsTrigger>
        </TabsList>

        <TabsContent value="widgets" className="mt-6">
          {/* قائمة الودجات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>الودجات النشطة</span>
                <Button variant="ghost" size="sm" onClick={handleResetWidgets}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  إعادة تعيين
                </Button>
              </CardTitle>
              <CardDescription>
                اسحب لإعادة الترتيب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Reorder.Group
                axis="y"
                values={widgets}
                onReorder={handleReorderWidgets}
                className="space-y-2"
              >
                {widgets.map((widget) => {
                  const widgetType = widgetTypes.find(t => t.id === widget.type)
                  if (!widgetType) return null
                  const Icon = widgetType.icon

                  return (
                    <Reorder.Item
                      key={widget.id}
                      value={widget}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-gray-800 transition-colors",
                        !widget.isEnabled && "opacity-50"
                      )}>
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br text-white",
                          widgetType.color
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{widgetType.name}</h4>
                          <p className="text-xs text-gray-500">
                            {widget.size === 'small' ? 'صغير' : widget.size === 'medium' ? 'متوسط' : 'كبير'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={widget.isEnabled}
                            onCheckedChange={() => handleToggleWidget(widget.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveWidget(widget.id)}
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                    </Reorder.Item>
                  )
                })}
              </Reorder.Group>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          {/* معاينة الودجات */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 min-h-[400px]">
            <div
              className={cn(
                "grid gap-4",
                preferences.columns === 1 && "grid-cols-1",
                preferences.columns === 2 && "grid-cols-1 sm:grid-cols-2",
                preferences.columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
              style={{ gap: preferences.spacing }}
            >
              <AnimatePresence>
                {widgets
                  .filter(w => w.isEnabled)
                  .sort((a, b) => a.order - b.order)
                  .map(widget => (
                    <WidgetCard key={widget.id} widget={widget} />
                  ))}
              </AnimatePresence>
            </div>

            {widgets.filter(w => w.isEnabled).length === 0 && (
              <div className="text-center py-12">
                <LayoutGrid className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  لا توجد ودجات مفعّلة
                </h3>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  أضف ودجة
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* نافذة إضافة ودجة */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة ودجة جديدة</DialogTitle>
            <DialogDescription>
              اختر نوع الودجة التي تريد إضافتها
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {widgetTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => handleAddWidget(type.id)}
                  className={cn(
                    "p-4 rounded-xl border text-right hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all",
                    selectedWidgetType === type.id && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white mb-2",
                    type.color
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm">{type.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة الإعدادات */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعدادات الودجات</DialogTitle>
            <DialogDescription>
              تخصيص مظهر وسلوك الودجات
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>وضع العرض</Label>
              <Select
                value={preferences.layoutMode}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, layoutMode: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">شبكة</SelectItem>
                  <SelectItem value="list">قائمة</SelectItem>
                  <SelectItem value="compact">مضغوط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>عدد الأعمدة: {preferences.columns}</Label>
              <Slider
                value={[preferences.columns]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, columns: value }))}
                min={1}
                max={3}
                step={1}
              />
            </div>

            <div>
              <Label>الشفافية: {preferences.transparency}%</Label>
              <Slider
                value={[preferences.transparency]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, transparency: value }))}
                min={20}
                max={100}
                step={5}
              />
            </div>

            <div>
              <Label>حجم الحواف: {preferences.borderRadius}px</Label>
              <Slider
                value={[preferences.borderRadius]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, borderRadius: value }))}
                min={0}
                max={24}
                step={2}
              />
            </div>

            <div>
              <Label>المسافة بين الودجات: {preferences.spacing}px</Label>
              <Slider
                value={[preferences.spacing]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, spacing: value }))}
                min={8}
                max={32}
                step={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>إظهار العناوين</Label>
              <Switch
                checked={preferences.showTitles}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, showTitles: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>إظهار الأيقونات</Label>
              <Switch
                checked={preferences.showIcons}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, showIcons: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>تفعيل الحركات</Label>
              <Switch
                checked={preferences.animations}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, animations: checked }))}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* واجهة الاختبار */}
      {quizState.isActive && <QuizInterface />}
    </div>
  )
}
