'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, BookOpen, Lightbulb, Sparkles, Loader2, ChevronDown, ChevronUp,
  FileText, Wand2, Info
} from 'lucide-react'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'
import { cn } from '@/lib/utils'

interface AddWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddWordDialog({ open, onOpenChange }: AddWordDialogProps) {
  const { categories, addWord } = useVocabStore()
  
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [pronunciation, setPronunciation] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')
  const [level, setLevel] = useState('beginner')
  const [categoryId, setCategoryId] = useState('')
  
  // تراكيب الفعل
  const [pastTense, setPastTense] = useState('')
  const [pastParticiple, setPastParticiple] = useState('')
  const [presentTense, setPresentTense] = useState('')
  const [gerund, setGerund] = useState('')
  const [thirdPerson, setThirdPerson] = useState('')
  
  // تراكيب الاسم
  const [singular, setSingular] = useState('')
  const [plural, setPlural] = useState('')
  const [countable, setCountable] = useState(true)
  
  // تراكيب الصفة
  const [comparative, setComparative] = useState('')
  const [superlative, setSuperlative] = useState('')
  const [adverb, setAdverb] = useState('')
  
  // معلومات إضافية
  const [example1, setExample1] = useState('')
  const [example2, setExample2] = useState('')
  const [synonyms, setSynonyms] = useState('')
  const [antonyms, setAntonyms] = useState('')
  const [arabicMeaning, setArabicMeaning] = useState('')
  const [englishDefinition, setEnglishDefinition] = useState('')
  const [context, setContext] = useState('')
  
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const resetForm = () => {
    setWord('')
    setTranslation('')
    setEnglishDefinition('')
    setPronunciation('')
    setPartOfSpeech('')
    setLevel('beginner')
    setCategoryId('')
    setPastTense('')
    setPastParticiple('')
    setPresentTense('')
    setGerund('')
    setThirdPerson('')
    setSingular('')
    setPlural('')
    setCountable(true)
    setComparative('')
    setSuperlative('')
    setAdverb('')
    setExample1('')
    setExample2('')
    setSynonyms('')
    setAntonyms('')
    setArabicMeaning('')
    setContext('')
    setShowAdvanced(false)
  }

const handleGenerateInfo = async () => {
  if (!word.trim()) {
    toast.error('الرجاء إدخال الكلمة أولاً')
    return
    if (data.definition) setEnglishDefinition(data.definition)
  }
  
  setIsGenerating(true)
  try {
    const response = await fetch('/api/word-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: word.trim() })
    })
    
    if (!response.ok) throw new Error('Failed to generate')
    
    const result = await response.json()
    
    // التحقق من نجاح العملية
    if (!result.success || !result.data) {
      throw new Error(result.error || 'فشل في الحصول على البيانات')
    }
    
    const data = result.data
    
    // التحقق من التهجئة
    if (!data.isCorrect && data.correctWord) {
      toast.info(`تم تصحيح الكلمة إلى: ${data.correctWord}`)
      setWord(data.correctWord)
    }
    
    if (data.translation) setTranslation(data.translation)
    if (data.pronunciation) setPronunciation(data.pronunciation)
    if (data.partOfSpeech) setPartOfSpeech(data.partOfSpeech)
    if (data.level) setLevel(data.level)
    if (data.definition) setArabicMeaning(data.definition)
    
    // تراكيب الفعل
    if (data.verbForms) {
      if (data.verbForms.past) setPastTense(data.verbForms.past)
      if (data.verbForms.pastParticiple) setPastParticiple(data.verbForms.pastParticiple)
      if (data.verbForms.present) setPresentTense(data.verbForms.present)
      if (data.verbForms.gerund) setGerund(data.verbForms.gerund)
      if (data.verbForms.thirdPerson) setThirdPerson(data.verbForms.thirdPerson)
    }
    
    // تراكيب الاسم
    if (data.nounForms) {
      if (data.nounForms.singular) setSingular(data.nounForms.singular)
      if (data.nounForms.plural) setPlural(data.nounForms.plural)
    }
    
    // تراكيب الصفة
    if (data.adjectiveForms) {
      if (data.adjectiveForms.comparative) setComparative(data.adjectiveForms.comparative)
      if (data.adjectiveForms.superlative) setSuperlative(data.adjectiveForms.superlative)
      if (data.adjectiveForms.adverb) setAdverb(data.adjectiveForms.adverb)
    }
    
    // أمثلة
    if (data.examples && data.examples.length > 0) {
      setExample1(data.examples[0] || '')
      setExample2(data.examples[1] || '')
    }
    
    // مرادفات وأضداد
    if (data.synonyms && data.synonyms.length > 0) {
      setSynonyms(data.synonyms.join(', '))
    }
    if (data.antonyms && data.antonyms.length > 0) {
      setAntonyms(data.antonyms.join(', '))
    }
    if (data.arabicMeaning) setArabicMeaning(data.arabicMeaning)
    
    toast.success('تم توليد المعلومات بنجاح!')
  } catch (error) {
    console.error(error)
    toast.error('فشل في توليد المعلومات')
  } finally {
    setIsGenerating(false)
  }
}

  const handleSubmit = () => {
    if (!word.trim() || !translation.trim()) {
      toast.error('الرجاء إدخال الكلمة والترجمة')
      return
    }

    const examples: string[] = []
    if (example1.trim()) examples.push(example1.trim())
    if (example2.trim()) examples.push(example2.trim())

    addWord({
      word: word.trim(),
      translation: translation.trim(),
      definition: englishDefinition.trim() || undefined,
      pronunciation: pronunciation.trim() || undefined,
      partOfSpeech: partOfSpeech || undefined,
      level,
      categoryId: categoryId || undefined,
      verbForms: partOfSpeech === 'verb' ? {
        past: pastTense.trim() || undefined,
        pastParticiple: pastParticiple.trim() || undefined,
        present: presentTense.trim() || undefined,
        gerund: gerund.trim() || undefined,
        thirdPerson: thirdPerson.trim() || undefined,
      } : undefined,
      nounForms: partOfSpeech === 'noun' ? {
        singular: singular.trim() || undefined,
        plural: plural.trim() || undefined,
        countable,
      } : undefined,
      adjectiveForms: partOfSpeech === 'adjective' ? {
        comparative: comparative.trim() || undefined,
        superlative: superlative.trim() || undefined,
        adverb: adverb.trim() || undefined,
      } : undefined,
      examples: examples.length > 0 ? examples : undefined,
      synonyms: synonyms.trim() ? synonyms.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      antonyms: antonyms.trim() ? antonyms.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      arabicMeaning: arabicMeaning.trim() || undefined,
      context: context.trim() || undefined,
    })

    toast.success('تمت إضافة الكلمة بنجاح!')
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="w-5 h-5 text-emerald-600" />
            إضافة كلمة جديدة
          </DialogTitle>
          <DialogDescription>
            أضف كلمة جديدة مع جميع تفاصيلها وتراكيبها
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* الكلمة الأساسية */}
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                الكلمة الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="word">الكلمة بالإنجليزية *</Label>
                  <Input
                    id="word"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="مثال: beautiful"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="translation">الترجمة بالعربي *</Label>
                  <Input
                    id="translation"
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    placeholder="مثال: جميل"
                  />
                </div>
              </div>
              
              <Button
                variant="outline"
                className="w-full border-emerald-300 hover:bg-emerald-100"
                onClick={handleGenerateInfo}
                disabled={isGenerating || !word.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    توليد تلقائي بالذكاء الاصطناعي
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* معلومات أساسية */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>النطق</Label>
                  <Input
                    value={pronunciation}
                    onChange={(e) => setPronunciation(e.target.value)}
                    placeholder="/ˈbjuːtɪfəl/"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع الكلمة</Label>
                  <Select value={partOfSpeech} onValueChange={setPartOfSpeech}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noun">اسم (Noun)</SelectItem>
                      <SelectItem value="verb">فعل (Verb)</SelectItem>
                      <SelectItem value="adjective">صفة (Adjective)</SelectItem>
                      <SelectItem value="adverb">ظرف (Adverb)</SelectItem>
                      <SelectItem value="preposition">حرف جر</SelectItem>
                      <SelectItem value="conjunction">حرف عطف</SelectItem>
                      <SelectItem value="pronoun">ضمير</SelectItem>
                      <SelectItem value="interjection">حرف تعجب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المستوى</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">مبتدئ</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="advanced">متقدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nameAr || cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
  <Label>التعريف بالإنجليزي</Label>
  <Textarea
    value={englishDefinition}
    onChange={(e) => setEnglishDefinition(e.target.value)}
    placeholder="The definition of the word in English..."
    rows={2}
  />
</div>

          {/* تراكيب الفعل */}
          {partOfSpeech === 'verb' && (
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  تصريفات الفعل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الماضي (Past)</Label>
                    <Input
                      value={pastTense}
                      onChange={(e) => setPastTense(e.target.value)}
                      placeholder="worked"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>التصريف الثالث (Past Participle)</Label>
                    <Input
                      value={pastParticiple}
                      onChange={(e) => setPastParticiple(e.target.value)}
                      placeholder="worked"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المضارع (Present)</Label>
                    <Input
                      value={presentTense}
                      onChange={(e) => setPresentTense(e.target.value)}
                      placeholder="work"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>صيغة ing (Gerund)</Label>
                    <Input
                      value={gerund}
                      onChange={(e) => setGerund(e.target.value)}
                      placeholder="working"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الغائب (Third Person)</Label>
                    <Input
                      value={thirdPerson}
                      onChange={(e) => setThirdPerson(e.target.value)}
                      placeholder="works"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تراكيب الاسم */}
          {partOfSpeech === 'noun' && (
            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  تصريفات الاسم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المفرد (Singular)</Label>
                    <Input
                      value={singular}
                      onChange={(e) => setSingular(e.target.value)}
                      placeholder="book"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الجمع (Plural)</Label>
                    <Input
                      value={plural}
                      onChange={(e) => setPlural(e.target.value)}
                      placeholder="books"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تراكيب الصفة */}
          {partOfSpeech === 'adjective' && (
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  تصريفات الصفة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>التفضيل (Comparative)</Label>
                    <Input
                      value={comparative}
                      onChange={(e) => setComparative(e.target.value)}
                      placeholder="bigger"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>أفعل التفضيل (Superlative)</Label>
                    <Input
                      value={superlative}
                      onChange={(e) => setSuperlative(e.target.value)}
                      placeholder="biggest"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الظرف (Adverb)</Label>
                    <Input
                      value={adverb}
                      onChange={(e) => setAdverb(e.target.value)}
                      placeholder="quickly"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* زر إظهار/إخفاء التفاصيل المتقدمة */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="w-4 h-4 ml-2" />
                إخفاء التفاصيل المتقدمة
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 ml-2" />
                إظهار التفاصيل المتقدمة
              </>
            )}
          </Button>

          {/* تفاصيل متقدمة */}
          {showAdvanced && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  تفاصيل إضافية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* الأمثلة */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    أمثلة
                  </Label>
                  <Input
                    value={example1}
                    onChange={(e) => setExample1(e.target.value)}
                    placeholder="مثال 1: She is a beautiful girl."
                  />
                  <Input
                    value={example2}
                    onChange={(e) => setExample2(e.target.value)}
                    placeholder="مثال 2: What a beautiful day!"
                  />
                </div>

                <Separator />

                {/* المرادفات والأضداد */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المرادفات (مفصولة بفاصلة)</Label>
                    <Input
                      value={synonyms}
                      onChange={(e) => setSynonyms(e.target.value)}
                      placeholder="pretty, lovely, gorgeous"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الأضداد (مفصولة بفاصلة)</Label>
                    <Input
                      value={antonyms}
                      onChange={(e) => setAntonyms(e.target.value)}
                      placeholder="ugly, unattractive"
                    />
                  </div>
                </div>

                <Separator />

                {/* معنى إضافي */}
                <div className="space-y-2">
                  <Label>معنى إضافي بالعربي</Label>
                  <Textarea
                    value={arabicMeaning}
                    onChange={(e) => setArabicMeaning(e.target.value)}
                    placeholder="شرح مفصل للكلمة بالعربي..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>سياق الاستخدام</Label>
                  <Textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="متى وكيف تستخدم هذه الكلمة..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* أزرار الحفظ */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={!word.trim() || !translation.trim()}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة الكلمة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
