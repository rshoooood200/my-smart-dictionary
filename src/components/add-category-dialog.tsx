'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddCategoryDialog({ open, onOpenChange, onSuccess }: AddCategoryDialogProps) {
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [color, setColor] = useState('#10B981')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddCategory = async () => {
    if (!name.trim()) {
      toast.error('اسم التصنيف مطلوب')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          nameAr: nameAr.trim(),
          color: color,
        }),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تمت إضافة التصنيف بنجاح')
        setName('')
        setNameAr('')
        setColor('#10B981')
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.error || 'فشل في إضافة التصنيف')
      }
    } catch {
      toast.error('فشل في إضافة التصنيف')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName('')
      setNameAr('')
      setColor('#10B981')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm z-50">
        <DialogHeader>
          <DialogTitle>إضافة تصنيف جديد</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="catName">اسم التصنيف (إنجليزي)</Label>
            <Input
              id="catName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: animals"
              className="mt-1.5"
              suppressHydrationWarning
            />
          </div>
          
          <div>
            <Label htmlFor="catNameAr">اسم التصنيف (عربي)</Label>
            <Input
              id="catNameAr"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: حيوانات"
              dir="rtl"
              className="mt-1.5"
              suppressHydrationWarning
            />
          </div>

          <div>
            <Label htmlFor="catColor">لون التصنيف</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input
                id="catColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#10B981"
                className="flex-1"
                suppressHydrationWarning
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleAddCategory} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة التصنيف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
