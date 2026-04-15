'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  List, Plus, Search, MoreVertical, Trash2, Edit, Copy, Share2,
  Eye, EyeOff, BookOpen, Users, Clock, Tag, Check, X, Filter,
  Download, Upload, Star, Lock, Globe, BookMarked, ChevronLeft,
  GripVertical, Play, Shuffle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useVocabStore, type Word } from '@/store/vocab-store'

interface CustomListType {
  id: string
  name: string
  nameAr?: string
  description?: string
  color: string
  icon?: string
  isPublic: boolean
  isTemplate: boolean
  tags: string
  wordCount: number
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name?: string
    avatar?: string
  }
  listWords?: {
    id: string
    wordId: string
    order: number
    notes?: string
    word: Word
  }[]
}

interface CustomListsProps {
  onStartReview?: (words: Word[]) => void
}

const listColors = [
  '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#14B8A6', '#F97316'
]

const defaultTemplates = [
  { name: 'TOEFL Essentials', nameAr: 'أساسيات TOEFL', icon: '🎓', color: '#3B82F6', description: 'الكلمات الأساسية لاختبار TOEFL' },
  { name: 'IELTS Vocabulary', nameAr: 'مفردات IELTS', icon: '📚', color: '#EF4444', description: 'مفردات اختبار IELTS' },
  { name: 'Business English', nameAr: 'الإنجليزية للأعمال', icon: '💼', color: '#8B5CF6', description: 'مفردات الأعمال والتجارة' },
  { name: 'Daily Conversation', nameAr: 'المحادثات اليومية', icon: '💬', color: '#10B981', description: 'كلمات المحادثات اليومية' },
  { name: 'Academic Writing', nameAr: 'الكتابة الأكاديمية', icon: '✍️', color: '#F59E0B', description: 'مفردات الكتابة الأكاديمية' },
  { name: 'Travel & Tourism', nameAr: 'السفر والسياحة', icon: '✈️', color: '#EC4899', description: 'مفردات السفر والسياحة' },
]

