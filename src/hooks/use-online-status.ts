/**
 * Hook للكشف عن حالة الاتصال بالإنترنت
 * يوفر معلومات فورية عن حالة الاتصال وتاريخ التغييرات
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

export interface OnlineStatus {
  isOnline: boolean
  isOffline: boolean
  lastOnline: Date | null
  lastOffline: Date | null
  offlineDuration: number // بالمللي ثانية
}

export function useOnlineStatus(): OnlineStatus {
  // Initialize state with current online status
  const [status, setStatus] = useState<OnlineStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    lastOnline: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
    lastOffline: typeof navigator !== 'undefined' && !navigator.onLine ? new Date() : null,
    offlineDuration: 0,
  }))

  const handleOnline = useCallback(() => {
    const now = new Date()
    setStatus(prev => ({
      isOnline: true,
      isOffline: false,
      lastOnline: now,
      lastOffline: prev.lastOffline,
      offlineDuration: prev.lastOffline ? now.getTime() - prev.lastOffline.getTime() : 0,
    }))
  }, [])

  const handleOffline = useCallback(() => {
    const now = new Date()
    setStatus(prev => ({
      isOnline: false,
      isOffline: true,
      lastOnline: prev.lastOnline,
      lastOffline: now,
      offlineDuration: 0,
    }))
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return status
}

/**
 * Hook مبسط يُرجع فقط حالة الاتصال
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOnlineStatus()
  return isOnline
}

/**
 * Hook لتنفيذ دالة عند استعادة الاتصال
 */
export function useOnBackOnline(callback: () => void) {
  const { isOnline } = useOnlineStatus()
  const wasOffline = useState(false)
  
  useEffect(() => {
    if (!isOnline) {
      wasOffline[1](true)
    } else if (wasOffline[0]) {
      callback()
      wasOffline[1](false)
    }
  }, [isOnline, callback])
}

export default useOnlineStatus
