'use client'

import { create } from 'zustand'

// Types
export interface User {
  id: string
  name: string
  avatar?: string | null
  xp: number
  level: number
  currentStreak: number
  longestStreak: number
  achievements: string[]
  lastActiveDate?: string | null
  createdAt: string
  _count?: { words: number; categories: number }
}

export interface Sentence {
  id: string
  sentence: string
  translation: string
  isAiGenerated?: boolean
}

export interface Word {
  id: string
  word: string
  translation: string
  pronunciation?: string | null
  definition?: string | null
  partOfSpeech?: string | null
  level: string
  isLearned: boolean
  isFavorite: boolean
  reviewCount: number
  correctCount: number
  lastReviewedAt?: string | null
  nextReviewAt?: string | null
  // Spaced Repetition SM-2 fields
  easeFactor?: number | null
  interval?: number | null
  repetitions?: number | null
  categoryId?: string | null
  category?: { id: string; name: string; nameAr?: string | null; color: string } | null
  sentences: Sentence[]
  synonyms: string[]
  antonyms: string[]
  usageNotes?: string | null
  createdAt: string
  userId: string
}

export interface Category {
  id: string
  name: string
  nameAr?: string | null
  color: string
  icon?: string | null
  userId: string
  createdAt: string
  _count?: { words: number }
}

export interface UserStats {
  totalWords: number
  learnedWords: number
  favoriteWords: number
  currentStreak: number
  longestStreak: number
  totalReviews: number
  correctReviews: number
  xp: number
  level: number
  achievements: string[]
}

export interface ReviewSession {
  id: string
  date: string
  totalWords: number
  correctCount: number
}

export interface Note {
  id: string
  title: string
  content: string
  color: string
  isPinned: boolean
  isArchived: boolean
  tags: string[]
  userId: string
  createdAt: string
  updatedAt: string
}

// Store interface
interface VocabStore {
  // User state
  currentUserId: string | null
  users: User[]
  
  // Data state
  words: Word[]
  categories: Category[]
  notes: Note[]
  stats: UserStats | null
  
  // UI state
  isLoading: boolean
  
  // User actions
  loadUsers: () => Promise<void>
  selectUser: (userId: string) => void
  setUsers: (users: User[]) => void
  createNewUser: (name: string, avatar?: string) => Promise<User>
  removeUser: (userId: string) => Promise<void>
  logout: () => void
  
  // Word actions
  loadWords: () => Promise<void>
  addWord: (word: Omit<Word, 'id' | 'userId' | 'createdAt' | 'isFavorite' | 'isLearned' | 'reviewCount' | 'correctCount' | 'sentences' | 'synonyms' | 'antonyms'> & { sentences?: { sentence: string; translation: string }[]; synonyms?: string[]; antonyms?: string[] }) => Promise<Word>
  updateWord: (wordId: string, updates: Partial<Word>) => Promise<Word | null>
  deleteWord: (wordId: string) => Promise<void>
  toggleFavorite: (wordId: string) => Promise<void>
  toggleLearned: (wordId: string) => Promise<void>
  
  // Category actions
  loadCategories: () => Promise<void>
  addCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt'>) => Promise<Category>
  updateCategory: (categoryId: string, updates: Partial<Category>) => Promise<Category | null>
  deleteCategory: (categoryId: string) => Promise<void>
  
