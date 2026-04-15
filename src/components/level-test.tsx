'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Clock, CheckCircle2, XCircle, Trophy, Star,
  ChevronRight, RefreshCw, BarChart3, Target, BookOpen,
  MessageSquare, Volume2, Award, TrendingUp, AlertCircle,
  Lightbulb, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// مستويات اللغة
type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

// أنواع الأسئلة
type QuestionType = 'grammar' | 'vocabulary' | 'reading' | 'listening'

interface Question {
  id: string
  type: QuestionType
  level: Level
  question: string
  questionAr?: string
  options: string[]
  correctAnswer: string
  explanation?: string
}

interface TestResult {
  level: Level
  score: number
  totalQuestions: number
  correctAnswers: number
  grammarScore: number
  vocabularyScore: number
  readingScore: number
  listeningScore: number
  recommendations: string[]
  strengths: string[]
  weaknesses: string[]
}

// معلومات المستويات
const LEVEL_INFO: Record<Level, { name: string; nameAr: string; description: string; color: string; range: string }> = {
  A1: { name: 'Beginner', nameAr: 'مبتدئ', description: 'أستطيع فهم جمل بسيطة والتعبير عن نفسي بمفردات أساسية', color: 'emerald', range: '0-20%' },
  A2: { name: 'Elementary', nameAr: 'ابتدائي', description: 'أستطيع التواصل في مواقف يومية بسيطة', color: 'teal', range: '21-35%' },
  B1: { name: 'Intermediate', nameAr: 'متوسط', description: 'أستطيع فهم النصوص الرئيسية والتعبير عن رأيي', color: 'amber', range: '36-55%' },
  B2: { name: 'Upper-Intermediate', nameAr: 'فوق المتوسط', description: 'أستطيع فهم الأفلام والمقالات المعقدة', color: 'orange', range: '56-75%' },
  C1: { name: 'Advanced', nameAr: 'متقدم', description: 'أستطيع التعبير بطلاقة عن المواضيع المعقدة', color: 'rose', range: '76-90%' },
  C2: { name: 'Proficiency', nameAr: 'إجادة', description: 'مستوى قريب من الناطق الأصلي', color: 'violet', range: '91-100%' },
}

