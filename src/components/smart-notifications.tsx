'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, Settings, Check, X, Trash2, Clock, Plus,
  Volume2, VolumeX, Vibrate, Moon, Sun, Calendar,
  ChevronRight, AlertCircle, Award, Target, Users,
  Zap, RefreshCw, BookOpen, Trophy, Flame, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NotificationItem {
  id: string
  type: string
  title: string
  titleAr?: string
  message: string
  messageAr?: string
  icon?: string
  actionType?: string
  actionId?: string
  isRead: boolean
  priority: string
  createdAt: string
}

interface NotificationSettings {
  reviewReminders: boolean
  dailyGoalReminders: boolean
  achievementAlerts: boolean
  streakWarnings: boolean
  friendActivity: boolean
  challengeInvites: boolean
  weeklyReports: boolean
  newFeatures: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  soundEnabled: boolean
  vibrationEnabled: boolean
  morningReminderTime: string
  eveningReminderTime: string
  reviewReminderTime: string
}

interface SmartNotificationsProps {
  currentUserId: string
  stats?: {
    wordsToReview?: number
    dailyGoalProgress?: number
    currentStreak?: number
  }
}

const notificationTypes = [
  { id: 'reviewReminders', label: 'تذكيرات المراجعة', labelEn: 'Review Reminders', icon: RefreshCw, color: 'text-blue-500' },
  { id: 'dailyGoalReminders', label: 'تذكيرات الهدف اليومي', labelEn: 'Daily Goal Reminders', icon: Target, color: 'text-emerald-500' },
  { id: 'achievementAlerts', label: 'تنبيهات الإنجازات', labelEn: 'Achievement Alerts', icon: Award, color: 'text-amber-500' },
  { id: 'streakWarnings', label: 'تحذيرات السلسلة', labelEn: 'Streak Warnings', icon: Flame, color: 'text-rose-500' },
  { id: 'friendActivity', label: 'نشاط الأصدقاء', labelEn: 'Friend Activity', icon: Users, color: 'text-purple-500' },
  { id: 'challengeInvites', label: 'دعوات التحدي', labelEn: 'Challenge Invites', icon: Zap, color: 'text-orange-500' },
  { id: 'weeklyReports', label: 'التقارير الأسبوعية', labelEn: 'Weekly Reports', icon: BookOpen, color: 'text-teal-500' },
  { id: 'newFeatures', label: 'الميزات الجديدة', labelEn: 'New Features', icon: Bell, color: 'text-cyan-500' },
]

const defaultSettings: NotificationSettings = {
  reviewReminders: true,
  dailyGoalReminders: true,
  achievementAlerts: true,
  streakWarnings: true,
  friendActivity: true,
  challengeInvites: true,
  weeklyReports: true,
  newFeatures: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  soundEnabled: true,
  vibrationEnabled: true,
  morningReminderTime: '08:00',
  eveningReminderTime: '20:00',
  reviewReminderTime: '19:00',
}

