/**
 * مدير المزامنة للعمل دون اتصال
 * يوفر مزامنة تلقائية ويدوية للبيانات المحلية مع السيرفر
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useOnlineStatus } from './use-online-status'
import { offlineDB, STORES, PendingSyncItem } from '@/lib/offline-db'

export interface SyncStatus {
  isSyncing: boolean
  lastSyncAt: Date | null
  pendingCount: number
  syncProgress: number // 0-100
  error: string | null
}

export interface SyncResult {
  success: number
  failed: number
  total: number
  errors: Array<{ id: string; error: string }>
}

export function useOfflineSync(userId?: string) {
  const { isOnline } = useOnlineStatus()
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncAt: null,
    pendingCount: 0,
    syncProgress: 0,
    error: null,
  })
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef(false)

  // تحديث عدد العناصر المعلقة
  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await offlineDB.getPendingSyncItems()
      setStatus(prev => ({ ...prev, pendingCount: pending.length }))
    } catch (error) {
      console.error('[Sync] Failed to update pending count:', error)
    }
  }, [])

  // مزامنة عنصر واحد
  const syncItem = async (item: PendingSyncItem): Promise<boolean> => {
    const endpoints: Record<string, string> = {
      word: '/api/words',
      category: '/api/categories',
      note: '/api/notes',
      progress: '/api/sync/progress',
    }

    const endpoint = endpoints[item.type]
    if (!endpoint) {
      console.error('[Sync] Unknown item type:', item.type)
      return false
    }

    try {
      let response: Response

      if (item.action === 'delete') {
        response = await fetch(`${endpoint}?id=${item.data.id}`, {
          method: 'DELETE',
        })
      } else {
        response = await fetch(endpoint, {
          method: item.action === 'create' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item.data,
            userId,
          }),
        })
      }

      if (response.ok) {
        // تحديث العنصر المحلي كـ متزامن
        const storeMap: Record<string, string> = {
          word: STORES.WORDS,
          category: STORES.CATEGORIES,
          note: STORES.NOTES,
        }
        
        const storeName = storeMap[item.type]
        if (storeName && item.action !== 'delete') {
          const serverData = await response.json()
          await offlineDB.markAsSynced(storeName, item.id, serverData.id)
        }
        
        // حذف من طابور المزامنة
        await offlineDB.removeSyncItem(item.id)
        return true
      } else {
        const error = await response.text()
        console.error('[Sync] Server error:', error)
        return false
      }
    } catch (error) {
      console.error('[Sync] Network error:', error)
      return false
    }
  }

  // مزامنة جميع العناصر المعلقة
  const syncAll = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline || isSyncingRef.current) {
      return { success: 0, failed: 0, total: 0, errors: [] }
    }

    isSyncingRef.current = true
    setStatus(prev => ({ ...prev, isSyncing: true, error: null, syncProgress: 0 }))

    try {
      const pending = await offlineDB.getPendingSyncItems()
      const result: SyncResult = {
        success: 0,
        failed: 0,
        total: pending.length,
        errors: [],
      }

      for (let i = 0; i < pending.length; i++) {
        const item = pending[i]
        const success = await syncItem(item)
        
        if (success) {
          result.success++
        } else {
          result.failed++
          result.errors.push({
            id: item.id,
            error: 'فشل في المزامنة',
          })
          
          // تحديث عدد المحاولات
          if (item.retries < 3) {
            await offlineDB.updateSyncRetries(item.id, item.retries + 1)
          }
        }

        setStatus(prev => ({
          ...prev,
          syncProgress: Math.round(((i + 1) / pending.length) * 100),
        }))
      }

      const now = new Date()
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: now,
        pendingCount: result.failed,
        syncProgress: 100,
      }))

      // حفظ وقت آخر مزامنة
      localStorage.setItem('lastSyncAt', now.toISOString())

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في المزامنة'
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
        syncProgress: 0,
      }))
      
      return {
        success: 0,
        failed: 0,
        total: 0,
        errors: [{ id: 'general', error: errorMessage }],
      }
    } finally {
      isSyncingRef.current = false
    }
  }, [isOnline, userId])

  // تحميل البيانات من السيرفر وحفظها محلياً
  const downloadFromServer = useCallback(async () => {
    if (!isOnline || !userId) return

    try {
      // تحميل الكلمات
      const wordsRes = await fetch(`/api/words?userId=${userId}`)
      if (wordsRes.ok) {
        const words = await wordsRes.json()
        if (Array.isArray(words)) {
          await offlineDB.storeBulkLocalData(STORES.WORDS, words, true)
        }
      }

      // تحميل التصنيفات
      const categoriesRes = await fetch(`/api/categories?userId=${userId}`)
      if (categoriesRes.ok) {
        const categories = await categoriesRes.json()
        if (Array.isArray(categories)) {
          await offlineDB.storeBulkLocalData(STORES.CATEGORIES, categories, true)
        }
      }

      // تحميل الملاحظات
      const notesRes = await fetch(`/api/notes?userId=${userId}`)
      if (notesRes.ok) {
        const notes = await notesRes.json()
        if (Array.isArray(notes)) {
          await offlineDB.storeBulkLocalData(STORES.NOTES, notes, true)
        }
      }

      console.log('[Sync] Data downloaded from server')
    } catch (error) {
      console.error('[Sync] Failed to download data:', error)
    }
  }, [isOnline, userId])

  // بدء المزامنة التلقائية
  const startAutoSync = useCallback((intervalMinutes: number = 5) => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
    }

    syncIntervalRef.current = setInterval(() => {
      if (isOnline && !isSyncingRef.current) {
        syncAll()
      }
    }, intervalMinutes * 60 * 1000)
  }, [isOnline, syncAll])

  // إيقاف المزامنة التلقائية
  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }
  }, [])

  // تهيئة المزامنة
  useEffect(() => {
    updatePendingCount()
    
    // استعادة وقت آخر مزامنة
    const lastSyncStr = localStorage.getItem('lastSyncAt')
    if (lastSyncStr) {
      setStatus(prev => ({ ...prev, lastSyncAt: new Date(lastSyncStr) }))
    }

    // مزامنة عند استعادة الاتصال
    if (isOnline) {
      syncAll()
      downloadFromServer()
    }

    return () => {
      stopAutoSync()
    }
  }, [isOnline])

  // الاستماع لرسائل Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        updatePendingCount()
        setStatus(prev => ({
          ...prev,
          lastSyncAt: new Date(),
        }))
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage)
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [updatePendingCount])

  return {
    ...status,
    syncAll,
    downloadFromServer,
    startAutoSync,
    stopAutoSync,
    updatePendingCount,
  }
}

export default useOfflineSync
