'use client'

import { useState } from 'react'
import { Plus, Loader2, Sparkles, RefreshCw, AlertCircle, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  nameAr?: string | null
  color: string
}

interface AddWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onSuccess: () => void
}

interface WordData {
  isCorrect: boolean
  originalWord: string
  correctWord: string | null
  suggestions: string[]
  translation: string
  pronunciation: string
  definition: string
  partOfSpeech: string
  level: string
  synonyms: string[]
  antonyms: string[]
  sentences: { sentence: string; translation: string }[]
}

export function AddWordDialog({ open, onOpenChange, categories, onSuccess }: AddWordDialogProps) {
  // Local form state
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [pronunciation, setPronunciation] = useState('')
  const [definition, setDefinition] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')
  const [level, setLevel] = useState('beginner')
  const [categoryId, setCategoryId] = useState('')
  const [sentences, setSentences] = useState<{ sentence: string; translation: string }[]>([])
  const [synonyms, setSynonyms] = useState<string[]>([])
  const [antonyms, setAntonyms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [autoFillTimeout, setAutoFillTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Spelling check state
  const [isCorrect, setIsCorrect] = useState<boolean>(true)
  const [correctWord, setCorrectWord] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [usedCorrectedWord, setUsedCorrectedWord] = useState(false)

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setWord('')
      setTranslation('')
      setPronunciation('')
      setDefinition('')
      setPartOfSpeech('')
      setLevel('beginner')
      setCategoryId('')
      setSentences([])
      setSynonyms([])
      setAntonyms([])
      setIsCorrect(true)
      setCorrectWord(null)
      setSuggestions([])
      setUsedCorrectedWord(false)
      if (autoFillTimeout) clearTimeout(autoFillTimeout)
    }
    onOpenChange(newOpen)
  }

  // Auto-fill word data using AI
  const autoFillWordData = async (wordText: string) => {
    if (!wordText || wordText.length < 2) return
    
    setIsAutoFilling(true)
    
    try {
      const res = await fetch('/api/word-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordText }),
      })
      const data = await res.json()
      
      if (data.success && data.data) {
        const wordData: WordData = data.data
        
        // Handle spelling check
        setIsCorrect(wordData.isCorrect !== false)
        setCorrectWord(wordData.correctWord)
        setSuggestions(wordData.suggestions || [])
        
        // If word is incorrect but we have a correction, show info but fill with corrected data
        if (!wordData.isCorrect && wordData.correctWord) {
          toast.info(`تم تصحيح الكلمة من "${wordText}" إلى "${wordData.correctWord}"`)
        }
        
        // Fill the form with AI-generated data
        if (wordData.translation) setTranslation(wordData.translation)
        if (wordData.pronunciation) setPronunciation(wordData.pronunciation)
        if (wordData.definition) setDefinition(wordData.definition)
        if (wordData.partOfSpeech) setPartOfSpeech(wordData.partOfSpeech)
        if (wordData.level) setLevel(wordData.level)
        if (wordData.sentences && wordData.sentences.length > 0) {
          setSentences(wordData.sentences)
        }
        if (wordData.synonyms && wordData.synonyms.length > 0) {
          setSynonyms(wordData.synonyms)
        }
        if (wordData.antonyms && wordData.antonyms.length > 0) {
          setAntonyms(wordData.antonyms)
        }
        
        if (wordData.isCorrect) {
          toast.success('تم ملء البيانات تلقائياً!')
        }
      }
    } catch (error) {
      console.error('Auto-fill error:', error)
      toast.error('فشل في الحصول على معلومات الكلمة')
    } finally {
      setIsAutoFilling(false)
    }
  }

  // Handle word input change with debounce
  const handleWordChange = (value: string) => {
    setWord(value)
    setIsCorrect(true)
    setCorrectWord(null)
    setSuggestions([])
    setUsedCorrectedWord(false)
    
    // Clear previous timeout
    if (autoFillTimeout) clearTimeout(autoFillTimeout)
    
    // Set new timeout for auto-fill (wait 1 second after user stops typing)
    if (value.length >= 2) {
      const timeout = setTimeout(() => {
        autoFillWordData(value)
      }, 1000)
      setAutoFillTimeout(timeout)
    }
  }

  // Apply corrected word
  const applyCorrectedWord = (suggestedWord: string) => {
    setWord(suggestedWord)
    setUsedCorrectedWord(true)
    setIsCorrect(true)
    setCorrectWord(null)
    // Re-analyze with the corrected word
    setTimeout(() => autoFillWordData(suggestedWord), 100)
  }

  // Manual refresh
  const handleRefresh = () => {
    if (word.length >= 2) {
      autoFillWordData(word)
    }
  }

  const handleSubmit = async () => {
    if (!word || !translation) {
      toast.error('الكلمة والترجمة مطلوبان')
      return
    }

    setIsLoading(true)
    
    try {
      const dataToSend = {
        word,
        translation,
        pronunciation: pronunciation || undefined,
        definition: definition || undefined,
        partOfSpeech: partOfSpeech || undefined,
        level,
        categoryId: categoryId || undefined,
        sentences: sentences.length > 0 ? sentences : undefined,
      }
      
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تمت إضافة الكلمة بنجاح')
        handleOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.error || 'فشل في إضافة الكلمة')
      }
    } catch {
      toast.error('فشل في إضافة الكلمة')
    } finally {
      setIsLoading(false)
    }
  }

  // Part of speech labels
  const partOfSpeechLabels: Record<string, string> = {
    noun: 'اسم',
    verb: 'فعل',
    adjective: 'صفة',
    adverb: 'ظرف',
    preposition: 'حرف جر',
    conjunction: 'حرف عطف',
    pronoun: 'ضمير',
    interjection: 'حرف تعجب',
  }

  // Level labels
  const levelLabels: Record<string, { label: string; color: string }> = {
    beginner: { label: 'مبتدئ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    intermediate: { label: 'متوسط', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    advanced: { label: 'متقدم', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            إضافة كلمة جديدة
            <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          </DialogTitle>
          <DialogDescription>
            أدخل الكلمة الإنجليزية وسيتم ملء الباقي تلقائياً بالذكاء الاصطناعي
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Word input with auto-fill indicator */}
          <div>
            <Label htmlFor="word" className="flex items-center gap-2">
              الكلمة بالإنجليزية *
              {isAutoFilling && (
                <span className="text-xs text-violet-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  جاري التحليل...
                </span>
              )}
            </Label>
            <div className="flex gap-2 mt-1.5">
              <div className="flex-1 relative">
                <Input
                  id="word"
                  value={word}
                  onChange={(e) => handleWordChange(e.target.value)}
                  placeholder="اكتب الكلمة هنا... (مثال: beautiful)"
                  className={cn(
                    "pr-10",
                    !isCorrect && "border-amber-500 focus-visible:ring-amber-500"
                  )}
                  disabled={isLoading}
                />
                {!isCorrect && (
                  <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                )}
                {isCorrect && word && !isAutoFilling && (
                  <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isAutoFilling || word.length < 2}
                title="إعادة تحليل الكلمة"
              >
                <RefreshCw className={cn("w-4 h-4", isAutoFilling && "animate-spin")} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              سيتم ملء البيانات تلقائياً بعد كتابة الكلمة
            </p>
          </div>

          {/* Spelling correction alert */}
          {!isCorrect && correctWord && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-400">
                الكلمة غير صحيحة إملائياً
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  هل تقصد: <strong>{correctWord}</strong>؟
                </p>
                {suggestions.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestions.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => applyCorrectedWord(s)}
                      >
                        {s}
                        <ArrowRight className="w-3 h-3 mr-1" />
                      </Button>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="mt-2"
                  onClick={() => applyCorrectedWord(correctWord)}
                >
                  استخدام "{correctWord}"
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Translation */}
          <div>
            <Label htmlFor="translation">الترجمة بالعربية *</Label>
            <Input
              id="translation"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="الترجمة العربية"
              dir="rtl"
              className="mt-1.5"
              disabled={isLoading || isAutoFilling}
            />
          </div>

          {/* Pronunciation */}
          <div>
            <Label htmlFor="pronunciation">النطق الصوتي</Label>
            <Input
              id="pronunciation"
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              placeholder="/ˈbjuːtɪfəl/"
              className="mt-1.5 font-mono"
              disabled={isLoading || isAutoFilling}
            />
          </div>

          {/* Definition */}
          <div>
            <Label htmlFor="definition">التعريف</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Having qualities that give pleasure to the senses..."
              rows={2}
              className="mt-1.5"
              disabled={isLoading || isAutoFilling}
            />
          </div>

          {/* Part of Speech & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partOfSpeech">نوع الكلمة</Label>
              <Select
                value={partOfSpeech}
                onValueChange={setPartOfSpeech}
                disabled={isLoading || isAutoFilling}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(partOfSpeechLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {partOfSpeech && (
                <Badge className={cn("mt-2", levelLabels[level]?.color || "bg-gray-100")}>
                  {partOfSpeechLabels[partOfSpeech]}
                </Badge>
              )}
            </div>
            
            <div>
              <Label htmlFor="level">المستوى</Label>
              <Select
                value={level}
                onValueChange={setLevel}
                disabled={isLoading || isAutoFilling}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(levelLabels).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {level && (
                <Badge className={cn("mt-2", levelLabels[level]?.color)}>
                  {levelLabels[level]?.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Synonyms & Antonyms */}
          {(synonyms.length > 0 || antonyms.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {synonyms.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600">المرادفات</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {synonyms.map((syn, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {syn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {antonyms.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600">الأضداد</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {antonyms.map((ant, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {ant}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <Label htmlFor="category">التصنيف</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isLoading}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="اختر تصنيفاً..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: cat.color }} 
                      />
                      {cat.nameAr || cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Generated Sentences */}
          {sentences.length > 0 && (
            <div>
              <Label className="flex items-center gap-2">
                أمثلة على استخدام الكلمة
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              </Label>
              <div className="mt-2 space-y-2">
                {sentences.map((s, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-900 dark:text-gray-100">{s.sentence}</p>
                    <p className="text-sm text-gray-500 mt-1">{s.translation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isAutoFilling}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري الإضافة...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                إضافة الكلمة
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
