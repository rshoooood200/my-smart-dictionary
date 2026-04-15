'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, Loader2, FolderPlus, AlertCircle, CheckCircle2, X, BookOpen, Volume2, Lightbulb, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'
import { cn } from '@/lib/utils'
import type { Sentence } from '@/store/vocab-store'
import { AddCategoryDialog } from './add-category-dialog-local'

interface AddWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const predefinedColors = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', 
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

export function AddWordDialog({ open, onOpenChange }: AddWordDialogProps) {
  const { categories, addWord, addCategory, words } = useVocabStore()
  
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [pronunciation, setPronunciation] = useState('')
  const [definition, setDefinition] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [categoryId, setCategoryId] = useState('')
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [synonyms, setSynonyms] = useState<string[]>([])
  const [antonyms, setAntonyms] = useState<string[]>([])
  const [usageNotes, setUsageNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [correctedWord, setCorrectedWord] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Check for duplicates when word changes
  useEffect(() => {
    if (word.trim()) {
      const normalizedWord = word.toLowerCase().trim()
      const existingWord = words.find(w => w.word.toLowerCase() === normalizedWord)
      if (existingWord) {
        setDuplicateWarning(`الكلمة "${existingWord.word}" موجودة بالفعل!`)
      } else {
        setDuplicateWarning(null)
      }
    } else {
      setDuplicateWarning(null)
    }
  }, [word, words])

  const resetForm = () => {
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
    setUsageNotes('')
    setIsLoading(false)
    setIsGenerating(false)
    setDuplicateWarning(null)
    setCorrectedWord(null)
    setSuggestions([])
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const generateWordInfo = async () => {
    if (!word.trim()) {
      toast.error('الرجاء إدخال الكلمة أولاً')
      return
    }

    // Check for duplicates before generating
    const normalizedWord = word.toLowerCase().trim()
    const existingWord = words.find(w => w.word.toLowerCase() === normalizedWord)
    if (existingWord) {
      toast.error(`الكلمة "${existingWord.word}" موجودة بالفعل!`, {
        description: 'لا يمكنك إضافة نفس الكلمة مرتين'
      })
      return
    }

    setIsGenerating(true)
    setCorrectedWord(null)
    setSuggestions([])
    
    try {
      const res = await fetch('/api/word-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim() }),
      })
      
      const data = await res.json()
      
      if (data.success && data.data) {
        const wordData = data.data
        
        // Handle spelling correction
        if (!wordData.isCorrect && wordData.correctWord) {
          setCorrectedWord(wordData.correctWord)
          setSuggestions(wordData.suggestions || [])
          toast.info(`تم تصحيح الكلمة من "${word}" إلى "${wordData.correctWord}"`, {
            description: 'انقر على الكلمة الصحيحة لاستخدامها'
          })
        }
        
        setTranslation(wordData.translation || translation)
        setPronunciation(wordData.pronunciation || pronunciation)
        setDefinition(wordData.definition || definition)
        setPartOfSpeech(wordData.partOfSpeech || partOfSpeech)
        setLevel(wordData.level || level)
        setSynonyms(wordData.synonyms || [])
        setAntonyms(wordData.antonyms || [])
        setUsageNotes(wordData.usageNotes || '')
        
        if (wordData.sentences && wordData.sentences.length > 0) {
          setSentences(wordData.sentences.map((s: { sentence: string; translation: string }) => ({
            id: `sentence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sentence: s.sentence,
            translation: s.translation,
            isAiGenerated: true
          })))
        }
        
        toast.success('تم توليد المعلومات بنجاح', {
          description: 'يمكنك تعديل المعلومات قبل الحفظ'
        })
      } else {
        toast.error(data.error || 'فشل في توليد المعلومات')
      }
    } catch (error) {
      console.error('Error generating word info:', error)
      const errorMessage = error instanceof Error ? error.message : 'فشل في الاتصال بالخادم'
      toast.error('فشل في توليد المعلومات', {
        description: errorMessage.includes('Load failed') 
          ? 'تأكد من اتصالك بالإنترنت وحاول مرة أخرى'
          : errorMessage
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const useCorrectedWord = () => {
    if (correctedWord) {
      setWord(correctedWord)
      setCorrectedWord(null)
      setSuggestions([])
    }
  }

  const applySuggestion = (suggestion: string) => {
    setWord(suggestion)
    setCorrectedWord(null)
    setSuggestions([])
  }

  const addSentence = () => {
    setSentences([
      ...sentences,
      {
        id: `sentence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentence: '',
        translation: '',
        isAiGenerated: false
      }
    ])
  }

  const updateSentence = (index: number, field: 'sentence' | 'translation', value: string) => {
    const updated = [...sentences]
    updated[index] = { ...updated[index], [field]: value }
    setSentences(updated)
  }

  const removeSentence = (index: number) => {
    setSentences(sentences.filter((_, i) => i !== index))
  }

  const handleAddCategory = (name: string, nameAr: string, color: string) => {
    addCategory({ name, nameAr: nameAr || undefined, color })
    toast.success('تمت إضافة التصنيف بنجاح')
  }

  const handleSubmit = async () => {
    if (!word.trim() || !translation.trim()) {
      toast.error('الرجاء إدخال الكلمة والترجمة')
      return
    }

    // Final duplicate check
    const normalizedWord = word.toLowerCase().trim()
    const existingWord = words.find(w => w.word.toLowerCase() === normalizedWord)
    if (existingWord) {
      toast.error(`الكلمة "${existingWord.word}" موجودة بالفعل!`)
      return
    }

    setIsLoading(true)
    try {
      await addWord({
        word: word.trim(),
        translation: translation.trim(),
        pronunciation: pronunciation.trim() || undefined,
        definition: definition.trim() || undefined,
        partOfSpeech: partOfSpeech || undefined,
        level,
        categoryId: categoryId || undefined,
        sentences: sentences.filter(s => s.sentence.trim() && s.translation.trim()),
        synonyms: synonyms.length > 0 ? synonyms : undefined,
        antonyms: antonyms.length > 0 ? antonyms : undefined,
        usageNotes: usageNotes.trim() || undefined
      })

      toast.success('تمت إضافة الكلمة بنجاح')
      handleOpenChange(false)
    } catch {
      toast.error('فشل في إضافة الكلمة')
    } finally {
      setIsLoading(false)
    }
  }

  const speakWord = () => {
    if (!word.trim() || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word.trim())
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  const partOfSpeechOptions = [
    { value: 'noun', label: 'Noun', labelAr: 'اسم' },
    { value: 'verb', label: 'Verb', labelAr: 'فعل' },
    { value: 'adjective', label: 'Adjective', labelAr: 'صفة' },
    { value: 'adverb', label: 'Adverb', labelAr: 'ظرف' },
    { value: 'preposition', label: 'Preposition', labelAr: 'حرف جر' },
    { value: 'conjunction', label: 'Conjunction', labelAr: 'حرف عطف' },
    { value: 'pronoun', label: 'Pronoun', labelAr: 'ضمير' },
    { value: 'interjection', label: 'Interjection', labelAr: 'حرف تعجب' },
    { value: 'phrasal_verb', label: 'Phrasal Verb', labelAr: 'فعل عبارة' },
    { value: 'idiom', label: 'Idiom', labelAr: 'تعبير' },
  ]

  const levelOptions = [
    { value: 'beginner', label: 'Beginner', labelAr: 'مبتدئ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { value: 'intermediate', label: 'Intermediate', labelAr: 'متوسط', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'advanced', label: 'Advanced', labelAr: 'متقدم', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              إضافة كلمة جديدة
            </DialogTitle>
            <DialogDescription>
              أضف كلمة جديدة لقاموسك الشخصي مع معلومات شاملة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Word input with AI button */}
            <div className="space-y-2">
              <Label htmlFor="word">الكلمة الإنجليزية *</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="word"
                    placeholder="مثال: accomplish"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    className={cn(
                      "pr-10",
                      duplicateWarning && "border-amber-500 focus-visible:ring-amber-500"
                    )}
                  />
                  {word.trim() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={speakWord}
                    >
                      <Volume2 className="w-4 h-4 text-gray-400 hover:text-emerald-600" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={generateWordInfo}
                  disabled={isGenerating || !word.trim()}
                  className="shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 hover:from-violet-600 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  توليد AI
                </Button>
              </div>
              
              {/* Duplicate Warning */}
              <AnimatePresence>
                {duplicateWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{duplicateWarning}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spelling Correction */}
              <AnimatePresence>
                {correctedWord && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <div 
                      className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                      onClick={useCorrectedWord}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 dark:text-emerald-400">
                        هل كنت تقول: <strong className="text-emerald-800 dark:text-emerald-300">{correctedWord}</strong>؟
                      </span>
                      <Badge variant="outline" className="mr-auto text-emerald-600 border-emerald-300">
                        انقر للاستخدام
                      </Badge>
                    </div>
                    
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">اقتراحات أخرى:</span>
                        {suggestions.map((s, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={() => applySuggestion(s)}
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Translation */}
            <div className="space-y-2">
              <Label htmlFor="translation">الترجمة العربية *</Label>
              <Input
                id="translation"
                placeholder="مثال: يُنجز"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
              />
            </div>

            {/* Pronunciation */}
            <div className="space-y-2">
              <Label htmlFor="pronunciation">النطق (IPA)</Label>
              <Input
                id="pronunciation"
                placeholder="مثال: /əˈkʌmplɪʃ/"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Definition (English) */}
            <div className="space-y-2">
              <Label htmlFor="definition">
                <div className="flex items-center gap-2">
                  <span>التعريف (English)</span>
                  <Badge variant="outline" className="text-xs">مهم للتعلم</Badge>
                </div>
              </Label>
              <Textarea
                id="definition"
                placeholder="A clear definition in English..."
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                rows={2}
                className="font-mono text-sm"
              />
            </div>

            {/* Part of Speech and Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الكلمة (Part of Speech)</Label>
                <Select value={partOfSpeech} onValueChange={setPartOfSpeech}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {partOfSpeechOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-gray-400 text-xs">({option.labelAr})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>المستوى (Level)</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as 'beginner' | 'intermediate' | 'advanced')}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={option.color}>{option.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category with Add New Button */}
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <div className="flex gap-2">
                <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تصنيف</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.nameAr || cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCategoryDialogOpen(true)}
                  title="إضافة تصنيف جديد"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Synonyms & Antonyms */}
            {(synonyms.length > 0 || antonyms.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {synonyms.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-emerald-600">
                      <ArrowRightLeft className="w-3 h-3" />
                      المرادفات (Synonyms)
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {synonyms.map((syn, i) => (
                        <Badge key={i} variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {syn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {antonyms.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-rose-600">
                      <ArrowRightLeft className="w-3 h-3 rotate-180" />
                      الأضداد (Antonyms)
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {antonyms.map((ant, i) => (
                        <Badge key={i} variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                          {ant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Usage Notes */}
            {usageNotes && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-amber-600">
                  <Lightbulb className="w-3 h-3" />
                  ملاحظات الاستخدام
                </Label>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                  {usageNotes}
                </div>
              </div>
            )}

            {/* Sentences */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  الجمل التوضيحية
                </Label>
                <Button variant="outline" size="sm" onClick={addSentence}>
                  <Plus className="w-4 h-4 mr-1" />
                  إضافة جملة
                </Button>
              </div>

              {sentences.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {sentences.map((sentence, index) => (
                    <motion.div
                      key={sentence.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="relative"
                    >
                      <Card className={cn(
                        "border-0 bg-gray-50 dark:bg-gray-800/50",
                        sentence.isAiGenerated && "border-l-2 border-l-violet-500"
                      )}>
                        <CardContent className="p-4 space-y-3">
                          <Input
                            placeholder="الجملة بالإنجليزية"
                            value={sentence.sentence}
                            onChange={(e) => updateSentence(index, 'sentence', e.target.value)}
                            className="font-mono text-sm"
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="الترجمة العربية"
                              value={sentence.translation}
                              onChange={(e) => updateSentence(index, 'translation', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSentence(index)}
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          {sentence.isAiGenerated && (
                            <Badge variant="outline" className="text-violet-600 border-violet-300 text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !word.trim() || !translation.trim() || !!duplicateWarning}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              إضافة الكلمة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      />
    </>
  )
}
