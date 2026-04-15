'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

// Hook آمن للتعامل مع localStorage
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // قراءة القيمة الأولية
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return JSON.stringify(initialValue)
    try {
      const item = localStorage.getItem(key)
      return item ? item : JSON.stringify(initialValue)
    } catch {
      return JSON.stringify(initialValue)
    }
  }, [key, initialValue])

  const subscribe = useCallback((callback: () => void) => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) callback()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => JSON.stringify(initialValue)
  )

  const parsedValue = useState(() => {
    try {
      return JSON.parse(storedValue) as T
    } catch {
      return initialValue
    }
  })[0]

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(parsedValue) : value
      localStorage.setItem(key, JSON.stringify(valueToStore))
      // إطلاق حدث لتحديث المكونات الأخرى
      window.dispatchEvent(new StorageEvent('storage', { key }))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key, parsedValue])

  return [parsedValue, setValue]
}

// Hook للتحقق من أن الكود يعمل على العميل
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}
