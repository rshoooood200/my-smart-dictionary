'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useOnlineStatus } from '@/hooks/use-online-status'

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface OfflineIndicatorProps {
  userId?: string
  showDetails?: boolean
  variant?: 'compact' | 'full'
}

export function OfflineIndicator({ 
  userId, 
  showDetails = false,
  variant = 'compact'
}: OfflineIndicatorProps) {
  const { isOnline, isOffline, lastOnline, lastOffline } = useOnlineStatus()
  const [showBanner, setShowBanner] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // إظهار البانر عند فقدان الاتصال
  const handleOffline = useCallback(() => {
    setShowBanner(true)
  }, [])

  useEffect(() => {
    if (isOffline) {
      handleOffline()
    }
  }, [isOffline, handleOffline])

  // مزامنة البيانات
  const syncAll = useCallback(async () => {
    if (!isOnline) return
    setIsSyncing(true)
    setSyncProgress(0)
    
    try {
      // Simulate sync progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setSyncProgress(i)
      }
      setPendingCount(0)
      setLastSyncAt(new Date())
      setError(null)
    } catch (err) {
      setError('فشل في المزامنة')
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline])

  // تحميل عدد العناصر المعلقة
  useEffect(() => {
    const loadPendingCount = async () => {
      // Simulate loading pending count
      setPendingCount(0)
    }
    loadPendingCount()
  }, [])

  // تنسيق الوقت
  const formatTime = (date: Date | null) => {
    if (!date) return 'غير محدد'
    return new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // النسخة المدمجة
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
                isOnline 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              )}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>غير متصل</span>
                </>
              )}
              {pendingCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {pendingCount}
                </Badge>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p>{isOnline ? 'متصل بالإنترنت' : 'العمل بدون اتصال'}</p>
            {lastSyncAt && (
              <p className="text-gray-400">آخر مزامنة: {formatTime(lastSyncAt)}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // النسخة الكاملة
  return (
    <>
      {/* بانر حالة الاتصال */}
      <AnimatePresence>
        {showBanner && isOffline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">
                  أنت غير متصل بالإنترنت - التغييرات ستُحفظ محلياً
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowBanner(false)}
              >
                إغلاق
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مؤشر المزامنة */}
      {showDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-4">
          {/* حالة الاتصال */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isOnline ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"
              )}>
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {isOnline ? 'متصل بالإنترنت' : 'وضع عدم الاتصال'}
                </p>
                <p className="text-sm text-gray-500">
                  {isOnline && lastOffline && `آخر انقطاع: ${formatTime(lastOffline)}`}
                  {isOffline && lastOnline && `آخر اتصال: ${formatTime(lastOnline)}`}
                </p>
              </div>
            </div>
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? 'نشط' : 'محلي'}
            </Badge>
          </div>

          {/* حالة المزامنة */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                ) : pendingCount > 0 ? (
                  <CloudOff className="w-4 h-4 text-amber-500" />
                ) : (
                  <Cloud className="w-4 h-4 text-emerald-500" />
                )}
                <span className="text-sm font-medium">المزامنة</span>
              </div>
              {pendingCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {pendingCount} عنصر معلق
                </Badge>
              )}
            </div>

            {/* شريط التقدم */}
            {isSyncing && (
              <div className="space-y-1">
                <Progress value={syncProgress} className="h-1.5" />
                <p className="text-xs text-gray-500 text-center">
                  جاري المزامنة... {syncProgress}%
                </p>
              </div>
            )}

            {/* آخر مزامنة */}
            {!isSyncing && lastSyncAt && (
              <p className="text-xs text-gray-500">
                آخر مزامنة: {formatTime(lastSyncAt)}
              </p>
            )}

            {/* خطأ المزامنة */}
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* زر المزامنة */}
            {isOnline && pendingCount > 0 && !isSyncing && (
              <Button
                onClick={syncAll}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                مزامنة الآن
              </Button>
            )}

            {/* رسالة النجاح */}
            {!isSyncing && pendingCount === 0 && isOnline && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm mt-2">
                <Check className="w-4 h-4" />
                <span>جميع البيانات متزامنة</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// مكون بانر التثبيت
export function InstallBanner() {
  const [showInstall, setShowInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    ;(deferredPrompt as BeforeInstallPromptEvent).prompt()
    setShowInstall(false)
    setDeferredPrompt(null)
  }

  if (!showInstall) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow-lg p-4 z-50"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Cloud className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">تثبيت التطبيق</h3>
          <p className="text-sm text-white/80 mt-1">
            ثبّت التطبيق على جهازك للوصول السريع والعمل دون اتصال
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
            >
              تثبيت
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setShowInstall(false)}
            >
              لاحقاً
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default OfflineIndicator
