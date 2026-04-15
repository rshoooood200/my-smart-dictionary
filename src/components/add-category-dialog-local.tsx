'use client'

import { useState } from 'react'
import { Plus, FolderPlus, Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'
import { cn } from '@/lib/utils'

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const predefinedColors = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', 
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

export function AddCategoryDialog({ open, onOpenChange }: AddCategoryDialogProps) {
  const { categories, addCategory, deleteCategory, updateCategory, words } = useVocabStore()
  
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [color, setColor] = useState(predefinedColors[0])
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNameAr, setEditNameAr] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setNameAr('')
    setColor(predefinedColors[0])
    setIsLoading(false)
    setEditingId(null)
    setDeleteConfirmId(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('الرجاء إدخال اسم التصنيف')
      return
    }

    setIsLoading(true)
    try {
      addCategory({
        name: name.trim(),
        nameAr: nameAr.trim() || undefined,
        color
      })

      toast.success('تمت إضافة التصنيف بنجاح')
      handleOpenChange(false)
    } catch {
      toast.error('فشل في إضافة التصنيف')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (categoryId: string, categoryName: string) => {
    const wordsInCategory = words.filter(w => w.categoryId === categoryId).length
    
    if (deleteConfirmId === categoryId) {
      deleteCategory(categoryId)
      setDeleteConfirmId(null)
      toast.success(`تم حذف التصنيف "${categoryName}"`)
    } else {
      setDeleteConfirmId(categoryId)
      if (wordsInCategory > 0) {
        toast.info(`هذا التصنيف يحتوي على ${wordsInCategory} كلمة. انقر مرة أخرى للتأكيد.`)
      }
    }
  }

  const startEdit = (categoryId: string, currentName: string, currentNameAr: string) => {
    setEditingId(categoryId)
    setEditName(currentName)
    setEditNameAr(currentNameAr)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditNameAr('')
  }

  const saveEdit = (categoryId: string) => {
    if (!editName.trim()) {
      toast.error('الرجاء إدخال اسم التصنيف')
      return
    }
    updateCategory(categoryId, {
      name: editName.trim(),
      nameAr: editNameAr.trim() || undefined
    })
    setEditingId(null)
    toast.success('تم تحديث التصنيف')
  }

  // Get word count for each category
  const getCategoryWordCount = (categoryId: string) => {
    return words.filter(w => w.categoryId === categoryId).length
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-emerald-600" />
            إدارة التصنيفات
          </DialogTitle>
          <DialogDescription>
            أنشئ تصنيفات جديدة أو عدّل الحالية لتنظيم كلماتك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Existing Categories */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">التصنيفات الحالية</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const wordCount = getCategoryWordCount(cat.id)
                  const isEditing = editingId === cat.id
                  const isDeleteConfirm = deleteConfirmId === cat.id
                  
                  return (
                    <Card 
                      key={cat.id} 
                      className={cn(
                        "border-0 shadow-sm transition-all",
                        isDeleteConfirm && "border-2 border-rose-300 bg-rose-50 dark:bg-rose-900/20"
                      )}
                    >
                      <CardContent className="p-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="الاسم بالإنجليزية"
                              className="h-8"
                            />
                            <Input
                              value={editNameAr}
                              onChange={(e) => setEditNameAr(e.target.value)}
                              placeholder="الاسم بالعربية"
                              className="h-8"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveEdit(cat.id)} className="flex-1 h-8">
                                <Check className="w-3 h-3 mr-1" />
                                حفظ
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1 h-8">
                                <X className="w-3 h-3 mr-1" />
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <div>
                                <span className="font-medium text-sm">{cat.nameAr || cat.name}</span>
                                {cat.nameAr && cat.name !== cat.nameAr && (
                                  <span className="text-xs text-gray-400 mr-1">({cat.name})</span>
                                )}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {wordCount} كلمة
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-blue-500"
                                onClick={() => startEdit(cat.id, cat.name, cat.nameAr || '')}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7",
                                  isDeleteConfirm 
                                    ? "text-rose-500 hover:text-rose-600" 
                                    : "text-gray-400 hover:text-rose-500"
                                )}
                                onClick={() => handleDelete(cat.id, cat.nameAr || cat.name)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                تصنيف جديد
              </span>
            </div>
          </div>

          {/* Add New Category Form */}
          <div className="space-y-4">
            {/* Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="name">اسم التصنيف (بالإنجليزية) *</Label>
              <Input
                id="name"
                placeholder="مثال: Business"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Name (Arabic) */}
            <div className="space-y-2">
              <Label htmlFor="nameAr">اسم التصنيف (بالعربية)</Label>
              <Input
                id="nameAr"
                placeholder="مثال: أعمال"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>اللون</Label>
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform hover:scale-110",
                      color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : ''
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Label className="text-xs text-gray-500 mb-2 block">معاينة</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium">{nameAr || name || 'اسم التصنيف'}</span>
                <Badge variant="secondary" className="text-xs">0 كلمة</Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            إغلاق
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة التصنيف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
