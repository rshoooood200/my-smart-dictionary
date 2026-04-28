'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Palette, Type, Bell, Clock, Keyboard,
  Moon, Sun, Monitor, Volume2, VolumeX,
  RefreshCw, Target, Brain, Save, RotateCcw,
  Zap, Sliders, Eye, Key, Sparkles, Check, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'

// الألوان المتاحة
const PRIMARY_COLORS = [
  { id: 'emerald', color: '#10B981', name: 'زمردي' },
  { id: 'violet', color: '#8B5CF6', name: 'بنفسجي' },
  { id: 'rose', color: '#F43F5E', name: 'وردي' },
  { id: 'amber', color: '#F59E0B', name: 'كهرماني' },
  { id: 'cyan', color: '#06B6D4', name: 'سماوي' },
  { id: 'orange', color: '#F97316', name: 'برتقالي' },
]

// اختصارات لوحة المفاتيح الافتراضية
const DEFAULT_SHORTCUTS: Record<string, string> = {
  addWord: 'Ctrl+N',
  startReview: 'Ctrl+R',
  toggleFavorite: 'Ctrl+F',
  searchWords: 'Ctrl+K',
  showAnswer: 'Space',
  markEasy: '1',
  markGood: '2',
  markHard: '3',
  markAgain: '4',
}

