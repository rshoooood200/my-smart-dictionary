'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, MessageSquare, Volume2, ChevronRight, Star,
  GraduationCap, Lightbulb, Pen, Calculator, Clock,
  Users, Heart, CheckCircle2, XCircle, RefreshCw, Bookmark,
  Filter, Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// أنواع المحتوى التعليمي
interface GrammarRule {
  id: string
  title: string
  titleAr: string
  explanation: string
  examples: { en: string; ar: string }[]
  tips: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
}

interface CommonPhrase {
  id: string
  phrase: string
  translation: string
  pronunciation?: string
  usage: string
  category: string
  formality: 'formal' | 'informal' | 'neutral'
}

interface PronunciationTip {
  id: string
  sound: string
  example: string
  tip: string
  commonMistake: string
}

// قواعد اللغة
const GRAMMAR_RULES: GrammarRule[] = [
  {
    id: 'present-simple',
    title: 'Present Simple Tense',
    titleAr: 'المضارع البسيط',
    explanation: 'يُستخدم للتعبير عن العادات والحقائق الثابتة والأحداث المتكررة.',
    examples: [
      { en: 'She walks to school every day.', ar: 'هي تمشي إلى المدرسة كل يوم.' },
      { en: 'Water boils at 100°C.', ar: 'الماء يغلي عند 100 درجة مئوية.' },
      { en: 'I play football on weekends.', ar: 'ألعب كرة القدم في عطلة نهاية الأسبوع.' },
    ],
    tips: [
      'للضمائر (he, she, it) نضيف s أو es للفعل',
      'في النفي نستخدم do not / does not',
      'في السؤال نستخدم Do / Does في البداية',
    ],
    difficulty: 'beginner',
    category: 'الأزمنة',
  },
  {
    id: 'present-continuous',
    title: 'Present Continuous Tense',
    titleAr: 'المضارع المستمر',
    explanation: 'يُستخدم للأحداث التي تحدث الآن أو في الوقت الحالي.',
    examples: [
      { en: 'She is reading a book right now.', ar: 'هي تقرأ كتاباً الآن.' },
      { en: 'They are playing football.', ar: 'هم يلعبون كرة القدم.' },
      { en: 'I am studying English.', ar: 'أنا أدرس اللغة الإنجليزية.' },
    ],
    tips: [
      'الصيغة: am/is/are + verb-ing',
      'بعض الأفعال لا تُستخدم في المستمر مثل: like, love, know',
      'يُستخدم مع كلمات مثل: now, at the moment, currently',
    ],
    difficulty: 'beginner',
    category: 'الأزمنة',
  },
  {
    id: 'past-simple',
    title: 'Past Simple Tense',
    titleAr: 'الماضي البسيط',
    explanation: 'يُستخدم للأحداث التي انتهت في الماضي.',
    examples: [
      { en: 'I visited Paris last year.', ar: 'زرت باريس العام الماضي.' },
      { en: 'She bought a new car yesterday.', ar: 'اشترت سيارة جديدة أمس.' },
      { en: 'They played tennis last weekend.', ar: 'لعبوا التنس في عطلة نهاية الأسبوع الماضية.' },
    ],
    tips: [
      'الأفعال المنتظمة تضاف لها -ed',
      'الأفعال الشاذة تحفظ (go → went, buy → bought)',
      'في النفي نستخدم did not + الفعل الأساسي',
    ],
    difficulty: 'beginner',
    category: 'الأزمنة',
  },
  {
    id: 'articles',
    title: 'Articles (a, an, the)',
    titleAr: 'أدوات التعريف والتنكير',
    explanation: 'أدوات تُستخدم قبل الأسماء لتحديد معرفتها.',
    examples: [
      { en: 'I saw a cat in the street.', ar: 'رأيت قطة في الشارع.' },
      { en: 'She is an engineer.', ar: 'هي مهندسة.' },
      { en: 'The sun rises in the east.', ar: 'تشرق الشمس من الشرق.' },
    ],
    tips: [
      'a: قبل الحروف الساكنة (a book)',
      'an: قبل حروف العلة (an apple)',
      'the: لشيء محدد أو معروف',
    ],
    difficulty: 'beginner',
    category: 'أساسيات',
  },
  {
    id: 'conditionals',
    title: 'Conditionals',
    titleAr: 'الجمل الشرطية',
    explanation: 'جمل تعبر عن شروط ونتائج.',
    examples: [
      { en: 'If it rains, I will stay home.', ar: 'إذا أمطرت، سأبقى في المنزل.' },
      { en: 'If I had money, I would buy a car.', ar: 'لو كان لدي مال، لاشتريت سيارة.' },
      { en: 'If I had studied, I would have passed.', ar: 'لو درست، لكنت نجحت.' },
    ],
    tips: [
      'الشرطية الصفرية: If + present, present (حقائق)',
      'الشرطية الأولى: If + present, will + verb (احتمالات)',
      'الشرطية الثانية: If + past, would + verb (أحلام)',
    ],
    difficulty: 'intermediate',
    category: 'متقدم',
  },
]

