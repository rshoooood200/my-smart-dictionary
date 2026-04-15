'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Pin, Archive, Trash2, Edit2, Search, 
  StickyNote, X, Check, MoreVertical, Tag, Clock,
  Grid3X3, List, LayoutGrid, Copy, Share2, 
  Maximize2, Minimize2, SortAsc, SortDesc, 
  Calendar, Type, Palette, FolderOpen, Download,
  Eye, EyeOff, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useVocabStore, type Note } from '@/store/vocab-store'

// Note colors with gradients
const noteColors = [
  { name: 'أخضر', value: '#10B981', gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { name: 'أزرق', value: '#3B82F6', gradient: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 dark:bg-blue-950/30' },
  { name: 'بنفسجي', value: '#8B5CF6', gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50 dark:bg-violet-950/30' },
  { name: 'وردي', value: '#EC4899', gradient: 'from-pink-500 to-rose-600', light: 'bg-pink-50 dark:bg-pink-950/30' },
  { name: 'برتقالي', value: '#F97316', gradient: 'from-orange-500 to-amber-600', light: 'bg-orange-50 dark:bg-orange-950/30' },
  { name: 'أحمر', value: '#EF4444', gradient: 'from-red-500 to-rose-600', light: 'bg-red-50 dark:bg-red-950/30' },
  { name: 'سماوي', value: '#06B6D4', gradient: 'from-cyan-500 to-teal-600', light: 'bg-cyan-50 dark:bg-cyan-950/30' },
  { name: 'رمادي', value: '#6B7280', gradient: 'from-gray-500 to-slate-600', light: 'bg-gray-50 dark:bg-gray-950/30' },
]

// View modes
type ViewMode = 'grid' | 'list' | 'masonry'

// Sort options
type SortOption = 'newest' | 'oldest' | 'title' | 'color'

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 1 ? 'الآن' : `منذ ${minutes} دقيقة`
    }
    return `منذ ${hours} ساعة`
  } else if (days === 1) {
    return 'أمس'
  } else if (days < 7) {
    return `منذ ${days} أيام`
  } else {
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
  }
}

// Get color config
const getColorConfig = (color: string) => {
  return noteColors.find(c => c.value === color) || noteColors[0]
}

