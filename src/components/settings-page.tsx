'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Sparkles, Accessibility, Wifi, Database, ChevronRight,
  Brain, Key, LucideIcon, RefreshCw, Check, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { AdvancedSettings } from './advanced-settings'
import { AccessibilityLanguageSettings } from './accessibility-settings'
import { OfflineSettings } from './offline-settings'
import { PWAFeatures } from './pwa-features'
import { useVocabStore } from '@/store/vocab-store'
import { toast } from 'sonner'

interface SettingsSection {
  id: string
  label: string
  description: string
  icon: LucideIcon
  color: string
  gradient: string
}

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    label: 'الإعدادات العامة',
    description: 'المظهر، المراجعة، الإشعارات، الاختصارات',
    icon: Settings,
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-600'
  },
  {
    id: 'ai',
    label: 'الذكاء الاصطناعي',
    description: 'مفاتيح API وميزات AI',
    icon: Sparkles,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    id: 'accessibility',
    label: 'إمكانية الوصول',
    description: 'إعدادات البصر، السمع، الحركة، اللغة',
    icon: Accessibility,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'offline',
    label: 'العمل دون اتصال',
    description: 'المزامنة والتخزين المحلي',
    icon: Wifi,
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'pwa',
    label: 'تطبيق PWA',
    description: 'تثبيت التطبيق وميزات Progressive Web App',
    icon: Database,
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-600'
  },
]

interface SettingsPageProps {
  words: any[]
  stats: any
  currentUser: any
}

export function SettingsPage({ words, stats, currentUser }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const currentUserId = useVocabStore(state => state.currentUserId)

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return <AdvancedSettings />
      case 'ai':
        return <AIKeySettings />
      case 'accessibility':
        return <AccessibilityLanguageSettings currentUserId={currentUserId || undefined} />
      case 'offline':
        return <OfflineSettings userId={currentUserId || undefined} />
      case 'pwa':
        return <PWAFeatures />
      default:
        return null
    }
  }

  if (activeSection) {
    const section = settingsSections.find(s => s.id === activeSection)
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setActiveSection(null)} className="gap-2">
            <ChevronRight className="w-4 h-4 rotate-180" />
            رجوع
          </Button>
          <div className="flex items-center gap-3">
            {section && (
              <div className={cn("p-2 rounded-xl bg-gradient-to-br", section.gradient)}>
                <section.icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-lg">{section?.label}</h2>
              <p className="text-sm text-gray-500">{section?.description}</p>
            </div>
          </div>
        </div>
        <div className="mt-6">{renderSectionContent()}</div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-2 bg-gradient-to-l from-violet-500 via-purple-500 to-pink-500" />
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
              <p className="text-gray-500">خصص تجربتك التعليمية حسب احتياجاتك</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section, index) => (
          <motion.div key={section.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 overflow-hidden group" onClick={() => setActiveSection(section.id)}>
              <div className={cn("h-1.5 bg-gradient-to-l", section.gradient)} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-md", section.gradient)}>
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors">{section.label}</h3>
                      <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-violet-500 group-hover:translate-x-[-4px] transition-all" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            إحصائيات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">{stats?.totalWords || words.length}</p>
              <p className="text-sm text-gray-500">كلمة</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats?.learnedWords || 0}</p>
              <p className="text-sm text-gray-500">محفوظة</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats?.streak || 0}</p>
              <p className="text-sm text-gray-500">يوم متواصل</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-rose-600">{stats?.level || 1}</p>
              <p className="text-sm text-gray-500">المستوى</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AIKeySettings() {
  const currentUserId = useVocabStore(state => state.currentUserId)
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkApiKey()
  }, [currentUserId])

  const checkApiKey = async () => {
    if (!currentUserId) { setIsLoading(false); return }
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const saveApiKey = async () => {
    if (!currentUserId) { toast.error('يجب تسجيل الدخول أولاً'); return }
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) { toast.error('الرجاء إدخال مفتاح API'); return }
    if (!trimmedKey.startsWith('AIza')) { toast.error('صيغة المفتاح غير صحيحة'); return }
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/gemini-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, apiKey: trimmedKey })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حفظ المفتاح بنجاح!')
        setHasApiKey(true)
        setApiKeyPreview(data.keyPreview)
        setApiKey('')
      } else {
        toast.error(data.error || 'فشل في حفظ المفتاح')
      }
    } catch (error) {
      toast.error('فشل في حفظ المفتاح')
    } finally {
      setIsSaving(false)
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

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-2 bg-gradient-to-l from-purple-500 to-pink-600" />
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">الذكاء الاصطناعي</h2>
              <p className="text-gray-500">أضف مفتاح API الخاص بك لتفعيل الميزات الذكية</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-500" />
            مفتاح Gemini API
          </CardTitle>
          <CardDescription>المفتاح يستخدم لميزة التوليد الذكي للكلمات والترجمات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : hasApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">مفتاح API مفعّل</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500 font-mono">{apiKeyPreview}</p>
                </div>
              </div>
              <Button variant="outline" onClick={deleteApiKey} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                حذف المفتاح
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-400">⚠️ لاستخدام ميزة التوليد الذكي، تحتاج إلى إضافة مفتاح Gemini API الخاص بك</p>
              </div>
              <div className="space-y-2">
                <Input type="password" placeholder="AIza..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="font-mono" />
                <p className="text-xs text-gray-500">المفتاح يبدأ بـ "AIza" - احصل عليه من Google AI Studio</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveApiKey} disabled={!apiKey.trim() || isSaving} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                  حفظ المفتاح
                </Button>
                <Button variant="outline" onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}>
                  <ExternalLink className="w-4 h-4 ml-1" />
                  الحصول على مفتاح
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            ميزات الذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'التوليد الذكي للكلمات', desc: 'ملء تلقائي للترجمة والتعريف والأمثلة', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
              { name: 'تصحيح التهجئة', desc: 'تصحيح تلقائي للأخطاء الإملائية', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
              { name: 'توليد القصص', desc: 'إنشاء قصص تعليمية مخصصة', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
              { name: 'المساعد الذكي', desc: 'إجابة على ��لأسئلة والمساعدة في التعلم', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                  <p className="font-medium">{feature.name}</p>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
                <Badge className={feature.color}>متاح</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold mb-2">كيفية الحصول على مفتاح Gemini API؟</h4>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                <li>اضغط على "الحصول على مفتاح" أعلاه</li>
                <li>سجل الدخول بحساب Google</li>
                <li>اضغط "Create API Key"</li>
                <li>انسخ المفتاح وألصقه هنا</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
