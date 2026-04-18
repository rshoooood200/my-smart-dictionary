'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Plus, Search, Video, BookOpen, Tag, Bell, FileText,
  Settings, Trash2, Edit, X, Save, Eye, EyeOff, Lock, Unlock,
  Youtube, Image as ImageIcon, Sparkles, AlertCircle, Check,
  ChevronRight, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Database,
  Users, Globe, Key, LogIn, LogOut, Crown, Heart, Play, Music,
  Loader2, GripVertical, ArrowUp, ArrowDown, GraduationCap, Briefcase,
  Baby, FolderOpen, Newspaper
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GamesQuizzesManager } from './admin/games-quizzes-manager'

// مفتاح الوصول للوحة التحكم (مخفي - لا تشاركه)
const ADMIN_KEY = 'founderandmanager'

// الفئات الأساسية الافتراضية لتعليم الأشبال (5-14 سنة)
const DEFAULT_KIDS_CATEGORIES = [
  { id: 'alphabet', name: 'Alphabet', nameAr: 'الحروف', icon: '🔤', color: '#F43F5E', order: 0, isDefault: true },
  { id: 'numbers', name: 'Numbers', nameAr: 'الأرقام', icon: '🔢', color: '#F59E0B', order: 1, isDefault: true },
  { id: 'colors', name: 'Colors', nameAr: 'الألوان', icon: '🎨', color: '#8B5CF6', order: 2, isDefault: true },
  { id: 'animals', name: 'Animals', nameAr: 'الحيوانات', icon: '🦁', color: '#10B981', order: 3, isDefault: true },
  { id: 'songs', name: 'Songs', nameAr: 'الأغاني', icon: '🎵', color: '#06B6D4', order: 4, isDefault: true },
  { id: 'stories', name: 'Stories', nameAr: 'القصص', icon: '📖', color: '#EC4899', order: 5, isDefault: true },
  { id: 'games', name: 'Games', nameAr: 'الألعاب', icon: '🎮', color: '#22C55E', order: 6, isDefault: true },
  { id: 'daily', name: 'Daily Life', nameAr: 'الحياة اليومية', icon: '🏠', color: '#0EA5E9', order: 7, isDefault: true },
  { id: 'body', name: 'Body Parts', nameAr: 'أجزاء الجسم', icon: '🧒', color: '#D946EF', order: 8, isDefault: true },
  { id: 'food', name: 'Food', nameAr: 'الطعام', icon: '🍎', color: '#EF4444', order: 9, isDefault: true },
]

// الفئات الأساسية الافتراضية لتعليم الكبار
const DEFAULT_ADULTS_CATEGORIES = [
  { id: 'business', name: 'Business', nameAr: 'الأعمال', icon: '💼', color: '#475569', order: 0, isDefault: true },
  { id: 'academic', name: 'Academic', nameAr: 'أكاديمي', icon: '🎓', color: '#6366F1', order: 1, isDefault: true },
  { id: 'communication', name: 'Communication', nameAr: 'التواصل', icon: '💬', color: '#0D9488', order: 2, isDefault: true },
  { id: 'writing', name: 'Writing', nameAr: 'الكتابة', icon: '✍️', color: '#D97706', order: 3, isDefault: true },
  { id: 'speaking', name: 'Speaking', nameAr: 'المحادثة', icon: '🎤', color: '#E11D48', order: 4, isDefault: true },
  { id: 'presentation', name: 'Presentation', nameAr: 'العروض', icon: '📊', color: '#0891B2', order: 5, isDefault: true },
  { id: 'negotiation', name: 'Negotiation', nameAr: 'التفاوض', icon: '🤝', color: '#9333EA', order: 6, isDefault: true },
  { id: 'networking', name: 'Networking', nameAr: 'التشبيك', icon: '🌐', color: '#10B981', order: 7, isDefault: true },
]

// أنواع المحتوى
interface AdminVideo {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  url: string
  thumbnail?: string
  category: string
  type: string
  ageGroup?: string
  difficulty: string
  duration: number
  order: number
  isActive: boolean
  isFavorite?: boolean
  createdAt: string
  updatedAt: string
}