export function SmartNotifications({ currentUserId, stats }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings' | 'schedule'>('notifications')
  
  // Dialogs
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${currentUserId}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!currentUserId) return
    try {
      const res = await fetch(`/api/notification-settings?userId=${currentUserId}`)
      if (res.ok) {
        const data = await res.json()
        setSettings({ ...defaultSettings, ...data.settings })
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchNotifications()
    fetchSettings()
  }, [fetchNotifications, fetchSettings])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      toast.error('فشل في تحديث الإشعار')
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('تم تحديد الكل كمقروء')
    } catch {
      toast.error('فشل في تحديث الإشعارات')
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('تم حذف الإشعار')
    } catch {
      toast.error('فشل في حذف الإشعار')
    }
  }

  // Update settings
  const updateSettings = async (key: keyof NotificationSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    try {
      await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, ...newSettings })
      })
      toast.success('تم حفظ الإعدادات')
    } catch {
      toast.error('فشل في حفظ الإعدادات')
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review': return <RefreshCw className="w-5 h-5 text-blue-500" />
      case 'achievement': return <Award className="w-5 h-5 text-amber-500" />
      case 'streak': return <Flame className="w-5 h-5 text-rose-500" />
      case 'challenge': return <Zap className="w-5 h-5 text-orange-500" />
      case 'friend': return <Users className="w-5 h-5 text-purple-500" />
      case 'daily_goal': return <Target className="w-5 h-5 text-emerald-500" />
      case 'weekly_report': return <BookOpen className="w-5 h-5 text-teal-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`
    return past.toLocaleDateString('ar-SA')
  }

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        toast.success('تم تفعيل الإشعارات بنجاح!')
      } else {
        toast.error('تم رفض إذن الإشعارات')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-emerald-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الإشعارات الذكية</h2>
            <p className="text-gray-500 text-sm">إدارة الإشعارات والتذكيرات</p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              تحديد الكل كمقروء
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            الإعدادات
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <RefreshCw className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.wordsToReview || 0}</p>
              <p className="text-xs text-gray-500">كلمات للمراجعة</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.dailyGoalProgress || 0}%</p>
              <p className="text-xs text-gray-500">الهدف اليومي</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Flame className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.currentStreak || 0}</p>
              <p className="text-xs text-gray-500">سلسلة الأيام</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{unreadCount}</p>
              <p className="text-xs text-gray-500">إشعارات جديدة</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {[
          { id: 'notifications', label: 'الإشعارات', icon: Bell },
          { id: 'settings', label: 'الإعدادات', icon: Settings },
          { id: 'schedule', label: 'الجدولة', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'notifications' | 'settings' | 'schedule')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              activeTab === tab.id
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500">لا توجد إشعارات</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedNotification(notification)
                    if (!notification.isRead) markAsRead(notification.id)
                  }}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                    notification.isRead
                      ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      : "bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-800 shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {notification.titleAr || notification.title}
                        </h4>
                        <span className="text-xs text-gray-400 whitespace-nowrap mr-2">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {notification.messageAr || notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  {notification.priority === 'high' && (
                    <div className="mt-2 flex items-center gap-1 text-rose-500 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>عاجل</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">أنواع الإشعارات</CardTitle>
              <CardDescription>اختر الإشعارات التي تريد استلامها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <type.icon className={cn("w-5 h-5", type.color)} />
                    <div>
                      <Label>{type.label}</Label>
                      <p className="text-xs text-gray-500">{type.labelEn}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[type.id as keyof NotificationSettings] as boolean}
                    onCheckedChange={(checked) => updateSettings(type.id as keyof NotificationSettings, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sound & Vibration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الصوت والاهتزاز</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  )}
                  <Label>الأصوات</Label>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings('soundEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Vibrate className={cn("w-5 h-5", settings.vibrationEnabled ? "text-emerald-500" : "text-gray-400")} />
                  <Label>الاهتزاز</Label>
                </div>
                <Switch
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(checked) => updateSettings('vibrationEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الأوقات الهادئة</CardTitle>
              <CardDescription>لن يتم إرسال إشعارات خلال هذه الفترة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <Label>تفعيل الأوقات الهادئة</Label>
                </div>
                <Switch
                  checked={settings.quietHoursEnabled}
                  onCheckedChange={(checked) => updateSettings('quietHoursEnabled', checked)}
                />
              </div>
              {settings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">من</Label>
                    <Input
                      type="time"
                      value={settings.quietHoursStart}
                      onChange={(e) => updateSettings('quietHoursStart', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">إلى</Label>
                    <Input
                      type="time"
                      value={settings.quietHoursEnd}
                      onChange={(e) => updateSettings('quietHoursEnd', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminder Times */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">أوقات التذكير</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    تذكير الصباح
                  </Label>
                  <Input
                    type="time"
                    value={settings.morningReminderTime}
                    onChange={(e) => updateSettings('morningReminderTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    تذكير المساء
                  </Label>
                  <Input
                    type="time"
                    value={settings.eveningReminderTime}
                    onChange={(e) => updateSettings('eveningReminderTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    وقت المراجعة
                  </Label>
                  <Input
                    type="time"
                    value={settings.reviewReminderTime}
                    onChange={(e) => updateSettings('reviewReminderTime', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Browser Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إشعارات المتصفح</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={requestNotificationPermission} className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                تفعيل إشعارات المتصفح
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                جدولة التذكيرات
              </h3>
              <p className="text-gray-500 mb-4">
                قم بجدولة تذكيرات مخصصة للمراجعة والتعلم
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                إضافة تذكير جديد
              </Button>
            </CardContent>
          </Card>

          {/* Weekly Schedule Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">جدول هذا الأسبوع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((day, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{day}</div>
                    <div className={cn(
                      "w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm",
                      i < 5 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    )}>
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-gray-600">تذكير مجدول</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <span className="text-gray-600">لا توجد تذكيرات</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعدادات الإشعارات</DialogTitle>
            <DialogDescription>تخصيص إعدادات الإشعارات والتذكيرات</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>تفعيل الإشعارات</Label>
              <Switch checked={true} />
            </div>
            <div className="flex items-center justify-between">
              <Label>الأصوات</Label>
              <Switch 
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSettings('soundEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>الاهتزاز</Label>
              <Switch 
                checked={settings.vibrationEnabled}
                onCheckedChange={(checked) => updateSettings('vibrationEnabled', checked)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
