'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, BellOff, Download, Wifi, WifiOff, RefreshCw,
  Smartphone, Zap, Cloud, CheckCircle2,
  XCircle, Settings, Volume2, VolumeX, Vibrate,
  Clock, Calendar, Star, Target, Trophy, RefreshCw as RefreshIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// أنواع الإشعارات
type NotificationType = 'review' | 'streak' | 'achievement' | 'challenge' | 'daily' | 'weekly'

interface NotificationSetting {
  id: NotificationType
  title: string
  description: string
  enabled: boolean
  icon: React.ReactNode
}

interface PWAStatus {
  isInstalled: boolean
  isOnline: boolean
  hasUpdate: boolean
  canInstall: boolean
  notificationPermission: NotificationPermission
  storageUsed: number
  storageQuota: number
}

// أوقات الإشعارات المحددة مسبقاً
const PRESET_TIMES = [
  { id: 'morning', label: 'الصباح (8:00 ص)', time: '08:00' },
  { id: 'noon', label: 'الظهر (12:00 م)', time: '12:00' },
  { id: 'evening', label: 'المساء (6:00 م)', time: '18:00' },
  { id: 'night', label: 'الليل (9:00 م)', time: '21:00' },
]

// مكون داخلي للتعامل مع الأحداث
function PWAEventHandler({ 
  onOnlineStatusChange, 
  onInstallPrompt,
  onStorageUpdate 
}: { 
  onOnlineStatusChange: () => void
  onInstallPrompt: (e: Event) => void
  onStorageUpdate: (used: number, quota: number) => void
}) {
  useEffect(() => {
    const checkStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        onStorageUpdate(estimate.usage || 0, estimate.quota || 0)
      }
    }
    
    checkStorage()
    
    window.addEventListener('online', onOnlineStatusChange)
    window.addEventListener('offline', onOnlineStatusChange)
    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    
    return () => {
      window.removeEventListener('online', onOnlineStatusChange)
      window.removeEventListener('offline', onOnlineStatusChange)
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
    }
  }, [onOnlineStatusChange, onInstallPrompt, onStorageUpdate])
  
  return null
}

