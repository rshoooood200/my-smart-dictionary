'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Wifi, WifiOff, Cloud, HardDrive, RefreshCw, Trash2,
  Download, Upload, Settings, Check, AlertTriangle, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useOfflineSync } from '@/hooks/use-offline-sync'
import { offlineDB, STORES } from '@/lib/offline-db'

interface OfflineSettingsProps {
  userId?: string
}

export function OfflineSettings({ userId }: OfflineSettingsProps) {
  const { isOnline, isOffline } = useOnlineStatus()
  const { 
    isSyncing, 
    pendingCount, 
    syncProgress, 
    lastSyncAt,
    syncAll,
    downloadFromServer,
    startAutoSync,
    stopAutoSync
  } = useOfflineSync(userId)

  const [storageStats, setStorageStats] = useState({
    words: 0,
    categories: 0,
    notes: 0,
    pendingSync: 0,
    totalSize: '0 MB',
  })

  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 5,
    offlineMode: true,
    downloadOnWifi: true,
  })

  const [isLoading, setIsLoading] = useState(false)

  // تحميل الإحصائيات
  const loadStats = async () => {
    const stats = await offlineDB.getStorageStats()
    setStorageStats(stats)
  }

  useEffect(() => {
    loadStats()
    
    // تحميل الإعدادات
    const savedSettings = localStorage.getItem('offline-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // حفظ الإعدادات
  const saveSettings = (key: string, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('offline-settings', JSON.stringify(newSettings))
    toast.success('تم حفظ الإعدادات')
  }

  // تنزيل البيانات للعمل دون اتصال
  const handleDownloadData = async () => {
    if (!isOnline) {
      toast.error('يجب أن تكون متصلاً بالإنترنت لتنزيل البيانات')
      return
    }

    setIsLoading(true)
    try {
      await downloadFromServer()
      await loadStats()
      toast.success('تم تنزيل البيانات بنجاح')
    } catch (error) {
      toast.error('فشل في تنزيل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  // مزامنة البيانات
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('يجب أن تكون متصلاً بالإنترنت للمزامنة')
      return
    }

    const result = await syncAll()
    if (result.success > 0) {
      toast.success(`تمت مزامنة ${result.success} عنصر بنجاح`)
    }
    if (result.failed > 0) {
      toast.error(`فشلت مزامنة ${result.failed} عنصر`)
    }
    await loadStats()
  }

  // مسح البيانات المحلية
  const handleClearData = async () => {
    if (confirm('هل أنت متأكد من مسح جميع البيانات المحلية؟ لن يؤثر هذا على البيانات على السيرفر.')) {
      await offlineDB.clearAll()
      await loadStats()
      toast.success('تم مسح البيانات المحلية')
    }
  }

  // تنسيق الوقت
  const formatTime = (date: Date | null) => {
    if (!date) return 'لم تتم بعد'
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* حالة الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-emerald-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-500" />
            )}
            حالة الاتصال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )} />
              <span className="font-medium">
                {isOnline ? 'متصل بالإنترنت' : 'غير متصل'}
              </span>
            </div>
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? 'نشط' : 'محلي'}
            </Badge>
          </div>
          
          {isOffline && (
            <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertTitle>وضع عدم الاتصال</AlertTitle>
              <AlertDescription>
                يمكنك المتابعة في استخدام التطبيق. ستُحفظ التغييرات محلياً وتُزامن عند استعادة الاتصال.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* حالة المزامنة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            المزامنة
          </CardTitle>
          <CardDescription>
            مزامنة البيانات المحلية مع السيرفر
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* آخر مزامنة */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">آخر مزامنة:</span>
            <span className="font-medium">{formatTime(lastSyncAt)}</span>
          </div>

          {/* العناصر المعلقة */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">عناصر معلقة:</span>
            <Badge variant={pendingCount > 0 ? "destructive" : "secondary"}>
              {pendingCount}
            </Badge>
          </div>

          {/* شريط التقدم */}
          {isSyncing && (
            <div className="space-y-2">
              <Progress value={syncProgress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                جاري المزامنة... {syncProgress}%
              </p>
            </div>
          )}

          {/* أزرار المزامنة */}
          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={!isOnline || isSyncing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  جاري المزامنة...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  مزامنة الآن
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadData}
              disabled={!isOnline || isLoading}
            >
              <Download className="w-4 h-4 ml-2" />
              تنزيل البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* التخزين المحلي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            التخزين المحلي
          </CardTitle>
          <CardDescription>
            البيانات المحفوظة على جهازك للعمل دون اتصال
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* إحصائيات التخزين */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500">الكلمات</p>
              <p className="text-xl font-bold text-emerald-600">{storageStats.words}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500">التصنيفات</p>
              <p className="text-xl font-bold text-blue-600">{storageStats.categories}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500">الملاحظات</p>
              <p className="text-xl font-bold text-amber-600">{storageStats.notes}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500">الحجم</p>
              <p className="text-xl font-bold text-purple-600">{storageStats.totalSize}</p>
            </div>
          </div>

          <Separator />

          {/* مسح البيانات */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">مسح البيانات المحلية</p>
              <p className="text-xs text-gray-500">حذف جميع البيانات المحفوظة محلياً</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearData}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              مسح
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الوضع دون اتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات عدم الاتصال
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* المزامنة التلقائية */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-sync">المزامنة التلقائية</Label>
              <p className="text-xs text-gray-500">مزامنة البيانات تلقائياً عند الاتصال</p>
            </div>
            <Switch
              id="auto-sync"
              checked={settings.autoSync}
              onCheckedChange={(checked) => {
                saveSettings('autoSync', checked)
                if (checked) {
                  startAutoSync(settings.syncInterval)
                } else {
                  stopAutoSync()
                }
              }}
            />
          </div>

          <Separator />

          {/* التنزيل على WiFi فقط */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="wifi-only">التنزيل على WiFi فقط</Label>
              <p className="text-xs text-gray-500">توفير البيانات الخلوية</p>
            </div>
            <Switch
              id="wifi-only"
              checked={settings.downloadOnWifi}
              onCheckedChange={(checked) => saveSettings('downloadOnWifi', checked)}
            />
          </div>

          <Separator />

          {/* وضع عدم الاتصال */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="offline-mode">تفعيل الوضع دون اتصال</Label>
              <p className="text-xs text-gray-500">حفظ التغييرات محلياً عند عدم الاتصال</p>
            </div>
            <Switch
              id="offline-mode"
              checked={settings.offlineMode}
              onCheckedChange={(checked) => saveSettings('offlineMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* معلومات PWA */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-200">
                تثبيت التطبيق
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                ثبّت التطبيق على جهازك للوصول السريع والعمل دون اتصال بالإنترنت.
                يمكنك إضافته إلى الشاشة الرئيسية من قائمة المتصفح.
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                <span>يعمل بدون اتصال</span>
                <Check className="w-4 h-4 mr-2" />
                <span>تحديثات تلقائية</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OfflineSettings
