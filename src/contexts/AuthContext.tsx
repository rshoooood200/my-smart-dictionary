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

// Session refresh interval: 5 minutes
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000;
// Max retry attempts for session fetch
const MAX_RETRIES = 3;
// Base delay for exponential backoff (ms)
const BASE_RETRY_DELAY = 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectUser, users, setUsers } = useVocabStore();
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  const fetchSession = useCallback(async (retries = MAX_RETRIES): Promise<boolean> => {
    // Prevent concurrent session fetches
    if (isFetchingRef.current) return false;
    isFetchingRef.current = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch('/api/auth/session', {
        signal: controller.signal,
        credentials: 'include', // Ensure cookies are sent
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        // Update store with user data
        if (!users.find(u => u.id === data.user.id)) {
          setUsers([data.user]);
        }
        selectUser(data.user.id);
        return true;
      } else {
        // Server explicitly says no session - this is a real logout
        // Only clear user if we've exhausted retries
        if (retries <= 0) {
          setUser(null);
        }
        return false;
      }
    } catch (error) {
      // Network error, timeout, or abort - DON'T log out immediately
      console.warn('Session fetch failed (network error):', error);

      if (retries > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = BASE_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        isFetchingRef.current = false;
        return fetchSession(retries - 1);
      }

      // All retries exhausted due to network errors
      // DON'T log out - keep the current user state
      // The session cookie is still valid, this is likely a temporary network issue
      console.error('All session fetch retries failed due to network errors. Keeping current session.');
      return false;
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [users, setUsers, selectUser]);

  // Initial session check
  useEffect(() => {
    fetchSession();
  }, []);

  // Periodic session refresh
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

  // Re-check session when tab/window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchSession]);

  // Re-check session when window regains focus
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

  // Listen for online event to retry session check after network recovery
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
        // Update store with user data
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
        // Update store with user data
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

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

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
