'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette, Check, Heart, Download, Star, Plus, Edit, Trash2,
  Sun, Moon, Monitor, Type, Square, Layers, Sparkles, Lock,
  Eye, Share2, Copy, RotateCcw, Save, X, ChevronRight, Search
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Theme {
  id: string
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  isPublic: boolean
  isOfficial: boolean
  isPremium: boolean
  price: number
  currency: string
  downloads: number
  likes: number
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  textSecondary: string
  fontFamily: string
  fontSizeBase: string
  borderRadius: string
  shadowIntensity: string
  backgroundType: string
  backgroundGradient?: string
  animationSpeed: string
  darkMode: string
  darkPrimaryColor: string
  darkBackgroundColor: string
  darkSurfaceColor: string
  darkTextColor: string
  tags: string
  previewImage?: string
  userThemes?: { id: string; isActive: boolean; customizations: string }[]
}

// السمات الافتراضية
const defaultThemes: Theme[] = [
  {
    id: 'default-light',
    name: 'Light Default',
    nameAr: 'السمة الفاتحة',
    description: 'Clean and bright theme',
    descriptionAr: 'سمة نظيفة ومشرقة',
    isPublic: true,
    isOfficial: true,
    isPremium: false,
    price: 0,
    currency: 'coins',
    downloads: 10000,
    likes: 4500,
    primaryColor: '#10B981',
    secondaryColor: '#14B8A6',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F3F4F6',
    textColor: '#1F2937',
    textSecondary: '#6B7280',
    fontFamily: 'Inter',
    fontSizeBase: '16',
    borderRadius: '8',
    shadowIntensity: 'medium',
    backgroundType: 'solid',
    animationSpeed: 'normal',
    darkMode: 'light',
    darkPrimaryColor: '#10B981',
    darkBackgroundColor: '#111827',
    darkSurfaceColor: '#1F2937',
    darkTextColor: '#F9FAFB',
    tags: '[]'
  },
  {
    id: 'default-dark',
    name: 'Dark Mode',
    nameAr: 'الوضع الداكن',
    description: 'Easy on the eyes dark theme',
    descriptionAr: 'سمة داكنة مريحة للعين',
    isPublic: true,
    isOfficial: true,
    isPremium: false,
    price: 0,
    currency: 'coins',
    downloads: 8500,
    likes: 4200,
    primaryColor: '#10B981',
    secondaryColor: '#14B8A6',
    accentColor: '#F59E0B',
    backgroundColor: '#111827',
    surfaceColor: '#1F2937',
    textColor: '#F9FAFB',
    textSecondary: '#9CA3AF',
    fontFamily: 'Inter',
    fontSizeBase: '16',
    borderRadius: '8',
    shadowIntensity: 'medium',
    backgroundType: 'solid',
    animationSpeed: 'normal',
    darkMode: 'dark',
    darkPrimaryColor: '#10B981',
    darkBackgroundColor: '#111827',
    darkSurfaceColor: '#1F2937',
    darkTextColor: '#F9FAFB',
    tags: '[]'
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    nameAr: 'نسيم المحيط',
    description: 'Calm blue ocean inspired theme',
    descriptionAr: 'سمة مستوحاة من المحيط الأزرق الهادئ',
    isPublic: true,
    isOfficial: true,
    isPremium: true,
    price: 200,
    currency: 'coins',
    downloads: 3200,
    likes: 1800,
    primaryColor: '#0EA5E9',
    secondaryColor: '#06B6D4',
    accentColor: '#F472B6',
    backgroundColor: '#F0F9FF',
    surfaceColor: '#E0F2FE',
    textColor: '#0C4A6E',
    textSecondary: '#0369A1',
    fontFamily: 'Inter',
    fontSizeBase: '16',
    borderRadius: '12',
    shadowIntensity: 'light',
    backgroundType: 'gradient',
    backgroundGradient: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
    animationSpeed: 'normal',
    darkMode: 'auto',
    darkPrimaryColor: '#38BDF8',
    darkBackgroundColor: '#0C1929',
    darkSurfaceColor: '#0F2942',
    darkTextColor: '#E0F2FE',
    tags: '["ocean","blue","calm"]'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    nameAr: 'توهج الغروب',
    description: 'Warm sunset colors theme',
    descriptionAr: 'سمة بألوان الغروب الدافئة',
    isPublic: true,
    isOfficial: true,
    isPremium: true,
    price: 300,
    currency: 'coins',
    downloads: 2800,
    likes: 1650,
    primaryColor: '#F97316',
    secondaryColor: '#FB923C',
    accentColor: '#FBBF24',
    backgroundColor: '#FFF7ED',
    surfaceColor: '#FFEDD5',
    textColor: '#7C2D12',
    textSecondary: '#C2410C',
    fontFamily: 'Inter',
    fontSizeBase: '16',
    borderRadius: '16',
    shadowIntensity: 'medium',
    backgroundType: 'gradient',
    backgroundGradient: 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 50%, #FDBA74 100%)',
    animationSpeed: 'normal',
    darkMode: 'auto',
    darkPrimaryColor: '#FB923C',
    darkBackgroundColor: '#1C1410',
    darkSurfaceColor: '#292018',
    darkTextColor: '#FFEDD5',
    tags: '["sunset","orange","warm"]'
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    nameAr: 'أخضر الغابة',
    description: 'Nature inspired green theme',
    descriptionAr: 'سمة خضراء مستوحاة من الطبيعة',
    isPublic: true,
    isOfficial: true,
    isPremium: false,
    price: 0,
    currency: 'coins',
    downloads: 4100,
    likes: 2100,
    primaryColor: '#22C55E',
    secondaryColor: '#16A34A',
    accentColor: '#84CC16',
    backgroundColor: '#F0FDF4',
    surfaceColor: '#DCFCE7',
    textColor: '#14532D',
    textSecondary: '#166534',
    fontFamily: 'Inter',
    fontSizeBase: '16',
    borderRadius: '10',
    shadowIntensity: 'light',
    backgroundType: 'solid',
    animationSpeed: 'normal',
    darkMode: 'auto',
    darkPrimaryColor: '#4ADE80',
    darkBackgroundColor: '#052E16',
    darkSurfaceColor: '#14532D',
    darkTextColor: '#DCFCE7',
    tags: '["nature","green","forest"]'
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    nameAr: 'البنفسجي الملكي',
    description: 'Elegant purple theme for royalty',
    descriptionAr: 'سمة بنفسجية أنيلة للملوك',
    isPublic: true,
    isOfficial: true,
    isPremium: true,
    price: 500,
    currency: 'gems',
    downloads: 1500,
    likes: 950,
    primaryColor: '#A855F7',
    secondaryColor: '#C084FC',
    accentColor: '#E879F9',
    backgroundColor: '#FAF5FF',
    surfaceColor: '#F3E8FF',
    textColor: '#581C87',
    textSecondary: '#7E22CE',
    fontFamily: 'Inter',
    fontSizeBase: '16',
    borderRadius: '20',
    shadowIntensity: 'strong',
    backgroundType: 'gradient',
    backgroundGradient: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%, #D8B4FE 100%)',
    animationSpeed: 'normal',
    darkMode: 'auto',
    darkPrimaryColor: '#C084FC',
    darkBackgroundColor: '#1E1033',
    darkSurfaceColor: '#2E1065',
    darkTextColor: '#F3E8FF',
    tags: '["purple","royal","elegant"]'
  }
]