// أسئلة الاختبار
const TEST_QUESTIONS: Question[] = [
  // A1 - مبتدئ
  {
    id: 'a1-1',
    type: 'grammar',
    level: 'A1',
    question: 'She ___ a student.',
    questionAr: 'هي ___ طالبة.',
    options: ['is', 'are', 'am', 'be'],
    correctAnswer: 'is',
    explanation: 'نستخدم is مع الضمائر he, she, it',
  },
  {
    id: 'a1-2',
    type: 'vocabulary',
    level: 'A1',
    question: 'What is the opposite of "big"?',
    questionAr: 'ما عكس كلمة "big"؟',
    options: ['tall', 'small', 'long', 'short'],
    correctAnswer: 'small',
  },
  {
    id: 'a1-3',
    type: 'grammar',
    level: 'A1',
    question: 'I ___ football every day.',
    questionAr: 'أنا ___ كرة القدم كل يوم.',
    options: ['play', 'plays', 'playing', 'played'],
    correctAnswer: 'play',
    explanation: 'في المضارع البسيط، نستخدم الفعل الأساسي مع I, you, we, they',
  },
  
  // A2 - ابتدائي
  {
    id: 'a2-1',
    type: 'grammar',
    level: 'A2',
    question: 'I ___ to the cinema yesterday.',
    questionAr: 'ذهبت إلى السينما ___ أمس.',
    options: ['go', 'went', 'going', 'goes'],
    correctAnswer: 'went',
    explanation: 'في الماضي البسيط، الأفعال الشاذة تتغير (go → went)',
  },
  {
    id: 'a2-2',
    type: 'vocabulary',
    level: 'A2',
    question: 'The book is ___ the table.',
    questionAr: 'الكتاب ___ الطاولة.',
    options: ['in', 'on', 'at', 'under'],
    correctAnswer: 'on',
  },
  {
    id: 'a2-3',
    type: 'reading',
    level: 'A2',
    question: '"John went to the store to buy some milk." What did John want to buy?',
    questionAr: '"ذهب جون إلى المتجر ليشتري حليباً." ماذا أراد جون أن يشتري؟',
    options: ['Bread', 'Milk', 'Eggs', 'Water'],
    correctAnswer: 'Milk',
  },
  
  // B1 - متوسط
  {
    id: 'b1-1',
    type: 'grammar',
    level: 'B1',
    question: 'If I ___ rich, I would travel the world.',
    questionAr: 'لو كنت غنياً، ___ حول العالم.',
    options: ['am', 'was', 'were', 'be'],
    correctAnswer: 'were',
    explanation: 'في الشرطية الثانية (تخيلية)، نستخدم were مع جميع الضمائر',
  },
  {
    id: 'b1-2',
    type: 'vocabulary',
    level: 'B1',
    question: 'The word "reluctant" means:',
    questionAr: 'كلمة "reluctant" تعني:',
    options: ['Eager', 'Unwilling', 'Happy', 'Curious'],
    correctAnswer: 'Unwilling',
  },
  {
    id: 'b1-3',
    type: 'grammar',
    level: 'B1',
    question: 'She has been studying English ___ three years.',
    questionAr: 'هي تدرس الإنجليزية ___ ثلاث سنوات.',
    options: ['since', 'for', 'during', 'while'],
    correctAnswer: 'for',
    explanation: 'نستخدم for مع فترات زمنية (three years)، و since مع نقاط زمنية',
  },
  
  // B2 - فوق المتوسط
  {
    id: 'b2-1',
    type: 'grammar',
    level: 'B2',
    question: 'Had I known about the meeting, I ___ attended.',
    questionAr: 'لو كنت أعرف عن الاجتماع، ___ لحضرت.',
    options: ['would have', 'will have', 'had', 'would'],
    correctAnswer: 'would have',
    explanation: 'في الشرطية الثالثة (الماضي المستحيل)، نستخدم would have + past participle',
  },
  {
    id: 'b2-2',
    type: 'vocabulary',
    level: 'B2',
    question: 'The politician\'s speech was full of "rhetoric" but lacked substance. Rhetoric means:',
    questionAr: 'خطاب السياسي كان مليئاً بـ "rhetoric" لكنه يفتقر للمضمون. Rhetoric تعني:',
    options: ['Facts', 'Persuasive language', 'Evidence', 'Statistics'],
    correctAnswer: 'Persuasive language',
  },
  {
    id: 'b2-3',
    type: 'reading',
    level: 'B2',
    question: '"Despite the adverse conditions, the team persevered." The team:',
    questionAr: '"رغم الظروف الصعبة، استمر الفريق." الفريق:',
    options: ['Gave up', 'Kept going', 'Complained', 'Left'],
    correctAnswer: 'Kept going',
  },
  
  // C1 - متقدم
  {
    id: 'c1-1',
    type: 'grammar',
    level: 'C1',
    question: 'Not only ___ the problem, but he also solved it.',
    questionAr: 'ليس فقط ___ المشكلة، بل حلهها أيضاً.',
    options: ['he identified', 'did he identify', 'he did identify', 'identifying'],
    correctAnswer: 'did he identify',
    explanation: 'عند بدء الجملة بـ Not only، نستخدم صيغة السؤال (inversion)',
  },
  {
    id: 'c1-2',
    type: 'vocabulary',
    level: 'C1',
    question: 'The word "ubiquitous" is closest in meaning to:',
    questionAr: 'كلمة "ubiquitous" أقرب في المعنى لـ:',
    options: ['Rare', 'Present everywhere', 'Unique', 'Invisible'],
    correctAnswer: 'Present everywhere',
  },
  {
    id: 'c1-3',
    type: 'reading',
    level: 'C1',
    question: '"The novel\'s protagonist is an enigmatic figure whose motivations remain opaque throughout the narrative." The protagonist is:',
    questionAr: 'بطل الرواية شخصية غامضة التي تظل دوافعها غير واضحة طوال السرد. البطل:',
    options: ['Clear and predictable', 'Mysterious and unclear', 'Boring', 'Funny'],
    correctAnswer: 'Mysterious and unclear',
  },
  
  // C2 - إجادة
  {
    id: 'c2-1',
    type: 'grammar',
    level: 'C2',
    question: '___ it not for the timely intervention, the crisis would have escalated.',
    questionAr: '___ التدخل في الوقت المناسب، لأزمت الأزمة.',
    options: ['Were', 'Had', 'Should', 'Be'],
    correctAnswer: 'Were',
    explanation: 'صيغة شرطية مختصرة: Were it not for = If it were not for',
  },
  {
    id: 'c2-2',
    type: 'vocabulary',
    level: 'C2',
    question: 'The author\'s writing style is characterized by its "verisimilitude" - the quality of:',
    questionAr: 'أسلوب الكاتب يتميز بـ "verisimilitude" - صفة:',
    options: ['Being true', 'Appearing true', 'Being false', 'Being complex'],
    correctAnswer: 'Appearing true',
  },
  {
    id: 'c2-3',
    type: 'reading',
    level: 'C2',
    question: '"The scientist\'s theory, though initially met with skepticism, eventually gained traction in academic circles, becoming a cornerstone of modern physics." The theory:',
    questionAr: 'نظرية العالم، رغم أنها قوبلت في البداية بالشك، اكتسبت في النهاية زخماً في الأوساط الأكاديمية، لتصبح حجر أساس في الفيزياء الحديثة. النظرية:',
    options: ['Was immediately accepted', 'Was rejected permanently', 'Gained acceptance over time', 'Was forgotten'],
    correctAnswer: 'Gained acceptance over time',
  },
]

