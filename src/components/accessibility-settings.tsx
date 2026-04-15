'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Languages, Accessibility, Eye, Ear, Hand, Brain,
  Sun, Moon, Monitor, Type, Palette, Volume2, VolumeX,
  Contrast, Move, Keyboard, Mouse, Clock, Focus,
  Settings, RotateCcw, Check, Info, ChevronRight,
  Globe, BookOpen, MessageSquare
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AccessibilitySettings {
  fontSize: string
  fontFamily: string
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
  showCaptions: boolean
  visualNotifications: boolean
  soundAmplification: boolean
  largeTargets: boolean
  keyboardNavigation: boolean
  voiceControl: boolean
  simpleMode: boolean
  focusMode: boolean
  extendedTime: boolean
  colorBlindMode: string
  darkMode: string
}

interface UserLanguage {
  interfaceLang: string
  learningLang: string
  nativeLang: string
  autoDetect: boolean
  translations: boolean
}

interface AccessibilitySettingsProps {
  currentUserId?: string
}

const fontSizes = [
  { value: 'small', label: 'صغير', size: '14px' },
  { value: 'medium', label: 'متوسط', size: '16px' },
  { value: 'large', label: 'كبير', size: '18px' },
  { value: 'xlarge', label: 'كبير جداً', size: '20px' },
  { value: 'xxlarge', label: 'ضخم', size: '24px' }
]

const fontFamilies = [
  { value: 'default', label: 'الافتراضي' },
  { value: 'dyslexic', label: 'للقراءة السهلة' },
  { value: 'mono', label: 'ثابت العرض' }
]

const languages = [
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' }
]

const colorBlindModes = [
  { value: 'none', label: 'بدون', description: 'ألوان طبيعية' },
  { value: 'protanopia', label: 'بروتانوبيا', description: 'عمى الأحمر' },
  { value: 'deuteranopia', label: 'ديوترانوبيا', description: 'عمى الأخضر' },
  { value: 'tritanopia', label: 'تريتانوبيا', description: 'عمى الأزرق' }
]