interface ThemeStoreProps {
  currentUserId?: string
}

export function ThemeStore({ currentUserId }: ThemeStoreProps) {
  const [themes, setThemes] = useState<Theme[]>(defaultThemes)
  const [myThemes, setMyThemes] = useState<Theme[]>([])
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null)
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null)
  const [newTheme, setNewTheme] = useState<Partial<Theme>>({
    name: '',
    nameAr: '',
    primaryColor: '#10B981',
    secondaryColor: '#14B8A6',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F3F4F6',
    textColor: '#1F2937',
    textSecondary: '#6B7280',
    borderRadius: '8',
    fontFamily: 'Inter',
    fontSizeBase: '16',
    animationSpeed: 'normal',
    darkMode: 'auto'
  })

  const filteredThemes = themes.filter(theme => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      theme.name.toLowerCase().includes(query) ||
      theme.nameAr?.includes(query) ||
      theme.description?.toLowerCase().includes(query) ||
      theme.descriptionAr?.includes(query)
    )
  })

  const handlePurchaseTheme = useCallback(async (theme: Theme) => {
    try {
      const response = await fetch(`/api/themes/${theme.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          userId: currentUserId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'فشل في شراء السمة')
        return
      }

      toast.success(`تم الحصول على سمة "${theme.nameAr || theme.name}" بنجاح!`)
      // تحديث القائمة
      setMyThemes(prev => [...prev, theme])
    } catch {
      toast.error('حدث خطأ أثناء الشراء')
    }
  }, [currentUserId])

  const handleActivateTheme = useCallback(async (theme: Theme) => {
    try {
      const response = await fetch(`/api/themes/${theme.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          userId: currentUserId
        })
      })

      if (!response.ok) {
        toast.error('فشل في تفعيل السمة')
        return
      }

      setActiveTheme(theme)
      toast.success(`تم تفعيل سمة "${theme.nameAr || theme.name}"`)
    } catch {
      toast.error('حدث خطأ أثناء التفعيل')
    }
  }, [currentUserId])

  const handleCreateTheme = useCallback(async () => {
    if (!newTheme.name) {
      toast.error('الرجاء إدخال اسم السمة')
      return
    }

    try {
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTheme,
          userId: currentUserId
        })
      })

      if (!response.ok) {
        toast.error('فشل في إنشاء السمة')
        return
      }

      const { theme } = await response.json()
      setMyThemes(prev => [...prev, theme])
      setIsCreateDialogOpen(false)
      setNewTheme({
        name: '',
        nameAr: '',
        primaryColor: '#10B981',
        secondaryColor: '#14B8A6',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        surfaceColor: '#F3F4F6',
        textColor: '#1F2937',
        textSecondary: '#6B7280'
      })
      toast.success('تم إنشاء السمة بنجاح!')
    } catch {
      toast.error('حدث خطأ أثناء الإنشاء')
    }
  }, [newTheme, currentUserId])

  const ThemeCard = ({ theme, isOwned = false }: { theme: Theme; isOwned?: boolean }) => {
    const isCurrentlyActive = activeTheme?.id === theme.id
    const ownsTheme = theme.userThemes && theme.userThemes.length > 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="relative"
      >
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          {/* معاينة السمة */}
          <div
            className="h-32 relative"
            style={{
              background: theme.backgroundType === 'gradient' 
                ? theme.backgroundGradient 
                : theme.backgroundColor
            }}
          >
            {/* أزرار الإجراءات */}
            <div className="absolute top-2 right-2 flex gap-1">
              {theme.isOfficial && (
                <Badge className="bg-amber-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  رسمية
                </Badge>
              )}
              {theme.isPremium && (
                <Badge className="bg-purple-500 text-white border-0">
                  <Lock className="w-3 h-3 mr-1" />
                  مميزة
                </Badge>
              )}
            </div>

            {/* زر الإعجاب */}
            <button
              className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
              onClick={() => toast.success('تمت الإضافة للمفضلة')}
            >
              <Heart className="w-4 h-4 text-rose-500" />
            </button>

            {/* معاينة مصغرة */}
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end gap-2">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                style={{ backgroundColor: theme.surfaceColor }}
              >
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </div>
              <div className="flex-1">
                <div
                  className="h-2 rounded mb-1"
                  style={{ backgroundColor: theme.primaryColor, width: '60%' }}
                />
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: theme.secondaryColor, width: '40%' }}
                />
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {theme.nameAr || theme.name}
                </h3>
                <p className="text-xs text-gray-500">{theme.descriptionAr || theme.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-1">
                {[theme.primaryColor, theme.secondaryColor, theme.accentColor].map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-white"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Download className="w-3 h-3" />
                {theme.downloads.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Heart className="w-3 h-3" />
                {theme.likes.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setPreviewTheme(theme)
                  setIsPreviewDialogOpen(true)
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                معاينة
              </Button>
              {isOwned || ownsTheme ? (
                <Button
                  size="sm"
                  className="flex-1"
                  variant={isCurrentlyActive ? 'default' : 'outline'}
                  onClick={() => handleActivateTheme(theme)}
                >
                  {isCurrentlyActive ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      مفعّلة
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      تفعيل
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePurchaseTheme(theme)}
                >
                  {theme.isPremium ? (
                    <>
                      {theme.currency === 'gems' ? '💎' : '🪙'}
                      {theme.price}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      مجاني
                    </>
                  )}
                </Button>
              )}
            </div>
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
            <Palette className="w-7 h-7 text-emerald-500" />
            متجر السمات
          </h2>
          <p className="text-gray-500">خصص مظهر تطبيقك بسمات جميلة</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          إنشاء سمة
        </Button>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">استكشف</TabsTrigger>
          <TabsTrigger value="mine">سماتي</TabsTrigger>
          <TabsTrigger value="create">المخصص</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          {/* البحث */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ابحث عن سمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* السمات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map(theme => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          {myThemes.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا تملك أي سمات بعد
              </h3>
              <p className="text-gray-500 mb-4">
                استكشف المتجر واحصل على سمات مميزة
              </p>
              <Button onClick={() => setActiveTab('browse')}>
                استكشف السمات
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myThemes.map(theme => (
                <ThemeCard key={theme.id} theme={theme} isOwned />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>إنشاء سمة مخصصة</CardTitle>
              <CardDescription>صمم سمتك الخاصة بألوانك المفضلة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* معاينة حية */}
              <div
                className="rounded-xl p-6 border"
                style={{
                  backgroundColor: newTheme.backgroundColor,
                  borderColor: newTheme.surfaceColor
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: newTheme.primaryColor }}
                  >
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4
                      className="font-bold text-lg"
                      style={{ color: newTheme.textColor }}
                    >
                      {newTheme.nameAr || newTheme.name || 'اسم السمة'}
                    </h4>
                    <p style={{ color: newTheme.textSecondary }}>
                      معاينة حية للسمة
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: newTheme.primaryColor }}
                  >
                    زر رئيسي
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: newTheme.surfaceColor,
                      borderColor: newTheme.primaryColor,
                      color: newTheme.primaryColor
                    }}
                  >
                    زر ثانوي
                  </button>
                </div>
              </div>

              {/* حقول الإدخال */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم السمة (إنجليزي)</Label>
                  <Input
                    value={newTheme.name || ''}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Theme Name"
                  />
                </div>
                <div>
                  <Label>اسم السمة (عربي)</Label>
                  <Input
                    value={newTheme.nameAr || ''}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, nameAr: e.target.value }))}
                    placeholder="اسم السمة"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* الألوان */}
              <div className="space-y-4">
                <h4 className="font-medium">الألوان الأساسية</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'primaryColor', label: 'اللون الرئيسي' },
                    { key: 'secondaryColor', label: 'اللون الثانوي' },
                    { key: 'accentColor', label: 'لون التمييز' },
                    { key: 'backgroundColor', label: 'لون الخلفية' },
                    { key: 'surfaceColor', label: 'لون السطح' },
                    { key: 'textColor', label: 'لون النص' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={newTheme[key as keyof Theme] as string || '#000000'}
                          onChange={(e) => setNewTheme(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={newTheme[key as keyof Theme] as string || ''}
                          onChange={(e) => setNewTheme(prev => ({ ...prev, [key]: e.target.value }))}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* إعدادات إضافية */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>حجم الحواف</Label>
                  <Select
                    value={newTheme.borderRadius || '8'}
                    onValueChange={(value) => setNewTheme(prev => ({ ...prev, borderRadius: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">بدون</SelectItem>
                      <SelectItem value="4">صغير</SelectItem>
                      <SelectItem value="8">متوسط</SelectItem>
                      <SelectItem value="12">كبير</SelectItem>
                      <SelectItem value="16">كبير جداً</SelectItem>
                      <SelectItem value="20">دائري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>سرعة الحركة</Label>
                  <Select
                    value={newTheme.animationSpeed || 'normal'}
                    onValueChange={(value) => setNewTheme(prev => ({ ...prev, animationSpeed: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">بطيئة</SelectItem>
                      <SelectItem value="normal">عادية</SelectItem>
                      <SelectItem value="fast">سريعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCreateTheme} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                حفظ السمة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة المعاينة */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewTheme?.nameAr || previewTheme?.name}
            </DialogTitle>
            <DialogDescription>
              {previewTheme?.descriptionAr || previewTheme?.description}
            </DialogDescription>
          </DialogHeader>

          {previewTheme && (
            <div
              className="rounded-xl p-6 min-h-64"
              style={{
                backgroundColor: previewTheme.backgroundColor,
                background: previewTheme.backgroundType === 'gradient'
                  ? previewTheme.backgroundGradient
                  : undefined
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: previewTheme.primaryColor }}
                  >
                    <Palette className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3
                      className="text-xl font-bold"
                      style={{ color: previewTheme.textColor }}
                    >
                      قاموسي الذكي
                    </h3>
                    <p style={{ color: previewTheme.textSecondary }}>
                      معاينة السمة
                    </p>
                  </div>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: previewTheme.surfaceColor }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: previewTheme.textColor }}>
                      كلمة اليوم
                    </span>
                    <Badge style={{ backgroundColor: previewTheme.primaryColor, color: 'white' }}>
                      جديد
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: previewTheme.textColor }}>
                    Serendipity
                  </p>
                  <p style={{ color: previewTheme.textSecondary }}>
                    مصادفة سعيدة
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    style={{ backgroundColor: previewTheme.primaryColor }}
                  >
                    تعلم الآن
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    style={{
                      borderColor: previewTheme.primaryColor,
                      color: previewTheme.primaryColor
                    }}
                  >
                    مراجعة
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'تعلمت', value: '45' },
                    { label: 'راجعت', value: '120' },
                    { label: 'أخطأت', value: '12' }
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: previewTheme.surfaceColor }}
                    >
                      <p className="text-2xl font-bold" style={{ color: previewTheme.primaryColor }}>
                        {stat.value}
                      </p>
                      <p className="text-sm" style={{ color: previewTheme.textSecondary }}>
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              إغلاق
            </Button>
            {previewTheme && (
              <Button onClick={() => {
                handlePurchaseTheme(previewTheme)
                setIsPreviewDialogOpen(false)
              }}>
                {previewTheme.isPremium ? `${previewTheme.price} ${previewTheme.currency === 'gems' ? '💎' : '🪙'}` : 'احصل عليها مجاناً'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة الإنشاء */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء سمة جديدة</DialogTitle>
            <DialogDescription>صمم سمتك الخاصة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم السمة</Label>
              <Input
                value={newTheme.name || ''}
                onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                placeholder="أدخل اسم السمة"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>اللون الرئيسي</Label>
                <input
                  type="color"
                  value={newTheme.primaryColor || '#10B981'}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <Label>اللون الثانوي</Label>
                <input
                  type="color"
                  value={newTheme.secondaryColor || '#14B8A6'}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateTheme}>
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