export function CustomLists({ onStartReview }: CustomListsProps) {
  const { words, currentUserId, categories } = useVocabStore()
  const [lists, setLists] = useState<CustomListType[]>([])
  const [publicLists, setPublicLists] = useState<CustomListType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'my' | 'public' | 'templates'>('my')
  
  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<CustomListType | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    color: '#10B981',
    icon: '📚',
    isPublic: false,
    tags: [] as string[],
    selectedWords: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')

  // Fetch lists
  const fetchLists = useCallback(async () => {
    if (!currentUserId) return
    setIsLoading(true)
    try {
      const [myRes, publicRes] = await Promise.all([
        fetch(`/api/custom-lists?userId=${currentUserId}`),
        fetch('/api/custom-lists?public=true')
      ])
      
      if (myRes.ok) {
        const data = await myRes.json()
        setLists(data.lists)
      }
      
      if (publicRes.ok) {
        const data = await publicRes.json()
        setPublicLists(data.lists.filter((l: CustomListType) => l.userId !== currentUserId))
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      toast.error('فشل في تحميل القوائم')
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  // Filter lists
  const filteredLists = (activeTab === 'my' ? lists : publicLists).filter(list => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return list.name.toLowerCase().includes(query) ||
             list.nameAr?.toLowerCase().includes(query) ||
             list.description?.toLowerCase().includes(query)
    }
    return true
  })

  // Create list
  const handleCreateList = async () => {
    if (!currentUserId || !formData.name) {
      toast.error('الرجاء إدخال اسم القائمة')
      return
    }

    try {
      const res = await fetch('/api/custom-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          ...formData,
          wordIds: formData.selectedWords
        })
      })

      if (res.ok) {
        toast.success('تم إنشاء القائمة بنجاح')
        setIsCreateDialogOpen(false)
        resetForm()
        fetchLists()
      } else {
        throw new Error('Failed to create list')
      }
    } catch {
      toast.error('فشل في إنشاء القائمة')
    }
  }

  // Update list
  const handleUpdateList = async () => {
    if (!selectedList || !formData.name) {
      toast.error('الرجاء إدخال اسم القائمة')
      return
    }

    try {
      const res = await fetch(`/api/custom-lists/${selectedList.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          wordIds: formData.selectedWords
        })
      })

      if (res.ok) {
        toast.success('تم تحديث القائمة بنجاح')
        setIsEditDialogOpen(false)
        resetForm()
        fetchLists()
      } else {
        throw new Error('Failed to update list')
      }
    } catch {
      toast.error('فشل في تحديث القائمة')
    }
  }

  // Delete list
  const handleDeleteList = async (listId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القائمة؟')) return

    try {
      const res = await fetch(`/api/custom-lists/${listId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('تم حذف القائمة')
        fetchLists()
      } else {
        throw new Error('Failed to delete list')
      }
    } catch {
      toast.error('فشل في حذف القائمة')
    }
  }

  // Copy list
  const handleCopyList = async (list: CustomListType) => {
    if (!currentUserId) return

    try {
      const res = await fetch('/api/custom-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          name: `${list.name} (نسخة)`,
          nameAr: list.nameAr ? `${list.nameAr} (نسخة)` : undefined,
          description: list.description,
          color: list.color,
          wordIds: list.listWords?.map(lw => lw.wordId) || []
        })
      })

      if (res.ok) {
        toast.success('تم نسخ القائمة')
        fetchLists()
      } else {
        throw new Error('Failed to copy list')
      }
    } catch {
      toast.error('فشل في نسخ القائمة')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      color: '#10B981',
      icon: '📚',
      isPublic: false,
      tags: [],
      selectedWords: []
    })
    setSelectedList(null)
  }

  // Open edit dialog
  const openEditDialog = (list: CustomListType) => {
    setSelectedList(list)
    setFormData({
      name: list.name,
      nameAr: list.nameAr || '',
      description: list.description || '',
      color: list.color,
      icon: list.icon || '📚',
      isPublic: list.isPublic,
      tags: JSON.parse(list.tags || '[]'),
      selectedWords: list.listWords?.map(lw => lw.wordId) || []
    })
    setIsEditDialogOpen(true)
  }

  // Open view dialog
  const openViewDialog = async (list: CustomListType) => {
    try {
      const res = await fetch(`/api/custom-lists/${list.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedList(data.list)
        setIsViewDialogOpen(true)
      }
    } catch {
      toast.error('فشل في تحميل القائمة')
    }
  }

  // Toggle word selection
  const toggleWordSelection = (wordId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedWords: prev.selectedWords.includes(wordId)
        ? prev.selectedWords.filter(id => id !== wordId)
        : [...prev.selectedWords, wordId]
    }))
  }

  // Start review with list words
  const handleStartReview = () => {
    if (selectedList?.listWords && selectedList.listWords.length > 0) {
      const listWords = selectedList.listWords.map(lw => lw.word)
      onStartReview?.(listWords)
      setIsViewDialogOpen(false)
      toast.success('بدء المراجعة!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">القوائم المخصصة</h2>
          <p className="text-gray-500 text-sm">أنشئ قوائم كلمات مخصصة لمختلف الأغراض</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          قائمة جديدة
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {[
          { id: 'my', label: 'قوائمي', icon: List },
          { id: 'public', label: 'القوائم العامة', icon: Globe },
          { id: 'templates', label: 'القوالب', icon: BookMarked }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'my' | 'public' | 'templates')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              activeTab === tab.id
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="ابحث في القوائم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Lists Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
      ) : activeTab === 'templates' ? (
        // Templates View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {defaultTemplates.map((template, index) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="h-2" style={{ background: template.color }} />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">{template.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{template.nameAr}</p>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        name: template.name,
                        nameAr: template.nameAr,
                        color: template.color,
                        icon: template.icon,
                        description: template.description
                      })
                      setIsCreateDialogOpen(true)
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    استخدام القالب
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        // My Lists or Public Lists
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredLists.map((list, index) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="h-2" style={{ background: list.color }} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{list.icon || '📚'}</span>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{list.name}</h3>
                          {list.nameAr && (
                            <p className="text-xs text-gray-500">{list.nameAr}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {activeTab === 'my' && (
                          <>
                            <button
                              onClick={() => openEditDialog(list)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteList(list.id)}
                              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                          </>
                        )}
                        {activeTab === 'public' && (
                          <button
                            onClick={() => handleCopyList(list)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {list.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {list.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {list.wordCount} كلمة
                      </span>
                      {list.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          عامة
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openViewDialog(list)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        عرض
                      </Button>
                      {activeTab === 'my' && list.wordCount > 0 && (
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setSelectedList(list)
                            handleStartReview()
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          مراجعة
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredLists.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              {searchQuery ? 'لا توجد نتائج' : activeTab === 'my' ? 'لم تنشئ أي قوائم بعد' : 'لا توجد قوائم عامة'}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'تعديل القائمة' : 'إنشاء قائمة جديدة'}</DialogTitle>
            <DialogDescription>أنشئ قائمة كلمات مخصصة للمراجعة والتعلم</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم القائمة (English)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Vocabulary List"
                />
              </div>
              <div className="space-y-2">
                <Label>اسم القائمة (عربي)</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="قائمة المفردات"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للقائمة..."
                rows={2}
              />
            </div>

            {/* Color and Icon */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اللون</Label>
                <div className="flex gap-2 flex-wrap">
                  {listColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        formData.color === color && "ring-2 ring-offset-2 ring-gray-400 scale-110"
                      )}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <div className="flex gap-2">
                  {['📚', '📝', '🎯', '💼', '✈️', '🎓', '💡', '⭐'].map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={cn(
                        "w-10 h-10 rounded-lg text-xl transition-all",
                        formData.icon === icon
                          ? "bg-emerald-100 dark:bg-emerald-900/30 scale-110"
                          : "bg-gray-100 dark:bg-gray-800 hover:scale-105"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublic" className="flex items-center gap-2 cursor-pointer">
                <Globe className="w-4 h-4" />
                مشاركة القائمة مع الآخرين
              </Label>
            </div>

            {/* Word Selection */}
            <div className="space-y-2">
              <Label>اختر الكلمات ({formData.selectedWords.length} محددة)</Label>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
                {words.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">لا توجد كلمات</p>
                ) : (
                  words.map(word => (
                    <label
                      key={word.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedWords.includes(word.id)}
                        onChange={() => toggleWordSelection(word.id)}
                        className="rounded"
                      />
                      <span className="font-medium">{word.word}</span>
                      <span className="text-sm text-gray-500">{word.translation}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={isEditDialogOpen ? handleUpdateList : handleCreateList}
              >
                {isEditDialogOpen ? 'حفظ التغييرات' : 'إنشاء القائمة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View List Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedList?.name}</DialogTitle>
            <DialogDescription>
              {selectedList?.description || `${selectedList?.wordCount || 0} كلمة`}
            </DialogDescription>
          </DialogHeader>

          {selectedList?.listWords && selectedList.listWords.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleStartReview}
                >
                  <Play className="w-4 h-4 mr-2" />
                  ابدأ المراجعة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const shuffled = [...selectedList.listWords!].sort(() => Math.random() - 0.5)
                    setSelectedList({ ...selectedList, listWords: shuffled })
                  }}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {selectedList.listWords.map((lw, index) => (
                  <div
                    key={lw.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm text-gray-400 w-6">{index + 1}</span>
                    <div className="flex-1">
                      <span className="font-medium">{lw.word.word}</span>
                      <span className="text-gray-500 mr-2">- {lw.word.translation}</span>
                    </div>
                    {lw.word.partOfSpeech && (
                      <Badge variant="secondary" className="text-xs">
                        {lw.word.partOfSpeech}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