interface AdminLesson {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  content: string
  contentAr?: string
  category: string
  level?: string
  order: number
  duration: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AdminCategory {
  id: string
  name: string
  nameAr: string
  description?: string
  descriptionAr?: string
  icon?: string
  color?: string
  type: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

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
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

interface AdminNote {
  id: string
  title: string
  titleAr?: string
  content: string
  contentAr?: string
  category?: string
  color: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

// نوع الأقسام الرئيسية
type MainSection = 'kids' | 'adults' | 'general' | 'interactive'
type ContentType = 'categories' | 'videos' | 'lessons' | 'articles' | 'announcements' | 'notes'

// Helper function to check auth state
function getInitialAuthState(): { isAuthenticated: boolean; showKeyDialog: boolean } {
  if (typeof window !== 'undefined') {
    const savedAuth = sessionStorage.getItem('admin-auth')
    if (savedAuth === 'true') {
      return { isAuthenticated: true, showKeyDialog: false }
    }
  }
  return { isAuthenticated: false, showKeyDialog: true }
}

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState().isAuthenticated)
  const [adminKey, setAdminKey] = useState('')
  const [showKeyDialog, setShowKeyDialog] = useState(getInitialAuthState().showKeyDialog)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingVideoInfo, setIsFetchingVideoInfo] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoAnalyze, setAutoAnalyze] = useState(true) // Auto-analyze by default
  
  // Main section and content type states
  const [mainSection, setMainSection] = useState<MainSection>('kids')
  const [contentType, setContentType] = useState<ContentType>('categories')
  
  // فلتر الفئات للفيديوهات
  const [selectedVideoCategory, setSelectedVideoCategory] = useState<string>('all')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminVideo | AdminLesson | AdminCategory | AdminUpdate | AdminNote | null>(null)
  const [editingType, setEditingType] = useState<string>('')
  const [videoPreview, setVideoPreview] = useState<{ thumbnail: string; title: string } | null>(null)

  
  // Data states
  const [videos, setVideos] = useState<AdminVideo[]>([])
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [updates, setUpdates] = useState<AdminUpdate[]>([])
  const [notes, setNotes] = useState<AdminNote[]>([])
  
  const hasFetchedData = useRef(false)

  
  // Form states
  const [videoForm, setVideoForm] = useState<Partial<AdminVideo>>({
    title: '', titleAr: '', description: '', descriptionAr: '',
    url: '', thumbnail: '', category: 'alphabet', type: 'video',
    ageGroup: '5-7', difficulty: 'easy', duration: 0, order: 0, isActive: true
  })
  
  const [lessonForm, setLessonForm] = useState<Partial<AdminLesson>>({
    title: '', titleAr: '', description: '', descriptionAr: '',
    content: '', contentAr: '', category: 'general', level: 'beginner',
    order: 0, duration: 15, isActive: true
  })
  
  const [categoryForm, setCategoryForm] = useState<Partial<AdminCategory>>({
    name: '', nameAr: '', description: '', descriptionAr: '',
    icon: '', color: '#10B981', type: 'kids', order: 0, isActive: true
  })
  
  const [updateForm, setUpdateForm] = useState<Partial<AdminUpdate>>({
    title: '', titleAr: '', content: '', contentAr: '',
    type: 'update', priority: 'normal', isPublished: true
  })
  
  const [noteForm, setNoteForm] = useState<Partial<AdminNote>>({
    title: '', titleAr: '', content: '', contentAr: '',
    category: '', color: '#10B981', isPinned: false
  })

  // Fetch data from API
  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    
    try {
      const [videosRes, lessonsRes, categoriesRes, updatesRes, notesRes] = await Promise.all([
        fetch('/api/admin/videos'),
        fetch('/api/admin/lessons'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/updates'),
        fetch('/api/admin/notes')
      ])
      
      if (videosRes.ok) {
        const videosData = await videosRes.json()
        setVideos(videosData)
      }
      
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json()
        setLessons(lessonsData)
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }
      
      if (updatesRes.ok) {
        const updatesData = await updatesRes.json()
        setUpdates(updatesData)
      }
      
      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setNotes(notesData)
      }
      
      hasFetchedData.current = true
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('حدث خطأ في تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasFetchedData.current) {
      fetchAllData()
    }
  }, [isAuthenticated, fetchAllData])

  // Authentication handlers
  const handleAuthenticate = () => {
    if (adminKey === ADMIN_KEY) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin-auth', 'true')
      setShowKeyDialog(false)
      toast.success('تم تسجيل الدخول كمؤسس')
    } else {
      toast.error('المفتاح غير صحيح')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin-auth')
    setAdminKey('')
    setShowKeyDialog(true)
    hasFetchedData.current = false
    toast.info('تم تسجيل الخروج')
  }

  // Form reset handlers
  const resetVideoForm = () => {
    setVideoForm({
      title: '', titleAr: '', description: '', descriptionAr: '',
      url: '', thumbnail: '', category: 'alphabet', type: 'video',
      ageGroup: '5-7', difficulty: 'easy', duration: 0, order: 0, isActive: true
    })
    setVideoPreview(null)
  }

  const resetLessonForm = () => setLessonForm({
    title: '', titleAr: '', description: '', descriptionAr: '',
    content: '', contentAr: '', category: 'general', level: 'beginner',
    order: 0, duration: 15, isActive: true
  })

  const resetCategoryForm = () => setCategoryForm({
    name: '', nameAr: '', description: '', descriptionAr: '',
    icon: '', color: '#10B981', type: mainSection, order: 0, isActive: true
  })
  
  const resetUpdateForm = () => setUpdateForm({
    title: '', titleAr: '', content: '', contentAr: '',
    type: 'update', priority: 'normal', isPublished: true
  })

  const resetNoteForm = () => setNoteForm({
    title: '', titleAr: '', content: '', contentAr: '',
    category: '', color: '#10B981', isPinned: false
  })

  // Save handlers
  const handleSaveVideo = async () => {
    if (!videoForm.title || !videoForm.titleAr || !videoForm.url || !videoForm.category) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    setIsSaving(true)
    
    try {
      const isEditing = editingItem && editingType === 'video'
      const url = isEditing ? `/api/admin/videos/${editingItem.id}` : '/api/admin/videos'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoForm.title,
          titleAr: videoForm.titleAr,
          description: videoForm.description,
          descriptionAr: videoForm.descriptionAr,
          url: videoForm.url,
          thumbnail: videoForm.thumbnail,
          category: videoForm.category,
          type: videoForm.type || 'video',
          ageGroup: videoForm.ageGroup,
          difficulty: videoForm.difficulty || 'easy',
          duration: videoForm.duration || 0,
          order: videoForm.order || 0,
          isActive: videoForm.isActive ?? true
        })
      })
      
      if (response.ok) {
        const savedVideo = await response.json()
        toast.success(isEditing ? 'تم تحديث الفيديو' : 'تم إضافة الفيديو')
        setShowAddDialog(false)
        setEditingItem(null)
        setEditingType('')
        resetVideoForm()
        await fetchAllData()
        
        // Auto-analyze content if enabled
        if (autoAnalyze && savedVideo.id) {
          setIsAnalyzing(true)
          toast.info('جاري تحليل المحتوى واستخراج الأسئلة والألعاب...')
          
          try {
            const analyzeResponse = await fetch('/api/ai/analyze-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                videoId: savedVideo.id,
                title: videoForm.title,
                titleAr: videoForm.titleAr,
                description: videoForm.description || videoForm.descriptionAr,
                category: videoForm.category,
                targetAudience: mainSection === 'adults' ? 'adults' : 'kids'
              })
            })
            
            if (analyzeResponse.ok) {
              const analyzeResult = await analyzeResponse.json()
              toast.success(`تم استخراج ${analyzeResult.results.quizCount} اختبار، ${analyzeResult.results.gamesCount} لعبة، ${analyzeResult.results.flashcardsCount} بطاقة تعليمية`)
            } else {
              toast.warning('تم حفظ الفيديو لكن فشل التحليل التلقائي')
            }
          } catch (analyzeError) {
            console.error('Error analyzing content:', analyzeError)
            toast.warning('تم حفظ الفيديو لكن فشل التحليل التلقائي')
          } finally {
            setIsAnalyzing(false)
          }
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving video:', error)
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLesson = async () => {
    if (!lessonForm.title || !lessonForm.titleAr || !lessonForm.content || !lessonForm.category) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    setIsSaving(true)
    
    try {
      const isEditing = editingItem && editingType === 'lesson'
      const url = isEditing ? `/api/admin/lessons/${editingItem.id}` : '/api/admin/lessons'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonForm.title,
          titleAr: lessonForm.titleAr,
          description: lessonForm.description,
          descriptionAr: lessonForm.descriptionAr,
          content: lessonForm.content,
          contentAr: lessonForm.contentAr,
          category: lessonForm.category,
          level: lessonForm.level || 'beginner',
          order: lessonForm.order || 0,
          duration: lessonForm.duration || 15,
          isActive: lessonForm.isActive ?? true
        })
      })
      
      if (response.ok) {
        toast.success(isEditing ? 'تم تحديث الدرس' : 'تم إضافة الدرس')
        setShowAddDialog(false)
        setEditingItem(null)
        setEditingType('')
        resetLessonForm()
        await fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving lesson:', error)
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.nameAr) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    setIsSaving(true)
    
    try {
      const isEditing = editingItem && editingType === 'category'
      const url = isEditing ? `/api/admin/categories/${editingItem.id}` : '/api/admin/categories'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          nameAr: categoryForm.nameAr,
          description: categoryForm.description,
          descriptionAr: categoryForm.descriptionAr,
          icon: categoryForm.icon || '',
          color: categoryForm.color || '#10B981',
          type: categoryForm.type || mainSection,
          order: categoryForm.order || 0,
          isActive: categoryForm.isActive ?? true
        })
      })
      
      if (response.ok) {
        toast.success(isEditing ? 'تم تحديث الفئة' : 'تم إضافة الفئة')
        setShowAddDialog(false)
        setEditingItem(null)
        setEditingType('')
        resetCategoryForm()
        await fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveUpdate = async () => {
    if (!updateForm.title || !updateForm.titleAr || !updateForm.content) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    setIsSaving(true)
    
    try {
      const isEditing = editingItem && editingType === 'update'
      const url = isEditing ? `/api/admin/updates/${editingItem.id}` : '/api/admin/updates'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updateForm.title,
          titleAr: updateForm.titleAr,
          content: updateForm.content,
          contentAr: updateForm.contentAr,
          type: updateForm.type || 'update',
          priority: updateForm.priority || 'normal',
          isPublished: updateForm.isPublished ?? true
        })
      })
      
      if (response.ok) {
        toast.success(isEditing ? 'تم تحديث الإعلان' : 'تم إضافة الإعلان')
        setShowAddDialog(false)
        setEditingItem(null)
        setEditingType('')
        resetUpdateForm()
        await fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving update:', error)
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNote = async () => {
    if (!noteForm.title || !noteForm.content) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    setIsSaving(true)
    
    try {
      const isEditing = editingItem && editingType === 'note'
      const url = isEditing ? `/api/admin/notes/${editingItem.id}` : '/api/admin/notes'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteForm.title,
          titleAr: noteForm.titleAr,
          content: noteForm.content,
          contentAr: noteForm.contentAr,
          category: noteForm.category || '',
          color: noteForm.color || '#10B981',
          isPinned: noteForm.isPinned || false
        })
      })
      
      if (response.ok) {
        toast.success(isEditing ? 'تم تحديث الملاحظة' : 'تم إضافة الملاحظة')
        setShowAddDialog(false)
        setEditingItem(null)
        setEditingType('')
        resetNoteForm()
        await fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete handlers
  const handleDeleteVideo = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return
    
    try {
      const response = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('تم حذف الفيديو')
        await fetchAllData()
      } else {
        toast.error('حدث خطأ في الحذف')
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error('حدث خطأ في الحذف')
    }
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return
    
    try {
      const response = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('تم حذف الدرس')
        await fetchAllData()
      } else {
        toast.error('حدث خطأ في الحذف')
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      toast.error('حدث خطأ في الحذف')
    }
  }

  const handleDeleteCategory = async (id: string, isDefault: boolean = false) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return
    
    try {
      if (isDefault) {
        // For default categories, mark as inactive instead of deleting
        // This prevents them from showing up while keeping the record
        const response = await fetch(`/api/admin/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false })
        })
        if (response.ok) {
          toast.success('تم حذف الفئة')
          await fetchAllData()
        } else {
          toast.error('حدث خطأ في الحذف')
        }
      } else {
        // For custom categories, actually delete
        const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
        if (response.ok) {
          toast.success('تم حذف الفئة')
          await fetchAllData()
        } else {
          toast.error('حدث خطأ في الحذف')
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('حدث خطأ في الحذف')
    }
  }

  const handleDeleteUpdate = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return
    
    try {
      const response = await fetch(`/api/admin/updates/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('تم حذف الإعلان')
        await fetchAllData()
      } else {
        toast.error('حدث خطأ في الحذف')
      }
    } catch (error) {
      console.error('Error deleting update:', error)
      toast.error('حدث خطأ في الحذف')
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return
    
    try {
      const response = await fetch(`/api/admin/notes/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('تم حذف الملاحظة')
        await fetchAllData()
      } else {
        toast.error('حدث خطأ في الحذف')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('حدث خطأ في الحذف')
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Fetch YouTube video info automatically
  const fetchYouTubeInfo = async (url: string) => {
    if (!url || !url.includes('youtube') && !url.includes('youtu.be')) {
      return
    }
    
    setIsFetchingVideoInfo(true)
    try {
      const response = await fetch(`/api/youtube-info?url=${encodeURIComponent(url)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Auto-fill form fields
          const updates: Partial<AdminVideo> = {
            url: data.embedUrl || url, // Store the embed URL
            thumbnail: data.thumbnail || videoForm.thumbnail
          }
          
          // Only auto-fill title if it's empty or user hasn't modified it
          if (data.title && !videoForm.title) {
            updates.title = data.title
          }
          if (data.title && !videoForm.titleAr) {
            updates.titleAr = data.title // Use English title as Arabic if not provided
          }
          
          setVideoForm(prev => ({ ...prev, ...updates }))
          setVideoPreview({
            thumbnail: data.thumbnail,
            title: data.title
          })
          toast.success('تم استخراج معلومات الفيديو بنجاح')
        }
      } else {
        toast.warning('لم يتم العثور على معلومات الفيديو')
      }
    } catch (error) {
      console.error('Error fetching YouTube info:', error)
      toast.error('حدث خطأ في استخراج معلومات الفيديو')
    } finally {
      setIsFetchingVideoInfo(false)
    }
  }

  // Helper function to ensure category exists in database before any operation
  const ensureCategoryInDb = async (category: any, type: 'kids' | 'adults') => {
    const existsInDb = categories.find(c => c.id === category.id && c.type === type)
    if (!existsInDb) {
      // Create the category in database first
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          nameAr: category.nameAr,
          icon: category.icon,
          color: category.color,
          type: type,
          order: category.order ?? 0,
          isActive: category.isActive ?? true
        })
      })
      
      if (response.ok) {
        // Reload categories from database to update state
        hasFetchedData.current = false
        await fetchAllData()
        return true
      }
      return false
    }
    return true
  }

  // Get filtered data based on section
  const getFilteredCategories = (type: 'kids' | 'adults') => {
    const dbCategories = categories.filter(c => c.type === type || (!c.type && type === 'kids'))
    const defaultCategories = type === 'kids' ? DEFAULT_KIDS_CATEGORIES : DEFAULT_ADULTS_CATEGORIES
    
    // Get IDs of categories that are in DB but inactive (deleted)
    const deletedIds = dbCategories
      .filter(c => c.isActive === false)
      .map(c => c.id)
    
    const defaultIds = defaultCategories.map(d => d.id)
    const defaultWithOverrides = defaultCategories.map(def => {
      const override = dbCategories.find(c => c.id === def.id)
      return override 
        ? { ...def, ...override, isDefault: true, existsInDb: true }
        : { ...def, isDefault: true, isActive: true, existsInDb: false }
    })
    
    const customCategories = dbCategories
      .filter(c => !defaultIds.includes(c.id) && c.isActive !== false)
      .map(c => ({ ...c, isDefault: false, existsInDb: true }))
    
    return [...defaultWithOverrides, ...customCategories]
      .filter(c => {
        // Hide deleted default categories
        if (deletedIds.includes(c.id)) return false
        if (searchQuery) {
          return c.nameAr?.includes(searchQuery) || c.name?.toLowerCase().includes(searchQuery.toLowerCase())
        }
        return true
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  const getFilteredVideos = (ageGroup: 'kids' | 'adults', category?: string) => {
    return videos.filter(v => {
      const match = ageGroup === 'kids' 
        ? (v.ageGroup !== 'adults' && v.difficulty !== 'hard' && v.difficulty !== 'expert')
        : (v.ageGroup === 'adults' || v.difficulty === 'hard' || v.difficulty === 'expert')
      
      // فلترة حسب الفئة المحددة
      const categoryMatch = category && category !== 'all' ? v.category === category : true
      
      if (searchQuery) {
        return match && categoryMatch && (v.titleAr.includes(searchQuery) || v.title.toLowerCase().includes(searchQuery.toLowerCase()))
      }
      return match && categoryMatch
    }).sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  // إعادة ترتيب الفيديوهات داخل فئة محددة
  const handleReorderVideos = async (videoId: string, direction: 'up' | 'down', ageGroup: 'kids' | 'adults', category?: string) => {
    const allVideos = getFilteredVideos(ageGroup, category)
    const currentIndex = allVideos.findIndex(v => v.id === videoId)
    
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === allVideos.length - 1) return
    
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const currentVideo = allVideos[currentIndex]
    const swapVideo = allVideos[swapIndex]
    
    try {
      // تبديل الترتيب
      await fetch(`/api/admin/videos/${currentVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: swapVideo.order || swapIndex })
      })
      await fetch(`/api/admin/videos/${swapVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: currentVideo.order || currentIndex })
      })
      
      hasFetchedData.current = false
      await fetchAllData()
      toast.success('تم تحديث الترتيب')
    } catch (error) {
      console.error('Error reordering videos:', error)
      toast.error('حدث خطأ في تحديث الترتيب')
    }
  }

  const getFilteredLessons = (level: 'beginner' | 'advanced') => {
    return lessons.filter(l => {
      const match = level === 'beginner'
        ? (l.level === 'beginner' || !l.level)
        : (l.level === 'intermediate' || l.level === 'advanced' || l.level === 'professional')
      
      if (searchQuery) {
        return match && (l.titleAr.includes(searchQuery) || l.title.toLowerCase().includes(searchQuery.toLowerCase()))
      }
      return match
    })
  }

  // Stats
  const stats = {
    kidsCategories: getFilteredCategories('kids').length,
    adultsCategories: getFilteredCategories('adults').length,
    kidsVideos: getFilteredVideos('kids').length,
    adultsVideos: getFilteredVideos('adults').length,
    kidsLessons: getFilteredLessons('beginner').length,
    adultsLessons: getFilteredLessons('advanced').length,
    updates: updates.filter(u => u.isPublished).length,
    notes: notes.length
  }

  // Auth dialog
  if (!isAuthenticated) {
    return (
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-6 h-6 text-amber-500" />
              لوحة تحكم المؤسس
            </DialogTitle>
            <DialogDescription>
              أدخل مفتاح الوصول للدخول إلى لوحة التحكم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="أدخل مفتاح الوصول"
                className="pr-10"
                onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleAuthenticate}
            >
              <LogIn className="w-4 h-4 mr-2" />
              دخول
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Main dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-7 h-7 text-amber-500" />
            لوحة تحكم المؤسس
          </h2>
          <p className="text-gray-500 text-sm">إدارة المحتوى المشترك لجميع المستخدمين</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { hasFetchedData.current = false; fetchAllData() }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-rose-600 border-rose-300 hover:bg-rose-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            خروج
          </Button>
        </div>
      </div>

      {/* Main Sections Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.button
          onClick={() => { setMainSection('kids'); setContentType('categories') }}
          className={cn(
            "relative p-6 rounded-2xl border-2 transition-all overflow-hidden",
            mainSection === 'kids' 
              ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-lg"
              : "border-gray-200 dark:border-gray-700 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative z-10">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto",
              mainSection === 'kids' ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gray-100 dark:bg-gray-800"
            )}>
              <Baby className="w-7 h-7 text-white" />
            </div>
            <h3 className={cn(
              "text-lg font-bold text-center",
              mainSection === 'kids' ? "text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"
            )}>
              الأشبال
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1">تعليم الأشبال</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">{stats.kidsCategories} فئة</Badge>
              <Badge variant="outline" className="text-xs">{stats.kidsVideos} فيديو</Badge>
            </div>
          </div>
          {mainSection === 'kids' && (
            <div className="absolute top-2 left-2">
              <Check className="w-5 h-5 text-amber-500" />
            </div>
          )}
        </motion.button>

        <motion.button
          onClick={() => { setMainSection('adults'); setContentType('categories') }}
          className={cn(
            "relative p-6 rounded-2xl border-2 transition-all overflow-hidden",
            mainSection === 'adults' 
              ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-lg"
              : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative z-10">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto",
              mainSection === 'adults' ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gray-100 dark:bg-gray-800"
            )}>
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h3 className={cn(
              "text-lg font-bold text-center",
              mainSection === 'adults' ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"
            )}>
              الكبار
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1">تعليم الكبار</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">{stats.adultsCategories} فئة</Badge>
              <Badge variant="outline" className="text-xs">{stats.adultsVideos} فيديو</Badge>
            </div>
          </div>
          {mainSection === 'adults' && (
            <div className="absolute top-2 left-2">
              <Check className="w-5 h-5 text-indigo-500" />
            </div>
          )}
        </motion.button>

        <motion.button
          onClick={() => { setMainSection('interactive') }}
          className={cn(
            "relative p-6 rounded-2xl border-2 transition-all overflow-hidden",
            mainSection === 'interactive' 
              ? "border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 shadow-lg"
              : "border-gray-200 dark:border-gray-700 hover:border-cyan-300 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative z-10">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto",
              mainSection === 'interactive' ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gray-100 dark:bg-gray-800"
            )}>
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className={cn(
              "text-lg font-bold text-center",
              mainSection === 'interactive' ? "text-cyan-700 dark:text-cyan-300" : "text-gray-700 dark:text-gray-300"
            )}>
              التفاعلية
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1">ألعاب واختبارات</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">ألعاب</Badge>
              <Badge variant="outline" className="text-xs">اختبارات</Badge>
            </div>
          </div>
          {mainSection === 'interactive' && (
            <div className="absolute top-2 left-2">
              <Check className="w-5 h-5 text-cyan-500" />
            </div>
          )}
        </motion.button>

        <motion.button
          onClick={() => { setMainSection('general'); setContentType('announcements') }}
          className={cn(
            "relative p-6 rounded-2xl border-2 transition-all overflow-hidden",
            mainSection === 'general' 
              ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 shadow-lg"
              : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative z-10">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto",
              mainSection === 'general' ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gray-100 dark:bg-gray-800"
            )}>
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className={cn(
              "text-lg font-bold text-center",
              mainSection === 'general' ? "text-emerald-700 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300"
            )}>
              عام
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1">إعلانات وملاحظات</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">{stats.updates} إعلان</Badge>
              <Badge variant="outline" className="text-xs">{stats.notes} ملاحظة</Badge>
            </div>
          </div>
          {mainSection === 'general' && (
            <div className="absolute top-2 left-2">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {/* Kids Section */}
        {mainSection === 'kids' && (
          <motion.div
            key="kids-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Sub-tabs for Kids */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'categories', label: 'الفئات', icon: Tag, count: stats.kidsCategories },
                { id: 'videos', label: 'الفيديوهات', icon: Video, count: stats.kidsVideos },
                { id: 'lessons', label: 'الدروس', icon: BookOpen, count: stats.kidsLessons }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={contentType === tab.id ? 'default' : 'outline'}
                  className={cn(
                    "flex items-center gap-2",
                    contentType === tab.id && "bg-gradient-to-r from-amber-500 to-orange-500"
                  )}
                  onClick={() => setContentType(tab.id as ContentType)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <Badge variant="secondary" className="ml-1">{tab.count}</Badge>
                </Button>
              ))}
            </div>

            {/* Kids Categories */}
            {contentType === 'categories' && (
              <Card className="border-2 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-amber-500" />
                      فئات الأشبال
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={async () => {
                          try {
                            setIsLoading(true)
                            let addedCount = 0
                            let updatedCount = 0
                            
                            for (const cat of DEFAULT_KIDS_CATEGORIES) {
                              const response = await fetch('/api/admin/categories', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: cat.id,
                                  name: cat.name,
                                  nameAr: cat.nameAr,
                                  icon: cat.icon,
                                  color: cat.color,
                                  type: 'kids',
                                  order: cat.order,
                                  isActive: true
                                })
                              })
                              if (response.ok) {
                                const data = await response.json()
                                // Check if it was created or updated
                                if (data.createdAt === data.updatedAt) {
                                  addedCount++
                                } else {
                                  updatedCount++
                                }
                              }
                            }
                            
                            if (addedCount > 0 || updatedCount > 0) {
                              toast.success(`تم تحديث الفئات (${addedCount} جديدة، ${updatedCount} محدثة)`)
                            } else {
                              toast.info('تم التحقق من الفئات')
                            }
                            
                            // Refresh data
                            hasFetchedData.current = false
                            await fetchAllData()
                          } catch (error) {
                            console.error('Error updating categories:', error)
                            toast.error('حدث خطأ في تحديث الفئات')
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        تحديث الفئات
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-500"
                        onClick={() => {
                          resetCategoryForm()
                          setCategoryForm({ ...categoryForm, type: 'kids' })
                          setEditingItem(null)
                          setEditingType('category')
                          setShowAddDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة فئة
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {getFilteredCategories('kids').map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className={cn(
                          "group transition-all hover:shadow-md",
                          !category.isActive && "opacity-60"
                        )}>
                          <CardContent className="p-3">
                            <div 
                              className="h-1.5 rounded-t-lg mb-2 -mx-3 -mt-3"
                              style={{ backgroundColor: category.color || '#F59E0B' }}
                            />
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                style={{ backgroundColor: (category.color || '#F59E0B') + '30' }}
                              >
                                {category.icon || '📁'}
                              </div>
                              <div className="flex items-center gap-1">
                                {category.isDefault && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 border-amber-300 text-amber-600">
                                    أساسية
                                  </Badge>
                                )}
                                <Badge className={cn(
                                  "text-[10px]",
                                  category.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                )}>
                                  {category.isActive ? 'نشط' : 'معطل'}
                                </Badge>
                              </div>
                            </div>
                            <h4 className="font-medium text-sm truncate">{category.nameAr}</h4>
                            <p className="text-xs text-gray-500 truncate">{category.name}</p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={async () => {
                                    const allCats = getFilteredCategories('kids')
                                    if (index > 0) {
                                      const prevCat = allCats[index - 1]
                                      try {
                                        // Ensure both categories exist in DB
                                        if (!category.existsInDb) {
                                          await ensureCategoryInDb(category, 'kids')
                                        }
                                        if (!prevCat.existsInDb) {
                                          await ensureCategoryInDb(prevCat, 'kids')
                                        }
                                        await fetch(`/api/admin/categories/${category.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order: prevCat.order })
                                        })
                                        await fetch(`/api/admin/categories/${prevCat.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order: category.order })
                                        })
                                        hasFetchedData.current = false
                                        fetchAllData()
                                        toast.success('تم تحديث الترتيب')
                                      } catch (error) {
                                        toast.error('حدث خطأ')
                                      }
                                    }
                                  }}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={async () => {
                                    const allCats = getFilteredCategories('kids')
                                    if (index < allCats.length - 1) {
                                      const nextCat = allCats[index + 1]
                                      try {
                                        // Ensure both categories exist in DB
                                        if (!category.existsInDb) {
                                          await ensureCategoryInDb(category, 'kids')
                                        }
                                        if (!nextCat.existsInDb) {
                                          await ensureCategoryInDb(nextCat, 'kids')
                                        }
                                        await fetch(`/api/admin/categories/${category.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order: nextCat.order })
                                        })
                                        await fetch(`/api/admin/categories/${nextCat.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order: category.order })
                                        })
                                        hasFetchedData.current = false
                                        fetchAllData()
                                        toast.success('تم تحديث الترتيب')
                                      } catch (error) {
                                        toast.error('حدث خطأ')
                                      }
                                    }
                                  }}
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={async () => {
                                    try {
                                      // Ensure category exists in DB
                                      if (!category.existsInDb) {
                                        await ensureCategoryInDb(category, 'kids')
                                      }
                                      await fetch(`/api/admin/categories/${category.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ isActive: !category.isActive })
                                      })
                                      hasFetchedData.current = false
                                      fetchAllData()
                                      toast.success(category.isActive ? 'تم تعطيل الفئة' : 'تم تفعيل الفئة')
                                    } catch (error) {
                                      toast.error('حدث خطأ')
                                    }
                                  }}
                                >
                                  {category.isActive ? (
                                    <Eye className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <EyeOff className="w-3 h-3 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={async () => {
                                    // Ensure category exists in DB before editing
                                    if (!category.existsInDb) {
                                      await ensureCategoryInDb(category, 'kids')
                                    }
                                    setCategoryForm(category)
                                    setEditingItem(category)
                                    setEditingType('category')
                                    setShowAddDialog(true)
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 text-rose-500"
                                  onClick={async () => {
                                    // Ensure category exists in DB before deleting
                                    if (!category.existsInDb) {
                                      const created = await ensureCategoryInDb(category, 'kids')
                                      if (!created) {
                                        toast.error('فشل في إنشاء الفئة في قاعدة البيانات')
                                        return
                                      }
                                    }
                                    // Small delay to ensure database is updated
                                    await new Promise(resolve => setTimeout(resolve, 100))
                                    handleDeleteCategory(category.id, category.isDefault)
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Kids Videos */}
            {contentType === 'videos' && (
              <Card className="border-2 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-amber-500" />
                      فيديوهات الأشبال
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={selectedVideoCategory} onValueChange={setSelectedVideoCategory}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الفئات</SelectItem>
                          {getFilteredCategories('kids').map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-500"
                        onClick={() => {
                          resetVideoForm()
                          setVideoForm({ ...videoForm, ageGroup: '5-7', difficulty: 'easy', category: selectedVideoCategory !== 'all' ? selectedVideoCategory : 'alphabet' })
                          setEditingItem(null)
                          setEditingType('video')
                          setShowAddDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة فيديو
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {getFilteredVideos('kids', selectedVideoCategory).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد فيديوهات {selectedVideoCategory !== 'all' ? 'في هذه الفئة' : 'للأشبال'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredVideos('kids', selectedVideoCategory).map((video, index, videosArray) => (
                        <Card key={video.id} className="overflow-hidden group">
                          <div className="flex items-center gap-4 p-3">
                            {/* أزرار الترتيب */}
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                disabled={index === 0}
                                onClick={() => handleReorderVideos(video.id, 'up', 'kids', selectedVideoCategory)}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                disabled={index === videosArray.length - 1}
                                onClick={() => handleReorderVideos(video.id, 'down', 'kids', selectedVideoCategory)}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {/* صورة الفيديو */}
                            <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                              {video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.titleAr} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
                                  <Video className="w-6 h-6 text-white opacity-50" />
                                </div>
                              )}
                            </div>
                            
                            {/* معلومات الفيديو */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{video.titleAr}</h4>
                              <p className="text-xs text-gray-500 truncate">{video.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{video.category}</Badge>
                                <span className="text-xs text-gray-400">{formatDuration(video.duration)}</span>
                              </div>
                            </div>
                            
                            {/* أزرار التعديل والحذف */}
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8"
                                onClick={() => {
                                  setVideoForm(video)
                                  setEditingItem(video)
                                  setEditingType('video')
                                  setShowAddDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-rose-500"
                                onClick={() => handleDeleteVideo(video.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Kids Lessons */}
            {contentType === 'lessons' && (
              <Card className="border-2 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-amber-500" />
                      دروس الأشبال
                    </CardTitle>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-orange-500"
                      onClick={() => {
                        resetLessonForm()
                        setLessonForm({ ...lessonForm, level: 'beginner' })
                        setEditingItem(null)
                        setEditingType('lesson')
                        setShowAddDialog(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة درس
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {getFilteredLessons('beginner').length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد دروس للأشبال</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getFilteredLessons('beginner').map((lesson) => (
                        <Card key={lesson.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{lesson.titleAr}</h4>
                              <p className="text-sm text-gray-500">{lesson.title}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{lesson.category}</Badge>
                                <Badge variant="outline">{lesson.duration} دقيقة</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setLessonForm(lesson)
                                  setEditingItem(lesson)
                                  setEditingType('lesson')
                                  setShowAddDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-rose-500"
                                onClick={() => handleDeleteLesson(lesson.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Adults Section */}
        {mainSection === 'adults' && (
          <motion.div
            key="adults-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Sub-tabs for Adults */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'categories', label: 'الفئات', icon: Tag, count: stats.adultsCategories },
                { id: 'videos', label: 'الفيديوهات', icon: Video, count: stats.adultsVideos },
                { id: 'lessons', label: 'الدروس', icon: BookOpen, count: stats.adultsLessons }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={contentType === tab.id ? 'default' : 'outline'}
                  className={cn(
                    "flex items-center gap-2",
                    contentType === tab.id && "bg-gradient-to-r from-indigo-500 to-purple-500"
                  )}
                  onClick={() => setContentType(tab.id as ContentType)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <Badge variant="secondary" className="ml-1">{tab.count}</Badge>
                </Button>
              ))}
            </div>

            {/* Adults Categories */}
            {contentType === 'categories' && (
              <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-500" />
                      فئات الكبار
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={async () => {
                          try {
                            setIsLoading(true)
                            let addedCount = 0
                            let updatedCount = 0
                            
                            for (const cat of DEFAULT_ADULTS_CATEGORIES) {
                              const response = await fetch('/api/admin/categories', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: cat.id,
                                  name: cat.name,
                                  nameAr: cat.nameAr,
                                  icon: cat.icon,
                                  color: cat.color,
                                  type: 'adults',
                                  order: cat.order,
                                  isActive: true
                                })
                              })
                              if (response.ok) {
                                const data = await response.json()
                                // Check if it was created or updated
                                if (data.createdAt === data.updatedAt) {
                                  addedCount++
                                } else {
                                  updatedCount++
                                }
                              }
                            }
                            
                            if (addedCount > 0 || updatedCount > 0) {
                              toast.success(`تم تحديث الفئات (${addedCount} جديدة، ${updatedCount} محدثة)`)
                            } else {
                              toast.info('تم التحقق من الفئات')
                            }
                            
                            // Refresh data
                            hasFetchedData.current = false
                            await fetchAllData()
                          } catch (error) {
                            console.error('Error updating categories:', error)
                            toast.error('حدث خطأ في تحديث الفئات')
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        تحديث الفئات
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-purple-500"
                        onClick={() => {
                          resetCategoryForm()
                          setCategoryForm({ ...categoryForm, type: 'adults' })
                          setEditingItem(null)
                          setEditingType('category')
                          setShowAddDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة فئة
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getFilteredCategories('adults').map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={cn(
                          "group transition-all hover:shadow-md",
                          !category.isActive && "opacity-60"
                        )}>
                          <CardContent className="p-3">
                            <div 
                              className="h-1.5 rounded-t-lg mb-2 -mx-3 -mt-3"
                              style={{ backgroundColor: category.color || '#6366F1' }}
                            />
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                style={{ backgroundColor: (category.color || '#6366F1') + '30' }}
                              >
                                {category.icon || '📁'}
                              </div>
                              <div className="flex items-center gap-1">
                                {category.isDefault && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 border-indigo-300 text-indigo-600">
                                    أساسية
                                  </Badge>
                                )}
                                <Badge className={cn(
                                  "text-[10px]",
                                  category.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                )}>
                                  {category.isActive ? 'نشط' : 'معطل'}
                                </Badge>
                              </div>
                            </div>
                            <h4 className="font-medium text-sm truncate">{category.nameAr}</h4>
                            <p className="text-xs text-gray-500 truncate">{category.name}</p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={async () => {
                                    const allCats = getFilteredCategories('adults')
                                    if (index > 0) {
                                      const prevCat = allCats[index - 1]
                                      try {
                                        // Ensure both categories exist in DB
                                        if (!category.existsInDb) {
                                          await ensureCategoryInDb(category, 'adults')
                                        }
                                        if (!prevCat.existsInDb) {
                                          await ensureCategoryInDb(prevCat, 'adults')
                                        }
                                        await fetch(`/api/admin/categories/${category.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order: prevCat.order })
                                        })
                                        await fetch(`/api/admin/categories/${prevCat.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order: category.order })
                                        })
                                        hasFetchedData.current = false
                                        fetchAllData()
                                        toast.success('تم تحديث الترتيب')
                                      } catch (error) {
                                        toast.error('حدث خطأ')
                                      }
                                    }
                                  }}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={async () => {
                                    const allCats = getFilteredCategories('adults')
                                    if (index < allCats.length - 1) {
                                      const nextCat = allCats[index + 1]
                                      try {
                                        // Ensure both categories exist in DB
                                        if (!category.existsInDb) {
                                          await ensureCategoryInDb(category, 'adults')
                                        }
                                        if (!nextCat.existsInDb) {
                                          await ensureCategoryInDb(nextCat, 'adults')
                                        }
                                        await fetch(`/api/admin/categories/${category.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order: nextCat.order })
                                        })
                                        await fetch(`/api/admin/categories/${nextCat.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order: category.order })
                                        })
                                        hasFetchedData.current = false
                                        fetchAllData()
                                        toast.success('تم تحديث الترتيب')
                                      } catch (error) {
                                        toast.error('حدث خطأ')
                                      }
                                    }
                                  }}
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={async () => {
                                    try {
                                      // Ensure category exists in DB
                                      if (!category.existsInDb) {
                                        await ensureCategoryInDb(category, 'adults')
                                      }
                                      await fetch(`/api/admin/categories/${category.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ isActive: !category.isActive })
                                      })
                                      hasFetchedData.current = false
                                      fetchAllData()
                                      toast.success(category.isActive ? 'تم تعطيل الفئة' : 'تم تفعيل الفئة')
                                    } catch (error) {
                                      toast.error('حدث خطأ')
                                    }
                                  }}
                                >
                                  {category.isActive ? (
                                    <Eye className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <EyeOff className="w-3 h-3 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={async () => {
                                    // Ensure category exists in DB before editing
                                    if (!category.existsInDb) {
                                      await ensureCategoryInDb(category, 'adults')
                                    }
                                    setCategoryForm(category)
                                    setEditingItem(category)
                                    setEditingType('category')
                                    setShowAddDialog(true)
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 text-rose-500"
                                  onClick={async () => {
                                    // Ensure category exists in DB before deleting
                                    if (!category.existsInDb) {
                                      const created = await ensureCategoryInDb(category, 'adults')
                                      if (!created) {
                                        toast.error('فشل في إنشاء الفئة في قاعدة البيانات')
                                        return
                                      }
                                    }
                                    // Small delay to ensure database is updated
                                    await new Promise(resolve => setTimeout(resolve, 100))
                                    handleDeleteCategory(category.id, category.isDefault)
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Adults Videos */}
            {contentType === 'videos' && (
              <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-indigo-500" />
                      فيديوهات الكبار
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={selectedVideoCategory} onValueChange={setSelectedVideoCategory}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الفئات</SelectItem>
                          {getFilteredCategories('adults').map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-purple-500"
                        onClick={() => {
                          resetVideoForm()
                          setVideoForm({ ...videoForm, ageGroup: 'adults', difficulty: 'medium', category: selectedVideoCategory !== 'all' ? selectedVideoCategory : 'business' })
                          setEditingItem(null)
                          setEditingType('video')
                          setShowAddDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة فيديو
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {getFilteredVideos('adults', selectedVideoCategory).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد فيديوهات {selectedVideoCategory !== 'all' ? 'في هذه الفئة' : 'للكبار'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredVideos('adults', selectedVideoCategory).map((video, index, videosArray) => (
                        <Card key={video.id} className="overflow-hidden group">
                          <div className="flex items-center gap-4 p-3">
                            {/* أزرار الترتيب */}
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                disabled={index === 0}
                                onClick={() => handleReorderVideos(video.id, 'up', 'adults', selectedVideoCategory)}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                disabled={index === videosArray.length - 1}
                                onClick={() => handleReorderVideos(video.id, 'down', 'adults', selectedVideoCategory)}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {/* صورة الفيديو */}
                            <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                              {video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.titleAr} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                                  <Video className="w-6 h-6 text-white opacity-50" />
                                </div>
                              )}
                            </div>
                            
                            {/* معلومات الفيديو */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{video.titleAr}</h4>
                              <p className="text-xs text-gray-500 truncate">{video.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{video.category}</Badge>
                                <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">
                                  {video.difficulty === 'expert' ? 'خبير' : video.difficulty === 'hard' ? 'صعب' : 'متوسط'}
                                </Badge>
                                <span className="text-xs text-gray-400">{formatDuration(video.duration)}</span>
                              </div>
                            </div>
                            
                            {/* أزرار التعديل والحذف */}
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8"
                                onClick={() => {
                                  setVideoForm(video)
                                  setEditingItem(video)
                                  setEditingType('video')
                                  setShowAddDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-rose-500"
                                onClick={() => handleDeleteVideo(video.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Adults Lessons */}
            {contentType === 'lessons' && (
              <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                      دروس الكبار
                    </CardTitle>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-500 to-purple-500"
                      onClick={() => {
                        resetLessonForm()
                        setLessonForm({ ...lessonForm, level: 'intermediate' })
                        setEditingItem(null)
                        setEditingType('lesson')
                        setShowAddDialog(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة درس
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {getFilteredLessons('advanced').length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد دروس للكبار</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getFilteredLessons('advanced').map((lesson) => (
                        <Card key={lesson.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{lesson.titleAr}</h4>
                              <p className="text-sm text-gray-500">{lesson.title}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{lesson.category}</Badge>
                                <Badge variant="outline">{lesson.level}</Badge>
                                <Badge variant="outline">{lesson.duration} دقيقة</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setLessonForm(lesson)
                                  setEditingItem(lesson)
                                  setEditingType('lesson')
                                  setShowAddDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-rose-500"
                                onClick={() => handleDeleteLesson(lesson.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Interactive Section - Games, Quizzes, Flashcards */}
        {mainSection === 'interactive' && (
          <motion.div
            key="interactive-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GamesQuizzesManager />
          </motion.div>
        )}

        {/* General Section */}
        {mainSection === 'general' && (
          <motion.div
            key="general-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Sub-tabs for General */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'announcements', label: 'الإعلانات', icon: Bell, count: stats.updates },
                { id: 'notes', label: 'الملاحظات', icon: FileText, count: stats.notes }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={contentType === tab.id ? 'default' : 'outline'}
                  className={cn(
                    "flex items-center gap-2",
                    contentType === tab.id && "bg-gradient-to-r from-emerald-500 to-teal-500"
                  )}
                  onClick={() => setContentType(tab.id as ContentType)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <Badge variant="secondary" className="ml-1">{tab.count}</Badge>
                </Button>
              ))}
            </div>

            {/* Announcements */}
            {contentType === 'announcements' && (
              <Card className="border-2 border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-emerald-500" />
                      الإعلانات
                    </CardTitle>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500"
                      onClick={() => {
                        resetUpdateForm()
                        setEditingItem(null)
                        setEditingType('update')
                        setShowAddDialog(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة إعلان
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {updates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد إعلانات</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {updates.map((update) => (
                        <Card key={update.id}>
                          <CardContent className="p-4 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{update.titleAr}</h4>
                                <Badge className={cn(
                                  "text-xs",
                                  update.priority === 'high' ? "bg-red-100 text-red-700" :
                                  update.priority === 'low' ? "bg-gray-100 text-gray-700" :
                                  "bg-blue-100 text-blue-700"
                                )}>
                                  {update.priority === 'high' ? 'مهم' : update.priority === 'low' ? 'عادي' : 'متوسط'}
                                </Badge>
                                <Badge className={cn(
                                  "text-xs",
                                  update.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                )}>
                                  {update.isPublished ? 'منشور' : 'مسودة'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2">{update.content}</p>
                              <p className="text-xs text-gray-400 mt-2">{formatDate(update.createdAt)}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setUpdateForm(update)
                                  setEditingItem(update)
                                  setEditingType('update')
                                  setShowAddDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-rose-500"
                                onClick={() => handleDeleteUpdate(update.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {contentType === 'notes' && (
              <Card className="border-2 border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      الملاحظات
                    </CardTitle>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500"
                      onClick={() => {
                        resetNoteForm()
                        setEditingItem(null)
                        setEditingType('note')
                        setShowAddDialog(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة ملاحظة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {notes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد ملاحظات</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {notes.map((note) => (
                        <Card 
                          key={note.id} 
                          className="overflow-hidden"
                          style={{ borderRightWidth: '4px', borderRightColor: note.color }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{note.title}</h4>
                              {note.isPinned && (
                                <Badge className="text-xs bg-amber-100 text-amber-700">مثبت</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3">{note.content}</p>
                            <div className="flex items-center justify-between mt-3 pt-2 border-t">
                              <p className="text-xs text-gray-400">{formatDate(note.createdAt)}</p>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={() => {
                                    setNoteForm(note)
                                    setEditingItem(note)
                                    setEditingType('note')
                                    setShowAddDialog(true)
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 text-rose-500"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'تعديل' : 'إضافة'} {
                editingType === 'video' ? 'فيديو' :
                editingType === 'lesson' ? 'درس' :
                editingType === 'category' ? 'فئة' :
                editingType === 'update' ? 'إعلان' :
                editingType === 'note' ? 'ملاحظة' : ''
              }
            </DialogTitle>
          </DialogHeader>
          
          {/* Video Form */}
          {(editingType === 'video' || (mainSection === 'kids' && contentType === 'videos' && !editingType) || (mainSection === 'adults' && contentType === 'videos' && !editingType)) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العنوان بالعربية *</Label>
                  <Input
                    value={videoForm.titleAr || ''}
                    onChange={(e) => setVideoForm({ ...videoForm, titleAr: e.target.value })}
                    placeholder="العنوان بالعربية"
                  />
                </div>
                <div>
                  <Label>العنوان بالإنجليزية *</Label>
                  <Input
                    value={videoForm.title || ''}
                    onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                    placeholder="Title in English"
                  />
                </div>
              </div>
              
              <div>
                <Label>رابط الفيديو *</Label>
                <div className="flex gap-2">
                  <Input
                    value={videoForm.url || ''}
                    onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchYouTubeInfo(videoForm.url || '')}
                    disabled={isFetchingVideoInfo || !videoForm.url}
                    className="shrink-0"
                  >
                    {isFetchingVideoInfo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">أدخل رابط يوتيوب واضغط على الزر لاستخراج المعلومات تلقائياً</p>
              </div>
              
              {/* Video Preview */}
              {videoPreview && (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={videoPreview.thumbnail} 
                    alt="Video preview" 
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-sm truncate">{videoPreview.title}</p>
                  </div>
                </div>
              )}
              
              <div>
                <Label>صورة مصغرة</Label>
                <Input
                  value={videoForm.thumbnail || ''}
                  onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                  placeholder="رابط الصورة المصغرة (يتم استخراجها تلقائياً)"
                />
                {videoForm.thumbnail && (
                  <img 
                    src={videoForm.thumbnail} 
                    alt="Thumbnail preview" 
                    className="mt-2 rounded-lg w-32 h-20 object-cover border"
                  />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الفئة</Label>
                  <Select
                    value={videoForm.category || ''}
                    onValueChange={(v) => setVideoForm({ ...videoForm, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredCategories(mainSection === 'adults' ? 'adults' : 'kids').map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>النوع</Label>
                  <Select
                    value={videoForm.type || 'video'}
                    onValueChange={(v) => setVideoForm({ ...videoForm, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">فيديو</SelectItem>
                      <SelectItem value="song">أغنية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المستوى</Label>
                  <Select
                    value={videoForm.difficulty || 'easy'}
                    onValueChange={(v) => setVideoForm({ ...videoForm, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">سهل</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="hard">صعب</SelectItem>
                      <SelectItem value="expert">خبير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المدة (بالثواني)</Label>
                  <Input
                    type="number"
                    value={videoForm.duration || 0}
                    onChange={(e) => setVideoForm({ ...videoForm, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="videoActive"
                  checked={videoForm.isActive ?? true}
                  onChange={(e) => setVideoForm({ ...videoForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="videoActive">نشط</Label>
              </div>
              
              {/* Auto-analyze toggle */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoAnalyze"
                    checked={autoAnalyze}
                    onChange={(e) => setAutoAnalyze(e.target.checked)}
                    className="rounded w-5 h-5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="autoAnalyze" className="flex items-center gap-2 cursor-pointer">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">تحليل تلقائي باستخدام الذكاء الاصطناعي</span>
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      استخراج تلقائي للاختبارات والألعاب والبطاقات التعليمية من محتوى الفيديو
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleSaveVideo}
                disabled={isSaving || isAnalyzing}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                 isAnalyzing ? <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> : 
                 <Save className="w-4 h-4 mr-2" />}
                {isAnalyzing ? 'جاري التحليل...' : 'حفظ'}
              </Button>
            </div>
          )}
          
          {/* Lesson Form */}
          {(editingType === 'lesson' || (contentType === 'lessons' && !editingType)) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العنوان بالعربية *</Label>
                  <Input
                    value={lessonForm.titleAr || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, titleAr: e.target.value })}
                    placeholder="العنوان بالعربية"
                  />
                </div>
                <div>
                  <Label>العنوان بالإنجليزية *</Label>
                  <Input
                    value={lessonForm.title || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="Title in English"
                  />
                </div>
              </div>
              
              <div>
                <Label>المحتوى *</Label>
                <Textarea
                  value={lessonForm.content || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="محتوى الدرس"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الفئة</Label>
                  <Select
                    value={lessonForm.category || ''}
                    onValueChange={(v) => setLessonForm({ ...lessonForm, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredCategories(mainSection === 'adults' ? 'adults' : 'kids').map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المستوى</Label>
                  <Select
                    value={lessonForm.level || 'beginner'}
                    onValueChange={(v) => setLessonForm({ ...lessonForm, level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">مبتدئ</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="advanced">متقدم</SelectItem>
                      <SelectItem value="professional">محترف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>المدة (بالدقائق)</Label>
                <Input
                  type="number"
                  value={lessonForm.duration || 15}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 15 })}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lessonActive"
                  checked={lessonForm.isActive ?? true}
                  onChange={(e) => setLessonForm({ ...lessonForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="lessonActive">نشط</Label>
              </div>
              
              <Button
                className="w-full"
                onClick={handleSaveLesson}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                حفظ
              </Button>
            </div>
          )}
          
          {/* Category Form */}
          {(editingType === 'category' || (contentType === 'categories' && !editingType)) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الاسم بالعربية *</Label>
                  <Input
                    value={categoryForm.nameAr || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                    placeholder="الاسم بالعربية"
                  />
                </div>
                <div>
                  <Label>الاسم بالإنجليزية *</Label>
                  <Input
                    value={categoryForm.name || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Name in English"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الأيقونة (إيموجي)</Label>
                  <Input
                    value={categoryForm.icon || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    placeholder="📁"
                  />
                </div>
                <div>
                  <Label>اللون</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={categoryForm.color || '#10B981'}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={categoryForm.color || '#10B981'}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label>النوع</Label>
                <Select
                  value={categoryForm.type || mainSection}
                  onValueChange={(v) => setCategoryForm({ ...categoryForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kids">الأشبال</SelectItem>
                    <SelectItem value="adults">الكبار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={categoryForm.isActive ?? true}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="categoryActive">نشط</Label>
              </div>
              
              <Button
                className="w-full"
                onClick={handleSaveCategory}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                حفظ
              </Button>
            </div>
          )}
          
          {/* Update Form */}
          {(editingType === 'update' || (contentType === 'announcements' && !editingType)) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العنوان بالعربية *</Label>
                  <Input
                    value={updateForm.titleAr || ''}
                    onChange={(e) => setUpdateForm({ ...updateForm, titleAr: e.target.value })}
                    placeholder="العنوان بالعربية"
                  />
                </div>
                <div>
                  <Label>العنوان بالإنجليزية</Label>
                  <Input
                    value={updateForm.title || ''}
                    onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                    placeholder="Title in English"
                  />
                </div>
              </div>
              
              <div>
                <Label>المحتوى *</Label>
                <Textarea
                  value={updateForm.content || ''}
                  onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                  placeholder="محتوى الإعلان"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الأولوية</Label>
                  <Select
                    value={updateForm.priority || 'normal'}
                    onValueChange={(v) => setUpdateForm({ ...updateForm, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">عادي</SelectItem>
                      <SelectItem value="normal">متوسط</SelectItem>
                      <SelectItem value="high">مهم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>النوع</Label>
                  <Select
                    value={updateForm.type || 'update'}
                    onValueChange={(v) => setUpdateForm({ ...updateForm, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="update">تحديث</SelectItem>
                      <SelectItem value="announcement">إعلان</SelectItem>
                      <SelectItem value="news">خبر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="updatePublished"
                  checked={updateForm.isPublished ?? true}
                  onChange={(e) => setUpdateForm({ ...updateForm, isPublished: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="updatePublished">نشر</Label>
              </div>
              
              <Button
                className="w-full"
                onClick={handleSaveUpdate}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                حفظ
              </Button>
            </div>
          )}
          
          {/* Note Form */}
          {(editingType === 'note' || (contentType === 'notes' && !editingType)) && (
            <div className="space-y-4">
              <div>
                <Label>العنوان *</Label>
                <Input
                  value={noteForm.title || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="عنوان الملاحظة"
                />
              </div>
              
              <div>
                <Label>المحتوى *</Label>
                <Textarea
                  value={noteForm.content || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="محتوى الملاحظة"
                  rows={4}
                />
              </div>
              
              <div>
                <Label>اللون</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={noteForm.color || '#10B981'}
                    onChange={(e) => setNoteForm({ ...noteForm, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={noteForm.color || '#10B981'}
                    onChange={(e) => setNoteForm({ ...noteForm, color: e.target.value })}
                    placeholder="#10B981"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notePinned"
                  checked={noteForm.isPinned || false}
                  onChange={(e) => setNoteForm({ ...noteForm, isPinned: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="notePinned">تثبيت</Label>
              </div>
              
              <Button
                className="w-full"
                onClick={handleSaveNote}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                حفظ
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