export function PWAFeatures() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>(() => {
    if (typeof window === 'undefined') {
      return {
        isInstalled: false,
        isOnline: true,
        hasUpdate: false,
        canInstall: false,
        notificationPermission: 'default',
        storageUsed: 0,
        storageQuota: 0,
      }
    }
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true
    
    return {
      isInstalled: isStandalone,
      isOnline: navigator.onLine,
      hasUpdate: false,
      canInstall: false,
      notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      storageUsed: 0,
      storageQuota: 0,
    }
  })
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: 'review', title: 'تذكير المراجعة', description: 'تذكير عند وجود كلمات للمراجعة', enabled: true, icon: <RefreshCw className="w-5 h-5" /> },
    { id: 'streak', title: 'الحفاظ على التسلسل', description: 'تذكير للحفاظ على التسلسل اليومي', enabled: true, icon: <Zap className="w-5 h-5" /> },
    { id: 'achievement', title: 'الإنجازات', description: 'إشعار عند الحصول على إنجاز جديد', enabled: true, icon: <Trophy className="w-5 h-5" /> },
    { id: 'challenge', title: 'التحديات', description: 'تذكير بالتحدي اليومي', enabled: false, icon: <Target className="w-5 h-5" /> },
    { id: 'daily', title: 'التقرير اليومي', description: 'ملخص نشاطك اليومي', enabled: false, icon: <Calendar className="w-5 h-5" /> },
    { id: 'weekly', title: 'التقرير الأسبوعي', description: 'ملخص نشاطك الأسبوعي', enabled: false, icon: <Star className="w-5 h-5" /> },
  ])
  
  const [reminderTime, setReminderTime] = useState('08:00')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  
  // معالجات الأحداث
  const handleOnlineStatusChange = useCallback(() => {
    setPwaStatus(prev => ({ ...prev, isOnline: navigator.onLine }))
  }, [])
  
  const handleInstallPrompt = useCallback((e: Event) => {
    e.preventDefault()
    setDeferredPrompt(e)
    setPwaStatus(prev => ({ ...prev, canInstall: true }))
  }, [])
  
  const handleStorageUpdate = useCallback((used: number, quota: number) => {
    setPwaStatus(prev => ({ ...prev, storageUsed: used, storageQuota: quota }))
  }, [])
  
  // تثبيت التطبيق
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      toast.success('تم تثبيت التطبيق بنجاح!')
      setPwaStatus(prev => ({ ...prev, isInstalled: true, canInstall: false }))
    }
    
    setDeferredPrompt(null)
  }, [deferredPrompt])
  
  // تحديث التطبيق
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      })
    }
  }, [])
  
  // طلب إذن الإشعارات
  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      toast.error('المتصفح لا يدعم الإشعارات')
      return
    }
    
    const permission = await Notification.requestPermission()
    setPwaStatus(prev => ({ ...prev, notificationPermission: permission }))
    
    if (permission === 'granted') {
      toast.success('تم تفعيل الإشعارات!')
      // إرسال إشعار تجريبي
      if (typeof Notification !== 'undefined') {
        new Notification('قاموسي الذكي', {
          body: 'تم تفعيل الإشعارات بنجاح! 🎉',
          icon: '/app-icon.png',
          badge: '/app-icon.png',
        })
      }
    } else {
      toast.error('لم يتم السماح بالإشعارات')
    }
  }, [])
  
  // تبديل إشعار
  const toggleNotification = useCallback((id: NotificationType) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, enabled: !n.enabled } : n
      )
      const notification = prev.find(n => n.id === id)
      toast.success(notification?.enabled ? 'تم إيقاف الإشعار' : 'تم تفعيل الإشعار')
      return updated
    })
  }, [])
  
  // إرسال إشعار تجريبي
  const sendTestNotification = useCallback(() => {
    if (pwaStatus.notificationPermission !== 'granted') {
      toast.error('الرجاء تفعيل الإشعارات أولاً')
      return
    }
    
    if (typeof Notification !== 'undefined') {
      new Notification('تذكير بالمراجعة 📚', {
        body: 'لديك 5 كلمات تنتظر المراجعة اليوم!',
        icon: '/app-icon.png',
        badge: '/app-icon.png',
        tag: 'review-reminder',
        vibrate: vibrationEnabled ? [200, 100, 200] : undefined,
      })
      
      toast.success('تم إرسال إشعار تجريبي!')
    } else {
      toast.error('المتصفح لا يدعم الإشعارات')
    }
  }, [pwaStatus.notificationPermission, vibrationEnabled])
  
  // تنسيق حجم التخزين
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 بايت'
    const k = 1024
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // حساب نسبة التخزين
  const storagePercent = pwaStatus.storageQuota > 0 
    ? Math.round((pwaStatus.storageUsed / pwaStatus.storageQuota) * 100)
    : 0
  
  return (
    <>
      <PWAEventHandler 
        onOnlineStatusChange={handleOnlineStatusChange}
        onInstallPrompt={handleInstallPrompt}
        onStorageUpdate={handleStorageUpdate}
      />
      
      <div className="space-y-4">
        {/* حالة PWA */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className={cn(
            "h-2",
            pwaStatus.isOnline ? "bg-emerald-500" : "bg-rose-500"
          )} />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {pwaStatus.isOnline ? (
                  <Wifi className="w-6 h-6 text-emerald-500" />
                ) : (
                  <WifiOff className="w-6 h-6 text-rose-500" />
                )}
                <div>
                  <p className="font-medium">
                    {pwaStatus.isOnline ? 'متصل بالإنترنت' : 'وضع عدم الاتصال'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pwaStatus.isInstalled ? 'التطبيق مثبت' : 'يعمل كتطبيق ويب'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {pwaStatus.canInstall && !pwaStatus.isInstalled && (
                  <Button onClick={installApp}>
                    <Download className="w-4 h-4 mr-2" />
                    تثبيت
                  </Button>
                )}
                
                {pwaStatus.hasUpdate && (
                  <Button variant="outline" onClick={updateApp}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    تحديث
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* التبويبات */}
        <Tabs defaultValue="notifications">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-1" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-1" />
              الإعدادات
            </TabsTrigger>
            <TabsTrigger value="storage">
              <Cloud className="w-4 h-4 mr-1" />
              التخزين
            </TabsTrigger>
          </TabsList>
          
          {/* تبويب الإشعارات */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            {/* إذن الإشعارات */}
            <Card className={cn(
              "border-0 shadow-md",
              pwaStatus.notificationPermission === 'granted' ? "bg-emerald-50 dark:bg-emerald-900/20" : 
              pwaStatus.notificationPermission === 'denied' ? "bg-rose-50 dark:bg-rose-900/20" : ""
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pwaStatus.notificationPermission === 'granted' ? (
                      <Bell className="w-6 h-6 text-emerald-500" />
                    ) : pwaStatus.notificationPermission === 'denied' ? (
                      <BellOff className="w-6 h-6 text-rose-500" />
                    ) : (
                      <Bell className="w-6 h-6 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {pwaStatus.notificationPermission === 'granted' ? 'الإشعارات مفعلة' :
                         pwaStatus.notificationPermission === 'denied' ? 'الإشعارات معطلة' : 'الإشعارات غير مفعلة'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pwaStatus.notificationPermission === 'granted' ? 'ستتلقى التذكيرات والإشعارات' :
                         pwaStatus.notificationPermission === 'denied' ? 'قم بتغيير الإعدادات من المتصفح' : 'اضغط للسماح بالإشعارات'}
                      </p>
                    </div>
                  </div>
                  
                  {pwaStatus.notificationPermission !== 'granted' && (
                    <Button onClick={requestNotificationPermission}>
                      تفعيل
                    </Button>
                  )}
                  
                  {pwaStatus.notificationPermission === 'granted' && (
                    <Button variant="outline" onClick={sendTestNotification}>
                      اختبار
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* أنواع الإشعارات */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">أنواع الإشعارات</CardTitle>
                <CardDescription>اختر الإشعارات التي تريد تلقيها</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        notification.enabled ? "bg-violet-100 text-violet-600" : "text-gray-400"
                      )}>
                        {notification.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-gray-500">{notification.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notification.enabled}
                      onCheckedChange={() => toggleNotification(notification.id)}
                      disabled={pwaStatus.notificationPermission !== 'granted'}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* وقت التذكير */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">وقت التذكير</CardTitle>
                <CardDescription>اختر وقت التذكير اليومي</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_TIMES.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={reminderTime === preset.time ? 'default' : 'outline'}
                      className="h-auto py-3"
                      onClick={() => setReminderTime(preset.time)}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {preset.label}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium mb-1 block">وقت مخصص</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* تبويب الإعدادات */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* إعدادات الصوت والاهتزاز */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">الصوت والاهتزاز</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-violet-500" />
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
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Vibrate className={cn("w-5 h-5", vibrationEnabled ? "text-violet-500" : "text-gray-400")} />
                    <div>
                      <p className="font-medium text-sm">الاهتزاز</p>
                      <p className="text-xs text-gray-500">اهتزاز عند التنبيهات</p>
                    </div>
                  </div>
                  <Switch
                    checked={vibrationEnabled}
                    onCheckedChange={setVibrationEnabled}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* معلومات التطبيق */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">معلومات التطبيق</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">الإصدار</span>
                  <span className="font-medium">4.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">حالة التثبيت</span>
                  <span className="font-medium">{pwaStatus.isInstalled ? 'مثبت' : 'ويب'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">حالة الاتصال</span>
                  <Badge variant={pwaStatus.isOnline ? 'default' : 'destructive'}>
                    {pwaStatus.isOnline ? 'متصل' : 'غير متصل'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* تحديث التطبيق */}
            {pwaStatus.hasUpdate && (
              <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">تحديث جديد متوفر!</p>
                      <p className="text-white/80 text-sm">اضغط لتحديث التطبيق</p>
                    </div>
                    <Button variant="secondary" onClick={updateApp}>
                      تحديث
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* تبويب التخزين */}
          <TabsContent value="storage" className="space-y-4 mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">التخزين المحلي</CardTitle>
                <CardDescription>مساحة التخزين المستخدمة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>المستخدم: {formatBytes(pwaStatus.storageUsed)}</span>
                    <span>المتاح: {formatBytes(pwaStatus.storageQuota)}</span>
                  </div>
                  <Progress value={storagePercent} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">{storagePercent}% مستخدم</p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Smartphone className="w-5 h-5 text-violet-500" />
                    <span className="font-medium">التخزين المؤقت (Cache)</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    يتم تخزين البيانات محلياً للعمل بدون إنترنت
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    if ('caches' in window) {
                      const cacheNames = await caches.keys()
                      await Promise.all(cacheNames.map(name => caches.delete(name)))
                      toast.success('تم مسح التخزين المؤقت')
                      window.location.reload()
                    }
                  }}
                >
                  <RefreshIcon className="w-4 h-4 mr-2" />
                  مسح التخزين المؤقت
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* ميزات وضع عدم الاتصال */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              ميزات PWA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                <WifiOff className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-medium">يعمل أوفلاين</p>
              </div>
              <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-center">
                <Bell className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                <p className="text-sm font-medium">إشعارات</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                <Download className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <p className="text-sm font-medium">قابل للتثبيت</p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-center">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                <p className="text-sm font-medium">تحديث تلقائي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
