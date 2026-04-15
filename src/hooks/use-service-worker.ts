'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerStatus {
  isRegistered: boolean
  isUpdateAvailable: boolean
  isOfflineCapable: boolean
  error: string | null
}

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isRegistered: false,
    isUpdateAvailable: false,
    isOfflineCapable: false,
    error: null,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setStatus(prev => ({
        ...prev,
        error: 'Service Workers غير مدعومة في هذا المتصفح',
      }))
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('[PWA] Service Worker registered:', registration.scope)

        setStatus(prev => ({
          ...prev,
          isRegistered: true,
          isOfflineCapable: true,
        }))

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setStatus(prev => ({
                  ...prev,
                  isUpdateAvailable: true,
                }))
              }
            })
          }
        })

        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // كل ساعة

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error)
        setStatus(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'فشل في تسجيل Service Worker',
        }))
      }
    }

    registerServiceWorker()

    // Listen for controller change (new version activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    }
  }

  return {
    ...status,
    updateServiceWorker,
  }
}

export default useServiceWorker