export function AdvancedSettings() {
  const currentUserId = useVocabStore(state => state.currentUserId)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [primaryColor, setPrimaryColor] = useState('emerald')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [dailyGoal, setDailyGoal] = useState(20)
  const [showHints, setShowHints] = useState(true)
  const [autoPlayAudio, setAutoPlayAudio] = useState(true)
  const [reviewReminder, setReviewReminder] = useState(true)
  const [reviewTime, setReviewTime] = useState('08:00')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('appearance')
  
  // AI API Key state
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null)
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false)
  const [isSavingApiKey, setIsSavingApiKey] = useState(false)

  // Check for existing API key on mount
  useEffect(() => {
    if (currentUserId) {
      checkApiKey()
    }
  }, [currentUserId])

  const checkApiKey = async () => {
    if (!currentUserId) return
    setIsLoadingApiKey(true)
    try {
      const res = await fetch(`/api/gemini-config?userId=${currentUserId}`)
      const data = await res.json()
      if (data.success) {
        setHasApiKey(data.hasKey)
        setApiKeyPreview(data.keyPreview)
      }
    } catch (error) {
      console.error('Error checking API key:', error)
    } finally {
      setIsLoadingApiKey(false)
    }
  }

  const saveApiKey = async () => {
    if (!currentUserId) {
      toast.error('يجب تسجيل الدخول أولاً')
      return
    }
    
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      toast.error('الرجاء إدخال مفتاح API')
      return
    }

    if (!trimmedKey.startsWith('AIza')) {
      toast.error('صيغة المفتاح غير صحيحة. مفاتيح Gemini تبدأ بـ "AIza"')
      return
    }

    setIsSavingApiKey(true)
    try {
      const res = await fetch('/api/gemini-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, apiKey: trimmedKey })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم حفظ المفتاح بنجاح! 🎉')
        setHasApiKey(true)
        setApiKeyPreview(data.keyPreview)
        setApiKey('')
      } else {
        toast.error(data.error || 'فشل في حفظ المفتاح')
      }
    } catch (error) {
      toast.error('فشل في حفظ المفتاح')
    } finally {
      setIsSavingApiKey(false)
    }
  }

  const deleteApiKey = async () => {
    if (!currentUserId) return
    try {
      await fetch(`/api/gemini-config?userId=${currentUserId}`, { method: 'DELETE' })
      setHasApiKey(false)
      setApiKeyPreview(null)
      toast.success('تم حذف المفتاح')
    } catch (error) {
      toast.error('فشل في حذف المفتاح')
    }
  }

  // تطبيق الإعدادات
  const applySettings = useCallback(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    }
    
    const fontSizes = { small: '14px', medium: '16px', large: '18px' }
    root.style.setProperty('--font-size-base', fontSizes[fontSize])
    
    const colorObj = PRIMARY_COLORS.find(c => c.id === primaryColor)
    if (colorObj) {
      root.style.setProperty('--color-primary', colorObj.color)
    }
  }, [theme, fontSize, primaryColor])

  // حفظ الإعدادات
  const saveSettings = useCallback(() => {
    const settings = {
      theme,
      primaryColor,
      fontSize,
      reducedMotion,
      dailyGoal,
      showHints,
      autoPlayAudio,
      reviewReminder,
      reviewTime,
      soundEnabled,
      shortcutsEnabled,
    }
    localStorage.setItem('app-settings', JSON.stringify(settings))
    setHasChanges(false)
    toast.success('تم حفظ الإعدادات بنجاح!')
    applySettings()
  }, [theme, primaryColor, fontSize, reducedMotion, dailyGoal, showHints, autoPlayAudio, reviewReminder, reviewTime, soundEnabled, shortcutsEnabled, applySettings])

  // إعادة تعيين الإعدادات
  const resetSettings = useCallback(() => {
    setTheme('system')
    setPrimaryColor('emerald')
    setFontSize('medium')
    setReducedMotion(false)
    setDailyGoal(20)
    setShowHints(true)
    setAutoPlayAudio(true)
    setReviewReminder(true)
    setReviewTime('08:00')
    setSoundEnabled(true)
    setShortcutsEnabled(true)
    setHasChanges(true)
    toast.info('تم إعادة تعيين الإعدادات إلى الافتراضية')
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-2 bg-gradient-to-l from-violet-500 to-purple-600" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Sliders className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">إعدادات متقدمة</h3>
                <p className="text-sm text-gray-500">خصص تجربتك التعليمية</p>
              </div>
            </div>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  تغييرات غير محفوظة
                </Badge>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-1" />
            المظهر
          </TabsTrigger>
          <TabsTrigger value="review">
            <Brain className="w-4 h-4 mr-1" />
            المراجعة
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-1" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="shortcuts">
            <Keyboard className="w-4 h-4 mr-1" />
            الاختصارات
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="w-4 h-4 mr-1" />
            الذكاء الاصطناعي
          </TabsTrigger>
        </TabsList>

        {/* تبويب المظهر */}
        <TabsContent value="appearance" className="space-y-4 mt-4">
          {/* الثيم */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="w-4 h-4" />
                الوضع اللوني
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'فاتح', icon: Sun },
                  { id: 'dark', label: 'داكن', icon: Moon },
                  { id: 'system', label: 'النظام', icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id as typeof theme); setHasChanges(true) }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                      theme === t.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                  >
                    <t.icon className={cn(
                      "w-6 h-6",
                      theme === t.id ? "text-violet-600" : "text-gray-500"
                    )} />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* اللون الرئيسي */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-4 h-4" />
                اللون الرئيسي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PRIMARY_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => { setPrimaryColor(color.id); setHasChanges(true) }}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                      primaryColor === color.id
                        ? "border-gray-800 dark:border-gray-200"
                        : "border-transparent hover:border-gray-300"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: color.color }}
                    />
                    <span className="text-xs">{color.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* حجم الخط */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="w-4 h-4" />
                حجم الخط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'small', label: 'صغير' },
                  { id: 'medium', label: 'متوسط' },
                  { id: 'large', label: 'كبير' },
                ].map((size) => (
                  <Button
                    key={size.id}
                    variant={fontSize === size.id ? 'default' : 'outline'}
                    onClick={() => { setFontSize(size.id as typeof fontSize); setHasChanges(true) }}
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* خيارات إضافية */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">خيارات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">تقليل الحركة</p>
                    <p className="text-xs text-gray-500">تقليل الرسوم المتحركة</p>
                  </div>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={(v) => { setReducedMotion(v); setHasChanges(true) }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المراجعة */}
        <TabsContent value="review" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                الهدف اليومي
              </CardTitle>
              <CardDescription>عدد الكلمات المراد مراجعتها يومياً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={[dailyGoal]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={([v]) => { setDailyGoal(v); setHasChanges(true) }}
                />
                <div className="flex justify-center">
                  <Badge className="bg-violet-100 text-violet-700 text-lg px-4 py-1">
                    {dailyGoal} كلمة
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">إعدادات المراجعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-sm">إظهار التلميحات</p>
                  <p className="text-xs text-gray-500">عرض معلومات مساعدة</p>
                </div>
                <Switch
                  checked={showHints}
                  onCheckedChange={(v) => { setShowHints(v); setHasChanges(true) }}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-sm">تشغيل الصوت تلقائياً</p>
                  <p className="text-xs text-gray-500">نطق الكلمة عند ظهورها</p>
                </div>
                <Switch
                  checked={autoPlayAudio}
                  onCheckedChange={(v) => { setAutoPlayAudio(v); setHasChanges(true) }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإشعارات */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" />
                الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">تذكير يومي</p>
                    <p className="text-xs text-gray-500">تذكير بمراجعة الكلمات</p>
                  </div>
                </div>
                <Switch
                  checked={reviewReminder}
                  onCheckedChange={(v) => { setReviewReminder(v); setHasChanges(true) }}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-sm">الأصوات</p>
                    <p className="text-xs text-gray-500">تشغيل أصوات التنبيهات</p>
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={(v) => { setSoundEnabled(v); setHasChanges(true) }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الاختصارات */}
        <TabsContent value="shortcuts" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  اختصارات لوحة المفاتيح
                </CardTitle>
                <Switch
                  checked={shortcutsEnabled}
                  onCheckedChange={(v) => { setShortcutsEnabled(v); setHasChanges(true) }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(DEFAULT_SHORTCUTS).map(([action, keys]) => (
                  <div
                    key={action}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm">
                      {action === 'addWord' ? 'إضافة كلمة' :
                       action === 'startReview' ? 'بدء المراجعة' :
                       action === 'toggleFavorite' ? 'تبديل المفضلة' :
                       action === 'searchWords' ? 'بحث' :
                       action === 'showAnswer' ? 'إظهار الإجابة' : action}
                    </span>
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                      {keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الذكاء الاصطناعي */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                مفتاح Gemini API
              </CardTitle>
              <CardDescription>
                أضف مفتاحك الخاص لاستخدام ميزات الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingApiKey ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : hasApiKey ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">مفتاح API مفعّل</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500">{apiKeyPreview}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={deleteApiKey}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    حذف المفتاح
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      ⚠️ لإستخدام ميزة التوليد الذكي، تحتاج إلى إضافة مفتاح Gemini API الخاص بك
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="AIza..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      المفتاح يبدأ بـ "AIza" - من Google AI Studio
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={saveApiKey}
                      disabled={!apiKey.trim() || isSavingApiKey}
                      className="flex-1"
                    >
                      {isSavingApiKey ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Key className="w-4 h-4 mr-2" />
                      )}
                      حفظ المفتاح
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 ml-1" />
                      الحصول على مفتاح
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                ميزات الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">التوليد الذكي للكلمات</p>
                    <p className="text-xs text-gray-500">ملء تلقائي للترجمة والتعريف والأمثلة</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">تصحيح التهجئة</p>
                    <p className="text-xs text-gray-500">تصحيح تلقائي للأخطاء الإملائية</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    <Check className="w-3 h-3 mr-1" />
                    تلقائي
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">توليد القصص</p>
                    <p className="text-xs text-gray-500">إنشاء قصص تعليمية مخصصة</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Key className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">كيفية الحصول على مفتاح Gemini API؟</h4>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>اضغط على "الحصول على مفتاح" أعلاه</li>
                    <li>سجل الدخول بحساب Google</li>
                    <li>اضغط "Create API Key"</li>
                    <li>انسخ المفتاح وألصقه هنا</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* أزرار الحفظ */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50"
        >
          <Card className="border-0 shadow-xl bg-violet-600 text-white">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <span className="text-sm">لديك تغييرات غير محفوظة</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSettings}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  إعادة تعيين
                </Button>
                <Button
                  size="sm"
                  onClick={saveSettings}
                  className="bg-white text-violet-600 hover:bg-white/90"
                >
                  <Save className="w-4 h-4 mr-1" />
                  حفظ
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