export function AccessibilityLanguageSettings({ currentUserId }: AccessibilitySettingsProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    fontFamily: 'default',
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    showCaptions: true,
    visualNotifications: true,
    soundAmplification: false,
    largeTargets: false,
    keyboardNavigation: true,
    voiceControl: false,
    simpleMode: false,
    focusMode: false,
    extendedTime: false,
    colorBlindMode: 'none',
    darkMode: 'auto'
  })

  const [language, setLanguage] = useState<UserLanguage>({
    interfaceLang: 'ar',
    learningLang: 'en',
    nativeLang: 'ar',
    autoDetect: true,
    translations: true
  })

  const [activeTab, setActiveTab] = useState('vision')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // تحميل الإعدادات
  useEffect(() => {
    loadSettings()
  }, [currentUserId])

  const loadSettings = async () => {
    if (!currentUserId) return
    try {
      const response = await fetch(`/api/accessibility?userId=${currentUserId}&type=all`)
      if (response.ok) {
        const data = await response.json()
        if (data.accessibility) {
          setSettings(data.accessibility)
        }
        if (data.language) {
          setLanguage(data.language)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  // حفظ الإعدادات
  const saveSettings = useCallback(async () => {
    if (!currentUserId) return
    setIsSaving(true)
    try {
      // حفظ إعدادات إمكانية الوصول
      await fetch('/api/accessibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'accessibility',
          settings
        })
      })

      // حفظ إعدادات اللغة
      await fetch('/api/accessibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'language',
          settings: language
        })
      })

      toast.success('تم حفظ الإعدادات')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('فشل في حفظ الإعدادات')
    } finally {
      setIsSaving(false)
    }
  }, [currentUserId, settings, language])

  // تحديث إعداد
  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // تحديث إعداد اللغة
  const updateLanguage = <K extends keyof UserLanguage>(
    key: K,
    value: UserLanguage[K]
  ) => {
    setLanguage(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // إعادة تعيين الإعدادات
  const resetSettings = useCallback(async () => {
    const defaultSettings: AccessibilitySettings = {
      fontSize: 'medium',
      fontFamily: 'default',
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      showCaptions: true,
      visualNotifications: true,
      soundAmplification: false,
      largeTargets: false,
      keyboardNavigation: true,
      voiceControl: false,
      simpleMode: false,
      focusMode: false,
      extendedTime: false,
      colorBlindMode: 'none',
      darkMode: 'auto'
    }

    const defaultLanguage: UserLanguage = {
      interfaceLang: 'ar',
      learningLang: 'en',
      nativeLang: 'ar',
      autoDetect: true,
      translations: true
    }

    setSettings(defaultSettings)
    setLanguage(defaultLanguage)
    setHasChanges(true)
    toast.success('تم إعادة تعيين الإعدادات')
  }, [])

  // تطبيق حجم الخط
  const currentFontSize = fontSizes.find(f => f.value === settings.fontSize)?.size || '16px'

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Accessibility className="w-7 h-7 text-emerald-500" />
            إمكانية الوصول واللغة
          </h2>
          <p className="text-gray-500">خصص تجربتك حسب احتياجاتك</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              تغييرات غير محفوظة
            </Badge>
          )}
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="w-4 h-4 mr-2" />
            إعادة تعيين
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="vision">
            <Eye className="w-4 h-4 mr-2" />
            البصر
          </TabsTrigger>
          <TabsTrigger value="hearing">
            <Ear className="w-4 h-4 mr-2" />
            السمع
          </TabsTrigger>
          <TabsTrigger value="motor">
            <Hand className="w-4 h-4 mr-2" />
            الحركة
          </TabsTrigger>
          <TabsTrigger value="cognitive">
            <Brain className="w-4 h-4 mr-2" />
            الإدراك
          </TabsTrigger>
          <TabsTrigger value="language">
            <Languages className="w-4 h-4 mr-2" />
            اللغة
          </TabsTrigger>
        </TabsList>

        {/* إعدادات البصر */}
        <TabsContent value="vision" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-500" />
                إعدادات البصر
              </CardTitle>
              <CardDescription>
                خصص العرض حسب احتياجاتك البصرية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* حجم الخط */}
              <div className="space-y-3">
                <Label>حجم الخط</Label>
                <div className="grid grid-cols-5 gap-2">
                  {fontSizes.map(size => (
                    <button
                      key={size.value}
                      onClick={() => updateSetting('fontSize', size.value)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        settings.fontSize === size.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 hover:border-emerald-300"
                      )}
                    >
                      <p style={{ fontSize: size.size }} className="font-bold">
                        أ ب
                      </p>
                      <p className="text-xs mt-1 text-gray-500">{size.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* نوع الخط */}
              <div className="space-y-3">
                <Label>نوع الخط</Label>
                <Select
                  value={settings.fontFamily}
                  onValueChange={(v) => updateSetting('fontFamily', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map(font => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* الوضع الداكن */}
              <div className="space-y-3">
                <Label>الوضع الداكن</Label>
                <RadioGroup
                  value={settings.darkMode}
                  onValueChange={(v) => updateSetting('darkMode', v)}
                  className="grid grid-cols-3 gap-4"
                >
                  {[
                    { value: 'light', label: 'فاتح', icon: Sun },
                    { value: 'dark', label: 'داكن', icon: Moon },
                    { value: 'auto', label: 'تلقائي', icon: Monitor }
                  ].map(mode => (
                    <div
                      key={mode.value}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all",
                        settings.darkMode === mode.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 hover:border-emerald-300"
                      )}
                      onClick={() => updateSetting('darkMode', mode.value)}
                    >
                      <mode.icon className="w-6 h-6" />
                      <span className="text-sm">{mode.label}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* التباين العالي */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Contrast className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>التباين العالي</Label>
                    <p className="text-sm text-gray-500">زيادة التباين لسهولة القراءة</p>
                  </div>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={(v) => updateSetting('highContrast', v)}
                />
              </div>

              {/* تقليل الحركة */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Move className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>تقليل الحركة</Label>
                    <p className="text-sm text-gray-500">تقليل الرسوم المتحركة</p>
                  </div>
                </div>
                <Switch
                  checked={settings.reducedMotion}
                  onCheckedChange={(v) => updateSetting('reducedMotion', v)}
                />
              </div>

              {/* عمى الألوان */}
              <div className="space-y-3">
                <Label>وضع عمى الألوان</Label>
                <Select
                  value={settings.colorBlindMode}
                  onValueChange={(v) => updateSetting('colorBlindMode', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorBlindModes.map(mode => (
                      <SelectItem key={mode.value} value={mode.value}>
                        <div>
                          <p>{mode.label}</p>
                          <p className="text-xs text-gray-500">{mode.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* قارئ الشاشة */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>وضع قارئ الشاشة</Label>
                    <p className="text-sm text-gray-500">تحسين التوافق مع قارئات الشاشة</p>
                  </div>
                </div>
                <Switch
                  checked={settings.screenReader}
                  onCheckedChange={(v) => updateSetting('screenReader', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات السمع */}
        <TabsContent value="hearing" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ear className="w-5 h-5 text-emerald-500" />
                إعدادات السمع
              </CardTitle>
              <CardDescription>
                خصص الصوت والإشعارات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* عرض التسميات التوضيحية */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>عرض التسميات التوضيحية</Label>
                    <p className="text-sm text-gray-500">عرض النص مع الصوت</p>
                  </div>
                </div>
                <Switch
                  checked={settings.showCaptions}
                  onCheckedChange={(v) => updateSetting('showCaptions', v)}
                />
              </div>

              {/* الإشعارات المرئية */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>الإشعارات المرئية</Label>
                    <p className="text-sm text-gray-500">استبدال التنبيهات الصوتية بمرئية</p>
                  </div>
                </div>
                <Switch
                  checked={settings.visualNotifications}
                  onCheckedChange={(v) => updateSetting('visualNotifications', v)}
                />
              </div>

              {/* تضخيم الصوت */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>تضخيم الصوت</Label>
                    <p className="text-sm text-gray-500">زيادة مستوى الصوت</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundAmplification}
                  onCheckedChange={(v) => updateSetting('soundAmplification', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات الحركة */}
        <TabsContent value="motor" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hand className="w-5 h-5 text-emerald-500" />
                إعدادات الحركة
              </CardTitle>
              <CardDescription>
                خصص التحكم والتشغيل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* أهداف كبيرة */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Mouse className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>أهداف كبيرة</Label>
                    <p className="text-sm text-gray-500">زيادة حجم أزرار اللمس</p>
                  </div>
                </div>
                <Switch
                  checked={settings.largeTargets}
                  onCheckedChange={(v) => updateSetting('largeTargets', v)}
                />
              </div>

              {/* التنقل بلوحة المفاتيح */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>التنقل بلوحة المفاتيح</Label>
                    <p className="text-sm text-gray-500">تفعيل اختصارات لوحة المفاتيح</p>
                  </div>
                </div>
                <Switch
                  checked={settings.keyboardNavigation}
                  onCheckedChange={(v) => updateSetting('keyboardNavigation', v)}
                />
              </div>

              {/* التحكم الصوتي */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>التحكم الصوتي</Label>
                    <p className="text-sm text-gray-500">التحكم بالتطبيق بالأوامر الصوتية</p>
                  </div>
                </div>
                <Switch
                  checked={settings.voiceControl}
                  onCheckedChange={(v) => updateSetting('voiceControl', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات الإدراك */}
        <TabsContent value="cognitive" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-500" />
                إعدادات الإدراك
              </CardTitle>
              <CardDescription>
                خصص تجربة التعلم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* الوضع البسيط */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>الوضع البسيط</Label>
                    <p className="text-sm text-gray-500">تبسيط الواجهة وتقليل المشتتات</p>
                  </div>
                </div>
                <Switch
                  checked={settings.simpleMode}
                  onCheckedChange={(v) => updateSetting('simpleMode', v)}
                />
              </div>

              {/* وضع التركيز */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Focus className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>وضع التركيز</Label>
                    <p className="text-sm text-gray-500">تظليل المحتوى النشط فقط</p>
                  </div>
                </div>
                <Switch
                  checked={settings.focusMode}
                  onCheckedChange={(v) => updateSetting('focusMode', v)}
                />
              </div>

              {/* وقت إضافي */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>وقت إضافي</Label>
                    <p className="text-sm text-gray-500">زيادة الوقت المسموح في الاختبارات</p>
                  </div>
                </div>
                <Switch
                  checked={settings.extendedTime}
                  onCheckedChange={(v) => updateSetting('extendedTime', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات اللغة */}
        <TabsContent value="language" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-emerald-500" />
                إعدادات اللغة
              </CardTitle>
              <CardDescription>
                اختر لغات التطبيق والتعلم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* لغة الواجهة */}
              <div className="space-y-3">
                <Label>لغة الواجهة</Label>
                <Select
                  value={language.interfaceLang}
                  onValueChange={(v) => updateLanguage('interfaceLang', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* لغة التعلم */}
              <div className="space-y-3">
                <Label>اللغة التي تتعلمها</Label>
                <Select
                  value={language.learningLang}
                  onValueChange={(v) => updateLanguage('learningLang', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* اللغة الأم */}
              <div className="space-y-3">
                <Label>لغتك الأم</Label>
                <Select
                  value={language.nativeLang}
                  onValueChange={(v) => updateLanguage('nativeLang', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* الكشف التلقائي */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>الكشف التلقائي للغة</Label>
                    <p className="text-sm text-gray-500">تحديد لغة الكلمات تلقائياً</p>
                  </div>
                </div>
                <Switch
                  checked={language.autoDetect}
                  onCheckedChange={(v) => updateLanguage('autoDetect', v)}
                />
              </div>

              {/* الترجمات */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label>عرض الترجمات</Label>
                    <p className="text-sm text-gray-500">عرض ترجمة الكلمات بلغتك الأم</p>
                  </div>
                </div>
                <Switch
                  checked={language.translations}
                  onCheckedChange={(v) => updateLanguage('translations', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* معاينة اللغة */}
          <Card>
            <CardHeader>
              <CardTitle>معاينة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <p className="text-lg mb-2">مرحباً بك في قاموسي الذكي</p>
                  <p className="text-sm text-gray-500">
                    Welcome to My Smart Dictionary
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  هذه معاينة لكيفية ظهور الواجهة بلغة {languages.find(l => l.value === language.interfaceLang)?.label || 'العربية'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