export function LevelTest() {
  const [isStarted, setIsStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 دقيقة
  const [isActive, setIsActive] = useState(false)
  
  // تحديد الأسئلة بناءً على الأداء
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<Question[]>([])
  const [currentLevel, setCurrentLevel] = useState<Level>('A1')
  
  // إعداد الأسئلة
  useEffect(() => {
    // نبدأ بأسئلة من مستويات مختلفة
    const selected: Question[] = []
    const levels: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    
    // نختار 3 أسئلة من كل مستوى
    levels.forEach(level => {
      const levelQuestions = TEST_QUESTIONS.filter(q => q.level === level)
      selected.push(...levelQuestions)
    })
    
    setAdaptiveQuestions(selected)
  }, [])
  
  // المؤقت
  useEffect(() => {
    if (!isActive || isFinished) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isActive, isFinished])
  
  // بدء الاختبار
  const startTest = useCallback(() => {
    setIsStarted(true)
    setIsActive(true)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResult(false)
    setSelectedAnswer(null)
    setIsFinished(false)
    setResult(null)
    setTimeLeft(15 * 60)
  }, [])
  
  // الإجابة على سؤال
  const handleAnswer = useCallback((answer: string) => {
    if (showResult) return
    
    setSelectedAnswer(answer)
    setShowResult(true)
    
    const currentQuestion = adaptiveQuestions[currentQuestionIndex]
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
    
    // تحديث المستوى التكيفي
    const isCorrect = answer === currentQuestion.correctAnswer
    if (isCorrect) {
      // إذا أجاب بشكل صحيح، ننتقل لمستوى أعلى
      const levels: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      const currentIndex = levels.indexOf(currentLevel)
      if (currentIndex < levels.length - 1) {
        setCurrentLevel(levels[currentIndex + 1])
      }
    }
  }, [adaptiveQuestions, currentQuestionIndex, showResult, currentLevel])
  
  // الانتقال للسؤال التالي
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < adaptiveQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowResult(false)
      setSelectedAnswer(null)
    } else {
      finishTest()
    }
  }, [currentQuestionIndex, adaptiveQuestions.length])
  
  // إنهاء الاختبار
  const finishTest = useCallback(() => {
    setIsActive(false)
    setIsFinished(true)
    
    // حساب النتائج
    let correctCount = 0
    let grammarCorrect = 0
    let vocabularyCorrect = 0
    let readingCorrect = 0
    let grammarTotal = 0
    let vocabularyTotal = 0
    let readingTotal = 0
    
    adaptiveQuestions.forEach(q => {
      if (q.type === 'grammar') {
        grammarTotal++
        if (answers[q.id] === q.correctAnswer) grammarCorrect++
      } else if (q.type === 'vocabulary') {
        vocabularyTotal++
        if (answers[q.id] === q.correctAnswer) vocabularyCorrect++
      } else if (q.type === 'reading') {
        readingTotal++
        if (answers[q.id] === q.correctAnswer) readingCorrect++
      }
      
      if (answers[q.id] === q.correctAnswer) correctCount++
    })
    
    // تحديد المستوى
    const percentage = (correctCount / adaptiveQuestions.length) * 100
    let level: Level = 'A1'
    if (percentage > 90) level = 'C2'
    else if (percentage > 75) level = 'C1'
    else if (percentage > 55) level = 'B2'
    else if (percentage > 35) level = 'B1'
    else if (percentage > 20) level = 'A2'
    
    // تحديد نقاط القوة والضعف
    const strengths: string[] = []
    const weaknesses: string[] = []
    
    const grammarPct = grammarTotal > 0 ? (grammarCorrect / grammarTotal) * 100 : 0
    const vocabularyPct = vocabularyTotal > 0 ? (vocabularyCorrect / vocabularyTotal) * 100 : 0
    const readingPct = readingTotal > 0 ? (readingCorrect / readingTotal) * 100 : 0
    
    if (grammarPct >= 70) strengths.push('القواعد النحوية')
    else if (grammarPct < 50) weaknesses.push('القواعد النحوية')
    
    if (vocabularyPct >= 70) strengths.push('المفردات')
    else if (vocabularyPct < 50) weaknesses.push('المفردات')
    
    if (readingPct >= 70) strengths.push('القراءة والفهم')
    else if (readingPct < 50) weaknesses.push('القراءة والفهم')
    
    // التوصيات
    const recommendations: string[] = []
    if (level === 'A1' || level === 'A2') {
      recommendations.push('ركز على تعلم الأساسيات: الأزمنة البسيطة والمفردات اليومية')
      recommendations.push('استخدم تطبيقات تعلم اللغة للمبتدئين')
      recommendations.push('شاهد أفلام كرتون بالإنجليزية مع ترجمة عربية')
    } else if (level === 'B1' || level === 'B2') {
      recommendations.push('وسّع مفرداتك بقراءة مقالات ومشاهدة فيديوهات')
      recommendations.push('تدرب على الأزمنة المعقدة والجمل الشرطية')
      recommendations.push('جرب التحدث مع متحدثين أصليين')
    } else {
      recommendations.push('اقرأ كتباً ومقالات أكاديمية')
      recommendations.push('شاهد أفلاماً وبرامج بدون ترجمة')
      recommendations.push('تدرب على الكتابة الأكاديمية')
    }
    
    setResult({
      level,
      score: Math.round(percentage),
      totalQuestions: adaptiveQuestions.length,
      correctAnswers: correctCount,
      grammarScore: Math.round(grammarPct),
      vocabularyScore: Math.round(vocabularyPct),
      readingScore: Math.round(readingPct),
      recommendations,
      strengths,
      weaknesses,
    })
  }, [adaptiveQuestions, answers])
  
  // نطق النص (لأسئلة الاستماع)
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }, [])
  
  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // شاشة البداية
  if (!isStarted) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
          <CardContent className="p-8">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
              >
                <GraduationCap className="w-12 h-12 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-bold mb-2">اختبار تحديد المستوى</h1>
              <p className="text-gray-500 mb-6">
                اكتشف مستواك في اللغة الإنجليزية من خلال اختبار شامل
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                  <p className="font-bold">{TEST_QUESTIONS.length} سؤال</p>
                  <p className="text-xs text-gray-500">قواعد ومفردات</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="font-bold">15 دقيقة</p>
                  <p className="text-xs text-gray-500">وقت الاختبار</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl col-span-2 sm:col-span-1">
                  <Target className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold">6 مستويات</p>
                  <p className="text-xs text-gray-500">من A1 إلى C2</p>
                </div>
              </div>
              
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700" onClick={startTest}>
                ابدأ الاختبار
                <ArrowRight className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* معلومات المستويات */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">مستويات اللغة الإنجليزية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(LEVEL_INFO).map(([key, info]) => (
                <div
                  key={key}
                  className={cn(
                    "p-3 rounded-xl border-2",
                    `border-${info.color}-200 bg-${info.color}-50 dark:bg-${info.color}-900/20`
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`bg-${info.color}-500`}>{key}</Badge>
                    <span className="text-sm font-medium">{info.nameAr}</span>
                  </div>
                  <p className="text-xs text-gray-500">{info.range}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // شاشة النتائج
  if (isFinished && result) {
    const levelInfo = LEVEL_INFO[result.level]
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* النتيجة الرئيسية */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className={cn("h-3 bg-gradient-to-r", `from-${levelInfo.color}-500 to-${levelInfo.color}-600`)} />
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={cn(
                  "w-28 h-28 mx-auto mb-4 rounded-full flex items-center justify-center",
                  `bg-gradient-to-br from-${levelInfo.color}-500 to-${levelInfo.color}-600`
                )}
              >
                <div className="text-center text-white">
                  <p className="text-3xl font-bold">{result.level}</p>
                  <p className="text-xs">{levelInfo.name}</p>
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">مستواك: {levelInfo.nameAr}</h2>
              <p className="text-gray-500 mb-4">{levelInfo.description}</p>
              
              <div className="flex justify-center gap-4">
                <Badge className="text-lg py-1 px-4">
                  <Trophy className="w-4 h-4 mr-1" />
                  {result.score}%
                </Badge>
                <Badge variant="secondary" className="text-lg py-1 px-4">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {result.correctAnswers}/{result.totalQuestions}
                </Badge>
              </div>
            </div>
            
            {/* تفاصيل الأداء */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-center">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                <p className="text-2xl font-bold text-violet-600">{result.grammarScore}%</p>
                <p className="text-xs text-gray-500">القواعد</p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <p className="text-2xl font-bold text-amber-600">{result.vocabularyScore}%</p>
                <p className="text-xs text-gray-500">المفردات</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold text-emerald-600">{result.readingScore}%</p>
                <p className="text-xs text-gray-500">القراءة</p>
              </div>
            </div>
            
            {/* نقاط القوة والضعف */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {result.strengths.length > 0 && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-emerald-700">نقاط القوة</span>
                  </div>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.weaknesses.length > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <span className="font-medium text-rose-700">يحتاج تحسين</span>
                  </div>
                  <ul className="space-y-1">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* التوصيات */}
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-violet-500" />
                <span className="font-medium text-violet-700">توصيات لك</span>
              </div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-violet-500 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsStarted(false)}>
                العودة
              </Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={startTest}>
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة الاختبار
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  // شاشة الاختبار
  const currentQuestion = adaptiveQuestions[currentQuestionIndex]
  const progress = adaptiveQuestions.length > 0 ? ((currentQuestionIndex + 1) / adaptiveQuestions.length) * 100 : 0
  
  if (!currentQuestion) return null
  
  return (
    <div className="space-y-4">
      {/* شريط التقدم والوقت */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currentQuestionIndex + 1}/{adaptiveQuestions.length}</Badge>
          <Badge className={cn(
            "text-xs",
            currentQuestion.level === 'A1' && "bg-emerald-100 text-emerald-700",
            currentQuestion.level === 'A2' && "bg-teal-100 text-teal-700",
            currentQuestion.level === 'B1' && "bg-amber-100 text-amber-700",
            currentQuestion.level === 'B2' && "bg-orange-100 text-orange-700",
            currentQuestion.level === 'C1' && "bg-rose-100 text-rose-700",
            currentQuestion.level === 'C2' && "bg-violet-100 text-violet-700",
          )}>
            {currentQuestion.level}
          </Badge>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-3 py-1 rounded-full font-mono font-bold",
          timeLeft < 60 ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-600"
        )}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <Progress value={progress} className="h-1" />
      
      {/* السؤال */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          {/* نوع السؤال */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {currentQuestion.type === 'grammar' && 'قواعد'}
              {currentQuestion.type === 'vocabulary' && 'مفردات'}
              {currentQuestion.type === 'reading' && 'قراءة'}
              {currentQuestion.type === 'listening' && 'استماع'}
            </Badge>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* السؤال */}
              <div className="text-center mb-6">
                <p className="text-xl font-bold mb-2">{currentQuestion.question}</p>
                {currentQuestion.questionAr && (
                  <p className="text-gray-500">{currentQuestion.questionAr}</p>
                )}
              </div>
              
              {/* الخيارات */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, i) => (
                  <Button
                    key={i}
                    variant={selectedAnswer === option 
                      ? (option === currentQuestion.correctAnswer ? "default" : "destructive")
                      : "outline"
                    }
                    className={cn(
                      "h-14 text-lg justify-start",
                      showResult && option === currentQuestion.correctAnswer && "bg-emerald-500 hover:bg-emerald-600 text-white",
                      selectedAnswer === option && option !== currentQuestion.correctAnswer && "bg-rose-500 hover:bg-rose-600"
                    )}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                  >
                    <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ml-3 text-sm font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
              
              {/* الشرح */}
              {showResult && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-4 p-4 rounded-xl",
                    selectedAnswer === currentQuestion.correctAnswer
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-amber-50 dark:bg-amber-900/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 mt-0.5 text-amber-500" />
                    <div>
                      <p className="font-medium mb-1">الشرح:</p>
                      <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* زر التالي */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={nextQuestion}>
                {currentQuestionIndex < adaptiveQuestions.length - 1 ? 'السؤال التالي' : 'إنهاء الاختبار'}
                <ChevronRight className="w-4 h-4 mr-1" />
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
      
      {/* مؤشر الأداء */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">أداؤك الحالي:</span>
            <div className="flex gap-2">
              {Object.entries(LEVEL_INFO).map(([key, info]) => {
                const questionCount = adaptiveQuestions.filter(q => q.level === key).length
                const answeredCorrect = adaptiveQuestions
                  .filter(q => q.level === key)
                  .filter(q => answers[q.id] === q.correctAnswer).length
                
                return (
                  <div
                    key={key}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      currentLevel === key 
                        ? `bg-${info.color}-500 text-white`
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {key}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
