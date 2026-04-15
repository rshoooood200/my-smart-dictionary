'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Check, AlertCircle, ExternalLink, Loader2, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'

interface GeminiConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GeminiConfigDialog({ open, onOpenChange }: GeminiConfigDialogProps) {
  const currentUserId = useVocabStore(state => state.currentUserId)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [keyPreview, setKeyPreview] = useState<string | null>(null)

  // التحقق من وجود مفتاح عند فتح الـ dialog
  useEffect(() => {
    if (open && currentUserId) {
      checkApiKey()
    }
  }, [open, currentUserId])

  const checkApiKey = async () => {
    if (!currentUserId) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/gemini-config?userId=${currentUserId}`)
      const data = await res.json()
      
      if (data.success) {
        setHasKey(data.hasKey)
        setKeyPreview(data.keyPreview)
      }
    } catch (error) {
      console.error('Error checking API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    console.log('handleSave called', { currentUserId, apiKey: apiKey.trim() })
    
    if (!currentUserId) {
      toast.error('يجب تسجيل الدخول أولاً')
      return
    }

    const trimmedKey = apiKey.trim()
    
    if (!trimmedKey) {
      toast.error('الرجاء إدخال مفتاح API')
      return
    }

    // التحقق من صيغة المفتاح (Gemini keys start with 'AIza')
    if (!trimmedKey.startsWith('AIza')) {
      toast.error('صيغة المفتاح غير صحيحة. مفاتيح Gemini تبدأ بـ "AIza"')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/gemini-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          apiKey: trimmedKey
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('تم حفظ المفتاح بنجاح! 🎉', {
          description: 'يمكنك الآن استخدام ميزات AI في التطبيق'
        })
        setHasKey(true)
        setKeyPreview(data.keyPreview)
        setApiKey('')
        onOpenChange(false)
      } else {
        toast.error(data.error || 'فشل في حفظ المفتاح', {
          description: 'تأكد من أن المفتاح صحيح وأن لديك اتصال بالإنترنت'
        })
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      toast.error('فشل في حفظ المفتاح')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUserId) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/gemini-config?userId=${currentUserId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        toast.success('تم حذف المفتاح')
        setHasKey(false)
        setKeyPreview(null)
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('فشل في حذف المفتاح')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-violet-600" />
            إعداد Google Gemini API
          </DialogTitle>
          <DialogDescription>
            قم بإضافة مفتاح Gemini API لتفعيل ميزات الذكاء الاصطناعي
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* الحالة الحالية */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : hasKey ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-medium">المفتاح مُعدّ بالفعل</span>
              </div>
              {keyPreview && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {keyPreview}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isSaving}
                className="mt-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                حذف المفتاح
              </Button>
            </div>
          ) : null}

          {/* إدخال المفتاح */}
          {!isLoading && (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey">مفتاح Gemini API</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text');
                      setApiKey(pastedText);
                    }}
                    className="pl-3 pr-10 font-mono text-left dir-ltr"
                    dir="ltr"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* تعليمات الحصول على المفتاح */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  للحصول على مفتاح API مجاني:
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                  <li>اذهب إلى Google AI Studio</li>
                  <li>سجل دخول بحساب Google</li>
                  <li>اضغط "Get API Key"</li>
                  <li>انسخ المفتاح والصقه هنا</li>
                </ol>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح Google AI Studio
                </a>
              </div>

              {/* ملاحظة */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  المفتاح يُحفظ بشكل آمن في جهازك ولا يُرسل لأي خادم خارجي.
                  Google Gemini يوفر استخدامه مجاناً بحدود 15 طلب/دقيقة.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !apiKey.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            حفظ المفتاح
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
