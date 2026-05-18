'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useVocabStore, User } from '@/store/vocab-store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== إعدادات الجلسة =====
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 دقائق
const MAX_RETRIES = 3; // عدد محاولات إعادة الاتصال
const BASE_RETRY_DELAY = 1000; // 1 ثانية
const FETCH_TIMEOUT = 10000; // 10 ثواني مهلة

// ===== تخزين الجلسة المؤقت =====
const SESSION_CACHE_KEY = 'auth_cached_user';
const SESSION_TIMESTAMP_KEY = 'auth_cache_timestamp';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 أيام

// حفظ بيانات المستخدم في التخزين المحلي
function cacheUser(user: User) {
  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.warn('[Auth] Failed to cache user data:', e);
  }
}

// استرجاع بيانات المستخدم من التخزين المحلي
function getCachedUser(): User | null {
  try {
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);

    if (!cached || !timestamp) return null;

    // التحقق من صلاحية التخزين المؤقت
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_MAX_AGE) {
      localStorage.removeItem(SESSION_CACHE_KEY);
      localStorage.removeItem(SESSION_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(cached) as User;
  } catch (e) {
    console.warn('[Auth] Failed to read cached user data:', e);
    return null;
  }
}

// مسح بيانات الجلسة المخزنة
function clearCachedUser() {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  } catch (e) {
    console.warn('[Auth] Failed to clear cached user data:', e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectUser, users, setUsers } = useVocabStore();
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  /**
   * جلب الجلسة من الخادم مع إعادة المحاولة
   * 
   * الميزات:
   * - إعادة المحاولة مع تأخير تصاعدي عند فشل الشبكة
   * - استخدام البيانات المخزنة محلياً عند فشل الاتصال
   * - تمييز بين "جلسة غير صالحة" و"خطأ مؤقت"
   * - منع الطلبات المتزامنة
   */
  const fetchSession = useCallback(async (retries = MAX_RETRIES): Promise<boolean> => {
    // منع الطلبات المتزامنة
    if (isFetchingRef.current) return false;
    isFetchingRef.current = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch('/api/auth/session', {
        signal: controller.signal,
        credentials: 'include', // إرسال الكوكيز
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        // حفظ بيانات المستخدم في التخزين المحلي
        cacheUser(data.user);
        // Update store with user data
        if (!users.find(u => u.id === data.user.id)) {
          setUsers([data.user]);
        }
        selectUser(data.user.id);
        return true;
      } else {
        // الخادم قال أن الجلسة غير صالحة
        // نتحقق من سبب الرفض
        if (res.status === 503 || data.reason === 'server_error') {
          // خطأ في الخادم (مشكلة مؤقتة في قاعدة البيانات)
          // لا نسجل الخروج - نستخدم البيانات المخزنة
          console.warn('[Auth] Server error (503), using cached session');
          const cachedUser = getCachedUser();
          if (cachedUser) {
            setUser(cachedUser);
            if (!users.find(u => u.id === cachedUser.id)) {
              setUsers([cachedUser]);
            }
            selectUser(cachedUser.id);
            return true;
          }
          // لا بيانات مخزنة - نحاول مرة أخرى
          if (retries > 0) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
            await new Promise(resolve => setTimeout(resolve, delay));
            isFetchingRef.current = false;
            return fetchSession(retries - 1);
          }
          // نفدت المحاولات ولا بيانات مخزنة - نبقي الحالة الحالية إن أمكن
          return false;
        }

        // جلسة غير صالحة فعلاً (401) - نسجل الخروج
        setUser(null);
        clearCachedUser();
        return false;
      }
    } catch (error) {
      // خطأ شبكة، انتهاء مهلة، أو إحباط
      console.warn('[Auth] Session fetch failed (network error):', error);

      if (retries > 0) {
        // تأخير تصاعدي: 1ث، 2ث، 4ث
        const delay = BASE_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        isFetchingRef.current = false;
        return fetchSession(retries - 1);
      }

      // نفدت المحاولات بسبب أخطاء الشبكة
      // لا نسجل الخروج - نستخدم البيانات المخزنة أو نبقي الحالة الحالية
      const cachedUser = getCachedUser();
      if (cachedUser) {
        console.log('[Auth] Network error, using cached session');
        setUser(cachedUser);
        if (!users.find(u => u.id === cachedUser.id)) {
          setUsers([cachedUser]);
        }
        selectUser(cachedUser.id);
      } else {
        console.log('[Auth] Network error, no cached data, keeping current state');
      }
      return false;
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [users, setUsers, selectUser]);

  // ===== تحميل الجلسة عند بدء التطبيق =====
  useEffect(() => {
    fetchSession();
  }, []);

  // ===== تحديث الجلسة دورياً =====
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      fetchSession();
    }, SESSION_REFRESH_INTERVAL);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchSession]);

  // ===== إعادة التحقق عند العودة من الخلفية =====
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // انتظر قليلاً لتجنب مشاكل الاتصال عند العودة
        setTimeout(() => fetchSession(), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchSession]);

  // ===== إعادة التحقق عند استعادة التركيز =====
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchSession]);

  // ===== إعادة التحقق عند عودة الاتصال =====
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        fetchSession();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, fetchSession]);

  // ===== تسجيل الدخول =====
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        cacheUser(data.user);
        if (!users.find(u => u.id === data.user.id)) {
          setUsers([data.user]);
        }
        selectUser(data.user.id);
        return { success: true };
      }
      return { success: false, error: data.error || 'فشل تسجيل الدخول' };
    } catch (error) {
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  // ===== إنشاء حساب =====
  const register = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        cacheUser(data.user);
        if (!users.find(u => u.id === data.user.id)) {
          setUsers([data.user]);
        }
        selectUser(data.user.id);
        return { success: true };
      }
      return { success: false, error: data.error || 'فشل التسجيل' };
    } catch (error) {
      return { success: false, error: 'حدث خطأ أثناء التسجيل' };
    }
  };

  // ===== تسجيل الخروج =====
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      // دائماً نسجل الخروج محلياً حتى لو فشل طلب الخروج
      setUser(null);
      clearCachedUser();
    }
  };

  // ===== تحديث بيانات المستخدم =====
  const refreshUser = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