export function NotesSection() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote, toggleArchiveNote, loadNotes, currentUserId } = useVocabStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteColor, setNoteColor] = useState('#10B981')
  const [noteTags, setNoteTags] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [colorFilter, setColorFilter] = useState<string>('')
  
  // Load notes on mount
  useEffect(() => {
    if (currentUserId) {
      loadNotes()
    }
  }, [currentUserId, loadNotes])
  
  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = notes.filter(note => {
      if (note.isArchived !== showArchived) return false
      if (colorFilter && note.color !== colorFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = note.title.toLowerCase().includes(query)
        const matchesContent = note.content.toLowerCase().includes(query)
        const matchesTags = note.tags.some(t => t.toLowerCase().includes(query))
        if (!matchesTitle && !matchesContent && !matchesTags) return false
      }
      return true
    })
    
    // Sort
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        break
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title, 'ar'))
        break
      case 'color':
        result.sort((a, b) => a.color.localeCompare(b.color))
        break
    }
    
    return result
  }, [notes, searchQuery, showArchived, colorFilter, sortOption])
  
  // Group notes by pinned
  const pinnedNotes = filteredNotes.filter(n => n.isPinned)
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned)
  
  // Stats
  const stats = useMemo(() => ({
    total: notes.filter(n => !n.isArchived).length,
    pinned: notes.filter(n => n.isPinned && !n.isArchived).length,
    archived: notes.filter(n => n.isArchived).length,
    tags: [...new Set(notes.flatMap(n => n.tags))].length
  }), [notes])
  
  // Reset form - defined before it's used
  const resetForm = useCallback(() => {
    setSelectedNote(null)
    setNoteTitle('')
    setNoteContent('')
    setNoteColor('#10B981')
    setNoteTags('')
  }, [])
  
  // Add note
  const handleAddNote = useCallback(async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast.error('الرجاء إدخال العنوان والمحتوى')
      return
    }
    
    try {
      const tags = noteTags.split(',').map(t => t.trim()).filter(Boolean)
      await addNote({
        title: noteTitle,
        content: noteContent,
        color: noteColor,
        tags
      })
      
      toast.success('تم إضافة الملاحظة بنجاح')
      setIsAddDialogOpen(false)
      resetForm()
    } catch {
      toast.error('فشل في إضافة الملاحظة')
    }
  }, [noteTitle, noteContent, noteColor, noteTags, addNote, resetForm])
  
  // Edit note
  const handleEditNote = useCallback(async () => {
    if (!selectedNote || !noteTitle.trim() || !noteContent.trim()) {
      toast.error('الرجاء إدخال العنوان والمحتوى')
      return
    }
    
    try {
      const tags = noteTags.split(',').map(t => t.trim()).filter(Boolean)
      await updateNote(selectedNote.id, {
        title: noteTitle,
        content: noteContent,
        color: noteColor,
        tags
      })
      
      toast.success('تم تحديث الملاحظة بنجاح')
      setIsEditDialogOpen(false)
      resetForm()
    } catch {
      toast.error('فشل في تحديث الملاحظة')
    }
  }, [selectedNote, noteTitle, noteContent, noteColor, noteTags, updateNote])
  
  // Delete note
  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await deleteNote(noteId)
      toast.success('تم حذف الملاحظة')
      setIsViewDialogOpen(false)
    } catch {
      toast.error('فشل في حذف الملاحظة')
    }
  }, [deleteNote])
  
  // Copy note content
  const copyNoteContent = useCallback((note: Note) => {
    const text = `${note.title}\n\n${note.content}`
    navigator.clipboard.writeText(text)
    toast.success('تم نسخ الملاحظة')
  }, [])
  
  // Open edit dialog
  const openEditDialog = useCallback((note: Note) => {
    setSelectedNote(note)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setNoteColor(note.color)
    setNoteTags(note.tags.join(', '))
    setIsEditDialogOpen(true)
    setIsViewDialogOpen(false)
  }, [])
  
  // Open view dialog
  const openViewDialog = useCallback((note: Note) => {
    setSelectedNote(note)
    setIsViewDialogOpen(true)
  }, [])
  
  // Export notes
  const exportNotes = useCallback(() => {
    const exportData = notes.map(n => ({
      title: n.title,
      content: n.content,
      tags: n.tags,
      color: n.color,
      createdAt: n.createdAt
    }))
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('تم تصدير الملاحظات')
  }, [notes])
  
  // Note card component
  const NoteCard = ({ note, index }: { note: Note; index: number }) => {
    const colorConfig = getColorConfig(note.color)
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
        className={cn(
          "group relative",
          viewMode === 'list' && "col-span-full"
        )}
      >
        <Card 
          className={cn(
            "overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer",
            "bg-gradient-to-br",
            colorConfig.light,
            viewMode === 'list' ? "flex items-center" : "h-full flex flex-col"
          )}
          onClick={() => openViewDialog(note)}
        >
          {/* Color indicator */}
          <div 
            className={cn(
              "bg-gradient-to-l shrink-0",
              colorConfig.gradient,
              viewMode === 'list' ? "w-1 h-full self-stretch" : "h-2 w-full"
            )}
          />
          
          <CardContent className={cn(
            "p-4 flex-1 flex flex-col",
            viewMode === 'list' && "flex-row items-center gap-4"
          )}>
            {/* Header */}
            <div className={cn(
              "flex items-start justify-between gap-2",
              viewMode === 'list' && "flex-1 items-center"
            )}>
              <div className="flex items-center gap-2 min-w-0">
                {note.isPinned && (
                  <Pin className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" />
                )}
                <h3 className={cn(
                  "font-bold text-gray-900 dark:text-white",
                  viewMode === 'list' ? "text-base" : "text-lg truncate"
                )}>
                  {note.title}
                </h3>
              </div>
              
              {/* Quick actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyNoteContent(note)
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>نسخ</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => openEditDialog(note)}>
                      <Edit2 className="w-4 h-4 ml-2" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePinNote(note.id)}>
                      <Pin className="w-4 h-4 ml-2" />
                      {note.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleArchiveNote(note.id)}>
                      <Archive className="w-4 h-4 ml-2" />
                      {note.isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-500 focus:text-red-500"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Content */}
            {viewMode !== 'list' && (
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 my-2 flex-1">
                {note.content}
              </p>
            )}
            
            {/* Footer */}
            <div className={cn(
              "flex items-center justify-between gap-2",
              viewMode === 'list' ? "ml-auto" : "mt-auto pt-2"
            )}>
              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {note.tags.slice(0, viewMode === 'list' ? 2 : 3).map((tag, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary" 
                      className="text-xs px-2 py-0.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > (viewMode === 'list' ? 2 : 3) && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      +{note.tags.length - (viewMode === 'list' ? 2 : 3)}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <Clock className="w-3 h-3" />
                <span>{formatDate(note.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Hero Header */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700" />
        
        <div className="relative px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <StickyNote className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  ملاحظاتي
                </h1>
                <p className="text-white/70 text-sm">
                  احفظ أفكارك وملاحظاتك بشكل منظم
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                className="flex-1 sm:flex-none h-11 px-4 rounded-lg bg-white text-teal-700 hover:bg-white/90 font-medium shadow-lg flex items-center justify-center gap-2 transition-colors"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-5 h-5" />
                ملاحظة جديدة
              </button>
              <button
                className="h-11 w-11 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                onClick={exportNotes}
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-6 max-w-lg">
            <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-white/70">ملاحظة</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.pinned}</div>
              <div className="text-xs text-white/70">مثبتة</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.archived}</div>
              <div className="text-xs text-white/70">مؤرشفة</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.tags}</div>
              <div className="text-xs text-white/70">وسم</div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Filters & Controls */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            {/* Search row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="بحث في الملاحظات..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pr-10 h-10 bg-gray-50 dark:bg-gray-800 border-0" 
                />
              </div>
              
              {/* View mode toggle */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <Button
                  size="icon"
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
                  className="h-8 w-8"
                  onClick={() => setViewMode('masonry')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Archive toggle */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={!showArchived ? 'secondary' : 'ghost'}
                  className={cn("h-8", !showArchived && "bg-white dark:bg-gray-700 shadow-sm")}
                  onClick={() => setShowArchived(false)}
                >
                  <StickyNote className="w-4 h-4 mr-1" />
                  الملاحظات
                </Button>
                <Button
                  size="sm"
                  variant={showArchived ? 'secondary' : 'ghost'}
                  className={cn("h-8", showArchived && "bg-white dark:bg-gray-700 shadow-sm")}
                  onClick={() => setShowArchived(true)}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  الأرشيف
                </Button>
              </div>
              
              {/* Sort */}
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-36 h-9 bg-gray-50 dark:bg-gray-800 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <SortDesc className="w-4 h-4" />
                      الأحدث
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <SortAsc className="w-4 h-4" />
                      الأقدم
                    </div>
                  </SelectItem>
                  <SelectItem value="title">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      العنوان
                    </div>
                  </SelectItem>
                  <SelectItem value="color">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      اللون
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Color filter */}
              <Select value={colorFilter} onValueChange={(v) => setColorFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-32 h-9 bg-gray-50 dark:bg-gray-800 border-0">
                  <SelectValue placeholder="كل الألوان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الألوان</SelectItem>
                  {noteColors.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex-1" />
              
              {/* Add button */}
              <button 
                className="h-9 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm flex items-center gap-1 transition-colors"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                جديدة
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Notes grid */}
      <AnimatePresence mode="wait">
        {filteredNotes.length > 0 ? (
          <motion.div
            key="notes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Pinned notes */}
            {pinnedNotes.length > 0 && !showArchived && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Pin className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-500">مثبتة</span>
                  <Badge variant="secondary" className="text-xs">{pinnedNotes.length}</Badge>
                </div>
                <div className={cn(
                  "grid gap-4",
                  viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  viewMode === 'masonry' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  viewMode === 'list' && "grid-cols-1"
                )}>
                  {pinnedNotes.map((note, i) => (
                    <NoteCard key={note.id} note={note} index={i} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Other notes */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && !showArchived && (
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <StickyNote className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">أخرى</span>
                  </div>
                )}
                <div className={cn(
                  "grid gap-4",
                  viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  viewMode === 'masonry' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  viewMode === 'list' && "grid-cols-1"
                )}>
                  {unpinnedNotes.map((note, i) => (
                    <NoteCard key={note.id} note={note} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
              <StickyNote className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {showArchived ? 'لا توجد ملاحظات مؤرشفة' : 'لا توجد ملاحظات'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {showArchived 
                ? 'الملاحظات المؤرشفة ستظهر هنا. يمكنك أرشفة الملاحظات التي لا تحتاجها حالياً.'
                : 'ابدأ بإضافة ملاحظتك الأولى لتسجيل أفكارك ومعلوماتك المهمة.'
              }
            </p>
            {!showArchived && (
              <button 
                className="h-10 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 transition-colors mx-auto"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Sparkles className="w-4 h-4" />
                إضافة ملاحظة جديدة
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add Note Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Plus className="w-4 h-4 text-teal-600" />
              </div>
              ملاحظة جديدة
            </DialogTitle>
            <DialogDescription>
              أضف ملاحظة جديدة لحفظ ما تريد تذكره
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium">العنوان</Label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="عنوان الملاحظة..."
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">المحتوى</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="اكتب ملاحظتك هنا..."
                className="mt-1.5 min-h-[150px] resize-none"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">اللون</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {noteColors.map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all duration-200 shadow-sm hover:scale-105 active:scale-95",
                      noteColor === color.value && "ring-2 ring-offset-2 ring-gray-400 scale-110"
                    )}
                    style={{ background: `linear-gradient(135deg, ${color.value}, ${color.value}cc)` }}
                    onClick={() => setNoteColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">الوسوم (اختياري)</Label>
              <Input
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                placeholder="وسم1، وسم2، وسم3..."
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                افصل بين الوسوم بفاصلة للتصنيف السهل
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <button 
              className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { setIsAddDialogOpen(false); resetForm(); }}
            >
              إلغاء
            </button>
            <button 
              className="h-10 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 transition-colors"
              onClick={handleAddNote}
            >
              <Check className="w-4 h-4" />
              حفظ الملاحظة
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Edit2 className="w-4 h-4 text-blue-600" />
              </div>
              تعديل الملاحظة
            </DialogTitle>
            <DialogDescription>
              قم بتعديل محتوى الملاحظة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium">العنوان</Label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="عنوان الملاحظة..."
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">المحتوى</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="اكتب ملاحظتك هنا..."
                className="mt-1.5 min-h-[150px] resize-none"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">اللون</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {noteColors.map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all duration-200 shadow-sm hover:scale-105 active:scale-95",
                      noteColor === color.value && "ring-2 ring-offset-2 ring-gray-400 scale-110"
                    )}
                    style={{ background: `linear-gradient(135deg, ${color.value}, ${color.value}cc)` }}
                    onClick={() => setNoteColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">الوسوم</Label>
              <Input
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                placeholder="وسم1، وسم2، وسم3..."
                className="mt-1.5"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <button 
              className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { setIsEditDialogOpen(false); resetForm(); }}
            >
              إلغاء
            </button>
            <button 
              className="h-10 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 transition-colors"
              onClick={handleEditNote}
            >
              <Check className="w-4 h-4" />
              حفظ التغييرات
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedNote && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${selectedNote.color}, ${selectedNote.color}cc)` }}
                    >
                      <StickyNote className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">{selectedNote.title}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(selectedNote.updatedAt)}
                      </DialogDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {selectedNote.isPinned && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Pin className="w-3 h-3 mr-1" fill="currentColor" />
                        مثبتة
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>
              
              {/* Tags */}
              {selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedNote.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto mt-4">
                <div className={cn(
                  "p-4 rounded-xl",
                  getColorConfig(selectedNote.color).light
                )}>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedNote.content}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyNoteContent(selectedNote)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    نسخ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePinNote(selectedNote.id)}
                  >
                    <Pin className="w-4 h-4 mr-1" />
                    {selectedNote.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                  </Button>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(selectedNote)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