  // Note actions
  loadNotes: () => Promise<void>
  addNote: (note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isPinned' | 'isArchived'>) => Promise<Note>
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<Note | null>
  deleteNote: (noteId: string) => Promise<void>
  togglePinNote: (noteId: string) => Promise<void>
  toggleArchiveNote: (noteId: string) => Promise<void>
  
  // Stats actions
  loadStats: () => void
  checkAndAwardAchievements: () => void
  
  // Review actions
  getWordsForReview: (mode: 'need-review' | 'random', count?: number) => Word[]
  recordReviewAnswer: (wordId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => Promise<void>
  completeReviewSession: (totalWords: number, correctCount: number) => Promise<void>
  
  // Export
  exportData: () => { words: Word[]; categories: Category[]; notes: Note[]; stats: UserStats | null }
}

// Helper to get stats from words
function calculateStats(words: Word[], user: User | undefined): UserStats {
  return {
    totalWords: words.length,
    learnedWords: words.filter(w => w.isLearned).length,
    favoriteWords: words.filter(w => w.isFavorite).length,
    currentStreak: user?.currentStreak || 0,
    longestStreak: user?.longestStreak || 0,
    totalReviews: words.reduce((sum, w) => sum + w.reviewCount, 0),
    correctReviews: words.reduce((sum, w) => sum + w.correctCount, 0),
    xp: user?.xp || 0,
    level: user?.level || 1,
    achievements: user?.achievements || [],
  }
}

export const useVocabStore = create<VocabStore>((set, get) => ({
  // Initial state
  currentUserId: null,
  users: [],
  words: [],
  categories: [],
  notes: [],
  stats: null,
  isLoading: true,
  
  // User actions
  loadUsers: async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      
      if (data.success) {
        // Load currentUserId from localStorage
        const savedUserId = localStorage.getItem('currentUserId')
        set({ 
          users: data.data, 
          currentUserId: savedUserId,
          isLoading: false 
        })
        
        if (savedUserId) {
          await get().loadWords()
          await get().loadCategories()
          await get().loadNotes()
          get().loadStats()
        }
      }
    } catch (error) {
      console.error('Error loading users:', error)
      set({ isLoading: false })
    }
  },
  
  selectUser: (userId: string) => {
    localStorage.setItem('currentUserId', userId)
    set({ currentUserId: userId })
    get().loadWords()
    get().loadCategories()
    get().loadNotes()
    get().loadStats()
  },
  
  setUsers: (users: User[]) => {
    set({ users })
  },
  
  createNewUser: async (name: string, avatar?: string) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar }),
    })
    const data = await res.json()
    
    if (data.success) {
      set(state => ({ users: [...state.users, data.data] }))
      return data.data
    }
    throw new Error(data.error || 'Failed to create user')
  },
  
  removeUser: async (userId: string) => {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    
    set(state => {
      const users = state.users.filter(u => u.id !== userId)
      const currentUserId = state.currentUserId === userId ? null : state.currentUserId
      
      if (state.currentUserId === userId) {
        localStorage.removeItem('currentUserId')
      }
      
      return { 
        users, 
        currentUserId,
        words: currentUserId ? state.words : [],
        categories: currentUserId ? state.categories : [],
        stats: currentUserId ? state.stats : null
      }
    })
  },
  
  logout: () => {
    localStorage.removeItem('currentUserId')
    set({ currentUserId: null, words: [], categories: [], notes: [], stats: null })
  },
  
  // Word actions
  loadWords: async () => {
    const { currentUserId } = get()
    if (!currentUserId) return
    
    try {
      const res = await fetch(`/api/words?userId=${currentUserId}`)
      const data = await res.json()
      
      if (data.success) {
        set({ words: data.data })
        get().loadStats()
      }
    } catch (error) {
      console.error('Error loading words:', error)
    }
  },
  
  addWord: async (wordData) => {
    const { currentUserId } = get()
    if (!currentUserId) throw new Error('No user selected')
    
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...wordData, userId: currentUserId }),
    })
    const data = await res.json()
    
    if (data.success) {
      set(state => ({ words: [...state.words, data.data] }))
      get().loadStats()
      return data.data
    }
    throw new Error(data.error || 'Failed to add word')
  },
  
  updateWord: async (wordId, updates) => {
    const res = await fetch(`/api/words/${wordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    
    if (data.success) {
      set(state => ({
        words: state.words.map(w => w.id === wordId ? data.data : w)
      }))
      get().loadStats()
      return data.data
    }
    return null
  },
  
  deleteWord: async (wordId) => {
    await fetch(`/api/words/${wordId}`, { method: 'DELETE' })
    set(state => ({
      words: state.words.filter(w => w.id !== wordId)
    }))
    get().loadStats()
  },
  
  toggleFavorite: async (wordId) => {
    const { words } = get()
    const word = words.find(w => w.id === wordId)
    if (word) {
      await get().updateWord(wordId, { isFavorite: !word.isFavorite })
    }
  },
  
  toggleLearned: async (wordId) => {
    const { words } = get()
    const word = words.find(w => w.id === wordId)
    if (word) {
      await get().updateWord(wordId, { isLearned: !word.isLearned })
    }
  },
  
  // Category actions
  loadCategories: async () => {
    const { currentUserId } = get()
    if (!currentUserId) return
    
    try {
      const res = await fetch(`/api/categories?userId=${currentUserId}`)
      const data = await res.json()
      
      if (data.success) {
        set({ categories: data.data })
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  },
  
  addCategory: async (categoryData) => {
    const { currentUserId } = get()
    if (!currentUserId) throw new Error('No user selected')
    
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...categoryData, userId: currentUserId }),
    })
    const data = await res.json()
    
    if (data.success) {
      set(state => ({ categories: [...state.categories, data.data] }))
      return data.data
    }
    throw new Error(data.error || 'Failed to add category')
  },
  
  updateCategory: async (categoryId, updates) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update category')
      }
      
      set(state => ({
        categories: state.categories.map(c => c.id === categoryId ? data.data : c)
      }))
      
      // Update words with this category
      set(state => ({
        words: state.words.map(w => 
          w.categoryId === categoryId 
            ? { ...w, category: data.data }
            : w
        )
      }))
      
      return data.data
    } catch (error) {
      console.error('Error updating category:', error)
      return null
    }
  },
  
  deleteCategory: async (categoryId) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete category')
      }
      
      set(state => ({
        categories: state.categories.filter(c => c.id !== categoryId),
        // Update words that had this category
        words: state.words.map(w => 
          w.categoryId === categoryId 
            ? { ...w, categoryId: null, category: null }
            : w
        )
      }))
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  },
  
  // Note actions
  loadNotes: async () => {
    const { currentUserId } = get()
    if (!currentUserId) return
    
    try {
      const res = await fetch(`/api/notes?userId=${currentUserId}`)
      const data = await res.json()
      
      // Handle both success format and direct array format
      const notesArray = data.success ? data.data : data
      
      // Parse tags from JSON string
      const notes = notesArray.map((n: { tags: string }) => ({
        ...n,
        tags: JSON.parse(n.tags || '[]')
      }))
      set({ notes })
    } catch (error) {
      console.error('Error loading notes:', error)
      set({ notes: [] })
    }
  },
  
  addNote: async (noteData) => {
    const { currentUserId } = get()
    if (!currentUserId) throw new Error('No user selected')
    
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...noteData, userId: currentUserId }),
    })
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add note')
    }
    
    const note = {
      ...data,
      tags: JSON.parse(data.tags || '[]')
    }
    
    set(state => ({ notes: [note, ...state.notes] }))
    return note
  },
  
  updateNote: async (noteId, updates) => {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update note')
    }
    
    const note = {
      ...data,
      tags: JSON.parse(data.tags || '[]')
    }
    
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? note : n)
    }))
    return note
  },
  
  deleteNote: async (noteId) => {
    const { currentUserId } = get()
    const res = await fetch(`/api/notes/${noteId}?userId=${currentUserId}`, { method: 'DELETE' })
    if (!res.ok) {
      throw new Error('Failed to delete note')
    }
    set(state => ({
      notes: state.notes.filter(n => n.id !== noteId)
    }))
  },
  
  togglePinNote: async (noteId) => {
    const { notes } = get()
    const note = notes.find(n => n.id === noteId)
    if (note) {
      await get().updateNote(noteId, { isPinned: !note.isPinned })
    }
  },
  
  toggleArchiveNote: async (noteId) => {
    const { notes } = get()
    const note = notes.find(n => n.id === noteId)
    if (note) {
      await get().updateNote(noteId, { isArchived: !note.isArchived })
    }
  },
  
  // Stats actions
  loadStats: () => {
    const { words, users, currentUserId } = get()
    const user = users.find(u => u.id === currentUserId)
    const stats = calculateStats(words, user)
    set({ stats })
  },
  
  checkAndAwardAchievements: () => {
    const { words, users, currentUserId, stats } = get()
    if (!currentUserId || !stats) return
    
    const user = users.find(u => u.id === currentUserId)
    if (!user) return
    
    const achievements = [...user.achievements]
    const newAchievements: string[] = []
    
    // Check for word count achievements
    if (stats.totalWords >= 10 && !achievements.includes('first_10_words')) {
      newAchievements.push('first_10_words')
    }
    if (stats.totalWords >= 50 && !achievements.includes('first_50_words')) {
      newAchievements.push('first_50_words')
    }
    if (stats.totalWords >= 100 && !achievements.includes('first_100_words')) {
      newAchievements.push('first_100_words')
    }
    
    // Check for learned words achievements
    if (stats.learnedWords >= 10 && !achievements.includes('learned_10')) {
      newAchievements.push('learned_10')
    }
    if (stats.learnedWords >= 50 && !achievements.includes('learned_50')) {
      newAchievements.push('learned_50')
    }
    
    // Check for streak achievements
    if (stats.currentStreak >= 7 && !achievements.includes('streak_7')) {
      newAchievements.push('streak_7')
    }
    if (stats.currentStreak >= 30 && !achievements.includes('streak_30')) {
      newAchievements.push('streak_30')
    }
    
    // Update user achievements if there are new ones
    if (newAchievements.length > 0) {
      const allAchievements = [...achievements, ...newAchievements]
      // Update in database
      fetch(`/api/users/${currentUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievements: allAchievements }),
      })
      
      // Update local state
      set(state => ({
        users: state.users.map(u => 
          u.id === currentUserId 
            ? { ...u, achievements: allAchievements }
            : u
        )
      }))
      
      // Show toast for new achievements
      newAchievements.forEach(achievement => {
        const achievementNames: Record<string, string> = {
          'first_10_words': 'أول 10 كلمات! 📚',
          'first_50_words': '50 كلمة! 🎯',
          'first_100_words': '100 كلمة! 🏆',
          'learned_10': 'حفظت 10 كلمات! 🧠',
          'learned_50': 'حفظت 50 كلمة! 🌟',
          'streak_7': 'أسبوع متواصل! 🔥',
          'streak_30': 'شهر متواصل! 💪',
        }
        // Using sonner toast - imported in vocabulary-app.tsx
        console.log('Achievement unlocked:', achievementNames[achievement])
      })
    }
  },
  
  // Review actions - Using SM-2 Algorithm
  getWordsForReview: (mode, count = 10) => {
    const { words } = get()
    
    if (mode === 'need-review') {
      const now = new Date()
      // Include words that:
      // 1. Have no nextReviewAt (new words)
      // 2. Have nextReviewAt in the past (need review)
      const wordsNeedingReview = words
        .filter(w => !w.nextReviewAt || new Date(w.nextReviewAt) <= now)
        
      // Sort by priority (harder words and overdue words first)
      return wordsNeedingReview
        .sort((a, b) => {
          // Calculate priority score
          const getPriority = (w: Word) => {
            let priority = 0
            // Overdue words get higher priority
            if (w.nextReviewAt) {
              const daysOverdue = (now.getTime() - new Date(w.nextReviewAt).getTime()) / (1000 * 60 * 60 * 24)
              priority += Math.max(0, daysOverdue) * 10
            } else {
              priority += 5 // New words
            }
            // Lower ease factor = harder = higher priority
            priority += (3 - (w.easeFactor || 2.5)) * 5
            // Lower repetitions = need more practice
            priority -= (w.repetitions || 0) * 0.5
            return priority
          }
          return getPriority(b) - getPriority(a)
        })
        .slice(0, count)
    } else {
      // Random shuffle
      const shuffled = [...words].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, count)
    }
  },
  
  // SM-2 Algorithm implementation
  // Quality: 0-5 where 0=complete blackout, 5=very easy
  recordReviewAnswer: async (wordId, quality) => {
    const { words } = get()
    const word = words.find(w => w.id === wordId)
    if (!word) return
    
    // Get current SM-2 values (defaults for new words)
    let easeFactor = word.easeFactor || 2.5
    let interval = word.interval || 0
    let repetitions = word.repetitions || 0
    
    // SM-2 Algorithm
    // Calculate new ease factor
    const newEaseFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )
    
    // Calculate new interval and repetitions
    if (quality < 3) {
      // Failed - reset
      repetitions = 0
      interval = 1
    } else {
      // Success
      repetitions += 1
      
      if (repetitions === 1) {
        interval = 1
      } else if (repetitions === 2) {
        interval = 6
      } else {
        interval = Math.round(interval * newEaseFactor)
      }
    }
    
    // Calculate next review date
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)
    
    // Update stats
    const newReviewCount = word.reviewCount + 1
    const newCorrectCount = word.correctCount + (quality >= 3 ? 1 : 0)
    
    // Check if mastered (5 consecutive correct + good ease factor)
    const isMastered = repetitions >= 5 && newEaseFactor >= 2.5
    
    await get().updateWord(wordId, {
      reviewCount: newReviewCount,
      correctCount: newCorrectCount,
      lastReviewedAt: new Date().toISOString(),
      nextReviewAt: nextReview.toISOString(),
      easeFactor: Math.round(newEaseFactor * 100) / 100,
      interval,
      repetitions,
      isLearned: isMastered,
    })
  },
  
  completeReviewSession: async (totalWords, correctCount) => {
    const { currentUserId, users } = get()
    if (!currentUserId) return
    
    // Update user XP and streak
    const user = users.find(u => u.id === currentUserId)
    if (user) {
      await fetch(`/api/users/${currentUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xp: user.xp + correctCount * 5,
          level: Math.floor((user.xp + correctCount * 5) / 100) + 1,
        }),
      })
    }
  },
  
  // Export
  exportData: () => {
    const { words, categories, notes, stats } = get()
    return { words, categories, notes, stats }
  },
}))

// Selector hooks
export const useCurrentUser = () => useVocabStore(state => {
  const user = state.users.find(u => u.id === state.currentUserId)
  return user || null
})

export const useWords = () => useVocabStore(state => state.words)
export const useCategories = () => useVocabStore(state => state.categories)
export const useStats = () => useVocabStore(state => state.stats)
