'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { AuthPage } from '@/components/auth/AuthPage'
import { VocabularyApp } from '@/components/vocabulary-app'
import { useAuth } from '@/contexts/AuthContext'
import { useVocabStore } from '@/store/vocab-store'
import { Card, CardContent } from '@/components/ui/card'
import { Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// App version
const APP_VERSION = '4.0.0'

export default function Page() {
  const { user, loading: authLoading, logout } = useAuth()
  const { 
    selectUser, 
    loadWords, 
    loadCategories, 
    loadNotes, 
    loadStats,
    currentUserId,
    setUsers
  } = useVocabStore()
  
  const [mounted, setMounted] = useState(false)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const initializedRef = useRef(false)

  // Handle mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Initialize user data after authentication
  useEffect(() => {
    if (user && !currentUserId && !initializedRef.current) {
      // Set the current user in the store
      setUsers([user])
      selectUser(user.id)
      initializedRef.current = true
    }
  }, [user, currentUserId, selectUser, setUsers])

  // Load data when user is set
  useEffect(() => {
    if (currentUserId && user) {
      Promise.all([
        loadWords(),
        loadCategories(),
        loadNotes(),
      ]).then(() => {
        loadStats()
        setDataLoaded(true)
      })
    }
  }, [currentUserId, user, loadWords, loadCategories, loadNotes, loadStats])

  // Service Worker update handling
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'APP_UPDATED') {
        console.log('[App] New version available:', event.data.version)
        setShowUpdatePrompt(true)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  // Handle app update
  const handleUpdate = useCallback(async () => {
    setIsUpdating(true)

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }

    // Unregister old service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(reg => reg.unregister()))
    }

    // Reload the page
    window.location.reload()
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
  }, [logout])

  // Show loading state during hydration
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Show update prompt
  if (showUpdatePrompt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Download className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              تحديث جديد متوفر!
            </h2>
            <p className="text-gray-500 mb-6">
              تم تحديث التطبيق لإصدار أحدث. يُنصح بالتحديث للحصول على أحدث الميزات والإصلاحات.
            </p>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  تحديث الآن
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />
  }

  // Show loading while fetching user data
  if (!dataLoaded && currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  // Show the main app
  return <VocabularyApp onLogout={handleLogout} />
}
 
