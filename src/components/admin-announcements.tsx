'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, ChevronDown, ChevronUp, AlertCircle, Info, Sparkles, Megaphone, Crown, Star, Zap, Gift, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminUpdate {
  id: string
  title: string
  titleAr: string
  content: string
  contentAr?: string
  type: string
  priority: string
  isPublished: boolean
  publishedAt?: string
  createdAt: string
}

export function AdminAnnouncements() {
  const [updates, setUpdates] = useState<AdminUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const saved = localStorage.getItem('dismissed-announcements')
    if (saved) {
      setDismissedIds(JSON.parse(saved))
    }

    // Fetch admin updates
    const fetchUpdates = async () => {
      try {
        const response = await fetch('/api/admin/updates')
        if (response.ok) {
          const data = await response.json()
          setUpdates(data)
        }
      } catch (error) {
        console.error('Error fetching updates:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUpdates()
  }, [])

  const visibleUpdates = updates.filter(u => u.isPublished && !dismissedIds.includes(u.id))

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem('dismissed-announcements', JSON.stringify(newDismissed))
  }

  if (isLoading || visibleUpdates.length === 0) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return Megaphone
      case 'feature': return Sparkles
      case 'tip': return Info
      case 'gift': return Gift
      default: return Bell
    }
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          gradient: 'from-rose-500 via-pink-500 to-rose-600',
          bg: 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50',
          border: 'border-rose-300 dark:border-rose-700',
          shimmer: 'bg-gradient-to-r from-transparent via-white/30 to-transparent',
          icon: '🔥'
        }
      case 'normal':
        return {
          gradient: 'from-amber-500 via-orange-500 to-amber-600',
          bg: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
          border: 'border-amber-300 dark:border-amber-700',
          shimmer: 'bg-gradient-to-r from-transparent via-white/30 to-transparent',
          icon: '📢'
        }
      default:
        return {
          gradient: 'from-blue-500 via-cyan-500 to-blue-600',
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50',
          border: 'border-blue-300 dark:border-blue-700',
          shimmer: 'bg-gradient-to-r from-transparent via-white/30 to-transparent',
          icon: '✨'
        }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 rounded-2xl blur-sm" />
      
      {/* Main Container */}
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 border-amber-300/50 dark:border-amber-700/50 shadow-lg shadow-amber-500/10 overflow-hidden">
        {/* Animated Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse" />
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-shimmer" 
             style={{ animation: 'shimmer 3s infinite' }} />

        {/* Header */}
        <div
          className="relative flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {/* Animated Icon Container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-md opacity-50 animate-pulse" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-bounce shadow-lg">
                {visibleUpdates.length}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">إعلانات المؤسس</h3>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  جديد
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {visibleUpdates.length === 1 ? 'إعلان جديد من المؤسس' : `${visibleUpdates.length} إعلانات جديدة`}
              </p>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-amber-100/50 dark:bg-amber-900/30">
              <ChevronDown className="w-5 h-5 text-amber-600" />
            </Button>
          </motion.div>
        </div>

        {/* Announcements List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 space-y-3">
                {visibleUpdates.map((update, index) => {
                  const Icon = getIcon(update.type)
                  const styles = getPriorityStyles(update.priority)
                  
                  return (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      {/* Card Container */}
                      <div className={cn(
                        "relative rounded-xl border-2 overflow-hidden transition-all duration-300",
                        "hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5",
                        styles.bg,
                        styles.border
                      )}>
                        {/* Priority Indicator Bar */}
                        <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r", styles.gradient)} />
                        
                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn(
                              "relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                              "bg-gradient-to-br shadow-lg",
                              styles.gradient
                            )}>
                              <Icon className="w-6 h-6 text-white" />
                              <span className="absolute -top-1 -right-1 text-sm">{styles.icon}</span>
                            </div>
                            
                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h4 className="font-bold text-gray-900 dark:text-white">{update.titleAr}</h4>
                                {update.priority === 'high' && (
                                  <Badge className="bg-rose-500 text-white text-xs animate-pulse">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    مهم
                                  </Badge>
                                )}
                                {update.priority === 'normal' && (
                                  <Badge className="bg-amber-500 text-white text-xs">
                                    <Zap className="w-3 h-3 mr-1" />
                                    عاجل
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {update.content}
                              </p>
                              
                              {update.publishedAt && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                  <Bell className="w-3 h-3" />
                                  <span>
                                    {new Date(update.publishedAt).toLocaleDateString('ar-SA', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Dismiss Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 shrink-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100/50 dark:bg-gray-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDismiss(update.id)
                              }}
                            >
                              <X className="w-4 h-4 text-gray-500 hover:text-rose-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Bottom Decorative Element */}
        {isExpanded && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Heart className="w-3 h-3 text-rose-400" />
              <span>من المؤسس لكم</span>
              <Heart className="w-3 h-3 text-rose-400" />
            </div>
          </div>
        )}
      </div>
      
      {/* Custom CSS for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  )
}
