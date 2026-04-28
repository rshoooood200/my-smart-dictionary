'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectUser, users, setUsers } = useVocabStore();

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        // Update store with user data
        if (!users.find(u => u.id === data.user.id)) {
          setUsers([data.user]);
        }
        selectUser(data.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
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