// التعابير الشائعة
const COMMON_PHRASES: CommonPhrase[] = [
  // التحيات
  { id: 'p1', phrase: "How's it going?", translation: 'كيف الأمور؟', usage: 'سؤال ودّي عن الأحوال', category: 'التحيات', formality: 'informal' },
  { id: 'p2', phrase: "What's up?", translation: 'ما الأخبار؟', usage: 'تحية ودية بين الأصدقاء', category: 'التحيات', formality: 'informal' },
  { id: 'p3', phrase: 'Nice to meet you', translation: 'سررت بلقائك', usage: 'عند التعارف لأول مرة', category: 'التحيات', formality: 'neutral' },
  { id: 'p4', phrase: 'Long time no see', translation: 'لم أرك منذ وقت طويل', usage: 'عند لقاء شخص بعد غياب', category: 'التحيات', formality: 'informal' },
  
  // الشكر والاعتذار
  { id: 'p5', phrase: 'I really appreciate it', translation: 'أقدر ذلك حقاً', usage: 'شكر بعمق', category: 'الشكر', formality: 'neutral' },
  { id: 'p6', phrase: "You're welcome", translation: 'على الرحب والسعة', usage: 'رد على الشكر', category: 'الشكر', formality: 'neutral' },
  { id: 'p7', phrase: "I'm sorry for the inconvenience", translation: 'أعتذر عن الإزعاج', usage: 'اعتذار رسمي', category: 'الاعتذار', formality: 'formal' },
  { id: 'p8', phrase: 'My apologies', translation: 'أعتذر', usage: 'اعتذار قصير رسمي', category: 'الاعتذار', formality: 'formal' },
  
  // الطلبات
  { id: 'p9', phrase: 'Could you please...?', translation: 'هل يمكنك من فضلك...؟', usage: 'طلب مهذب', category: 'الطلبات', formality: 'formal' },
  { id: 'p10', phrase: "Would you mind...?", translation: 'هل تمانع في...؟', usage: 'طلب مهذب جداً', category: 'الطلبات', formality: 'formal' },
  { id: 'p11', phrase: 'Can you give me a hand?', translation: 'هل يمكنك مساعدتي؟', usage: 'طلب مساعدة ودي', category: 'الطلبات', formality: 'informal' },
  { id: 'p12', phrase: 'I was wondering if...', translation: 'كنت أتساءل إذا...', usage: 'طلب بطريقة غير مباشرة', category: 'الطلبات', formality: 'neutral' },
  
  // الموافقة والرفض
  { id: 'p13', phrase: 'That sounds great!', translation: 'يبدو ذلك رائعاً!', usage: 'موافقة بحماس', category: 'الموافقة', formality: 'informal' },
  { id: 'p14', phrase: "I'd love to, but...", translation: 'أود ذلك، لكن...', usage: 'رفض مهذب', category: 'الرفض', formality: 'neutral' },
  { id: 'p15', phrase: "I'm afraid I can't", translation: 'أخشى أنني لا أستطيع', usage: 'رفض مهذب', category: 'الرفض', formality: 'formal' },
  { id: 'p16', phrase: 'Count me in!', translation: 'احسبني معكم!', usage: 'موافقة بحماس', category: 'الموافقة', formality: 'informal' },
  
  // التعبير عن الرأي
  { id: 'p17', phrase: 'In my opinion...', translation: 'في رأيي...', usage: 'بدء تعبير عن رأي', category: 'الآراء', formality: 'neutral' },
  { id: 'p18', phrase: "I couldn't agree more", translation: 'أوافقك الرأي تماماً', usage: 'موافقة تامة', category: 'الآراء', formality: 'formal' },
  { id: 'p19', phrase: "I see your point, but...", translation: 'أفهم وجهة نظرك، لكن...', usage: 'اعتراض مهذب', category: 'الآراء', formality: 'neutral' },
  { id: 'p20', phrase: 'That makes sense', translation: 'هذا منطقي', usage: 'تقبل فكرة', category: 'الآراء', formality: 'neutral' },
  
  // نهاية المحادثة
  { id: 'p21', phrase: 'I should get going', translation: 'يجب أن أذهب', usage: 'بدء إنهاء المحادثة', category: 'الوداع', formality: 'informal' },
  { id: 'p22', phrase: 'Take care!', translation: 'اعتنِ بنفسك!', usage: 'وداع ودّي', category: 'الوداع', formality: 'informal' },
  { id: 'p23', phrase: 'See you later', translation: 'أراك لاحقاً', usage: 'وداع غير رسمي', category: 'الوداع', formality: 'informal' },
  { id: 'p24', phrase: 'Have a good one!', translation: 'يوماً سعيداً!', usage: 'وداع عام', category: 'الوداع', formality: 'informal' },
]

// نصائح النطق
const PRONUNCIATION_TIPS: PronunciationTip[] = [
  { id: 'th', sound: 'th', example: 'think, this', tip: 'ضع لسانك بين الأسنان العلوية والسفلية', commonMistake: 'لا تنطقها مثل t أو s' },
  { id: 'r', sound: 'r', example: 'red, car', tip: 'لا تلفظها مثل الراء العربية، اجعلها ناعمة', commonMistake: 'لفظها كراء عربية شديدة' },
  { id: 'v', sound: 'v', example: 'very, love', tip: 'ضع أسنانك العلوية على الشفة السفلية', commonMistake: 'الخلط مع f' },
  { id: 'w', sound: 'w', example: 'water, what', tip: 'دائر شفتيك كأنك ستنفخ', commonMistake: 'الخلط مع v' },
  { id: 'ng', sound: 'ng', example: 'sing, thing', tip: 'اجعل الصوت يخرج من الأنف', commonMistake: 'نطق g بشكل منفصل' },
  { id: 'schwa', sound: 'ə', example: 'about, banana', tip: 'صوت ضعيف مختلط بين a و e', commonMistake: 'نطقه بوضوح' },
]

// المكون الرئيسي
export function LearningSection() {
  const [activeTab, setActiveTab] = useState('grammar')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<{ type: string; index: number; score: number } | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  
  // تصفية القواعد
  const filteredGrammar = useMemo(() => {
    return GRAMMAR_RULES.filter(rule => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!rule.title.toLowerCase().includes(query) && 
            !rule.titleAr.includes(query) &&
            !rule.explanation.includes(query)) {
          return false
        }
      }
      if (selectedCategory && rule.category !== selectedCategory) {
        return false
      }
      return true
    })
  }, [searchQuery, selectedCategory])
  
  // تصفية التعابير
  const filteredPhrases = useMemo(() => {
    return COMMON_PHRASES.filter(phrase => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!phrase.phrase.toLowerCase().includes(query) && 
            !phrase.translation.includes(query)) {
          return false
        }
      }
      if (selectedCategory && phrase.category !== selectedCategory) {
        return false
      }
      return true
    })
  }, [searchQuery, selectedCategory])
  
  // الفئات المتاحة
  const grammarCategories = [...new Set(GRAMMAR_RULES.map(r => r.category))]
  const phraseCategories = [...new Set(COMMON_PHRASES.map(p => p.category))]
  
  // تبديل المفضلة
  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    )
    toast.success(favorites.includes(id) ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة')
  }
  
  // نطق النص
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }
  
  return (
    <div className="space-y-4">
      {/* شريط البحث والفلترة */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="ابحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSelectedCategory(selectedCategory ? '' : grammarCategories[0])}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>
      
      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grammar">
            <BookOpen className="w-4 h-4 mr-1" />
            القواعد
          </TabsTrigger>
          <TabsTrigger value="phrases">
            <MessageSquare className="w-4 h-4 mr-1" />
            التعابير
          </TabsTrigger>
          <TabsTrigger value="pronunciation">
            <Volume2 className="w-4 h-4 mr-1" />
            النطق
          </TabsTrigger>
        </TabsList>
        
        {/* تبويب القواعد */}
        <TabsContent value="grammar" className="space-y-4 mt-4">
          {filteredGrammar.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">لا توجد قواعد مطابقة</p>
              </CardContent>
            </Card>
          ) : (
            filteredGrammar.map((rule) => (
              <Card key={rule.id} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{rule.titleAr}</CardTitle>
                      <CardDescription>{rule.title}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={
                        rule.difficulty === 'beginner' ? 'default' :
                        rule.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                      }>
                        {rule.difficulty === 'beginner' ? 'مبتدئ' :
                         rule.difficulty === 'intermediate' ? 'متوسط' : 'متقدم'}
                      </Badge>
                      <Badge variant="outline">{rule.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">{rule.explanation}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      أمثلة:
                    </h4>
                    <div className="space-y-2">
                      {rule.examples.map((ex, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => speak(ex.en)}
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                          <div>
                            <p className="font-medium">{ex.en}</p>
                            <p className="text-sm text-gray-500">{ex.ar}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Pen className="w-4 h-4 text-violet-500" />
                      نصائح:
                    </h4>
                    <ul className="space-y-1">
                      {rule.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        {/* تبويب التعابير */}
        <TabsContent value="phrases" className="space-y-4 mt-4">
          {/* فئات التعابير */}
          <div className="flex flex-wrap gap-2">
            {phraseCategories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          
          {/* قائمة التعابير */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPhrases.map((phrase) => (
              <Card
                key={phrase.id}
                className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-all"
                onClick={() => speak(phrase.phrase)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{phrase.phrase}</p>
                      <p className="text-gray-600 dark:text-gray-400">{phrase.translation}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(phrase.id)
                      }}
                    >
                      <Star className={cn(
                        "w-4 h-4",
                        favorites.includes(phrase.id) && "fill-amber-400 text-amber-400"
                      )} />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{phrase.usage}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">{phrase.category}</Badge>
                    <Badge variant={
                      phrase.formality === 'formal' ? 'default' :
                      phrase.formality === 'informal' ? 'secondary' : 'outline'
                    } className="text-xs">
                      {phrase.formality === 'formal' ? 'رسمي' :
                       phrase.formality === 'informal' ? 'غير رسمي' : 'محايد'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* تبويب النطق */}
        <TabsContent value="pronunciation" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-xl">
                  <Volume2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">نصائح النطق</h2>
                  <p className="text-white/80">تعلم كيف تنطق الأصوات الصعبة بشكل صحيح</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRONUNCIATION_TIPS.map((tip) => (
              <Card key={tip.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <span className="text-2xl font-bold text-violet-600">/{tip.sound}/</span>
                    </div>
                    <div>
                      <p className="font-bold">{tip.example}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => speak(tip.example.split(', ')[0])}
                      >
                        <Volume2 className="w-3 h-3 mr-1" />
                        استمع
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm">{tip.tip}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-500">الخطأ الشائع: {tip.commonMistake}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
