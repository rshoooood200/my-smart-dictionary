'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Lightbulb, Target, Brain,
  MessageSquare, RefreshCw, BookOpen, Zap,
  TrendingUp, Clock, Star, ChevronDown, ChevronUp,
  Volume2, Copy, Check, X, Bot, User, Loader2,
  Wand2, GraduationCap, Award, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useVocabStore, type Word } from '@/store/vocab-store'

// أنواع الرسائل
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

// اقتراحات التعلم
interface LearningSuggestion {
  id: string
  type: 'review' | 'learn' | 'practice' | 'focus'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  words?: Word[]
  action?: () => void
}

// إحصائيات التعلم
interface LearningAnalytics {
  strongestWords: Word[]
  weakestWords: Word[]
  suggestedWords: Word[]
  optimalReviewTime: string
  weeklyGoal: number
  currentProgress: number
}

export function AIAssistant() {
  const { words, stats, getWordsForReview, categories } = useVocabStore()
  
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<LearningSuggestion[]>([])
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // تحليل أنماط التعلم
  const analyzeLearningPatterns = useCallback(() => {
    if (words.length === 0) return null

    // الكلمات الأقوى (نسبة نجاح عالية)
    const strongestWords = [...words]
      .filter(w => w.reviewCount > 0)
      .sort((a, b) => {
        const aRate = a.correctCount / a.reviewCount
        const bRate = b.correctCount / b.reviewCount
        return bRate - aRate
      })
      .slice(0, 5)

    // الكلمات الأضعف (تحتاج تركيز)
    const weakestWords = [...words]
      .filter(w => w.reviewCount > 0)
      .sort((a, b) => {
        const aRate = a.correctCount / a.reviewCount
        const bRate = b.correctCount / b.reviewCount
        return aRate - bRate
      })
      .slice(0, 5)

    // اقتراح كلمات للتعلم (غير محفوظة)
    const suggestedWords = words
      .filter(w => !w.isLearned && w.reviewCount < 3)
      .slice(0, 10)

    return {
      strongestWords,
      weakestWords,
      suggestedWords,
      optimalReviewTime: '8:00 صباحاً',
      weeklyGoal: 50,
      currentProgress: stats?.learnedWords || 0
    }
  }, [words, stats])

  // إنشاء اقتراحات التعلم
  const generateSuggestions = useCallback(() => {
    const newSuggestions: LearningSuggestion[] = []

    // اقتراح المراجعة
    const reviewWords = getWordsForReview('need-review', 10)
    if (reviewWords.length > 0) {
      newSuggestions.push({
        id: 'review',
        type: 'review',
        title: 'مراجعة الكلمات المستحقة',
        description: `لديك ${reviewWords.length} كلمات تحتاج مراجعة اليوم`,
        priority: 'high',
        words: reviewWords
      })
    }

    // اقتراح التركيز
    if (analytics?.weakestWords && analytics.weakestWords.length > 0) {
      newSuggestions.push({
        id: 'focus',
        type: 'focus',
        title: 'تركيز على الكلمات الصعبة',
        description: 'هذه الكلمات تحتاج لمزيد من التدريب',
        priority: 'high',
        words: analytics.weakestWords
      })
    }

    // اقتراح التعلم الجديد
    if (analytics?.suggestedWords && analytics.suggestedWords.length > 0) {
      newSuggestions.push({
        id: 'learn',
        type: 'learn',
        title: 'تعلم كلمات جديدة',
        description: `${analytics.suggestedWords.length} كلمات جاهزة للتعلم`,
        priority: 'medium',
        words: analytics.suggestedWords
      })
    }

    // اقتراح الممارسة
    if (words.length >= 5) {
      newSuggestions.push({
        id: 'practice',
        type: 'practice',
        title: 'اختبار سريع',
        description: 'اختبر نفسك مع 10 كلمات عشوائية',
        priority: 'low'
      })
    }

    setSuggestions(newSuggestions)
  }, [getWordsForReview, analytics, words.length])

  // تحليل عند التحميل
  useEffect(() => {
    const data = analyzeLearningPatterns()
    if (data) {
      setAnalytics(data)
    }
  }, [analyzeLearningPatterns])

  // إنشاء اقتراحات
  useEffect(() => {
    generateSuggestions()
  }, [generateSuggestions])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // إرسال رسالة للمساعد
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          words,
          stats,
          categories,
          history: messages.slice(-5)
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('فشل في الحصول على الرد')
      // إضافة رد افتراضي
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateFallbackResponse(inputMessage),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputMessage, isLoading, words, stats, categories, messages])

  // رد افتراضي بدون API
  const generateFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('مراجعة') || lowerQuery.includes('review')) {
      return `📚 لديك ${getWordsForReview('need-review', 100).length} كلمات تحتاج مراجعة. أنصحك بمراجعتها يومياً للحفاظ على التذكر.`
    }
    
    if (lowerQuery.includes('تقدم') || lowerQuery.includes('progress')) {
      return `📈 تقدمك الحالي: ${stats?.learnedWords || 0} كلمة محفوظة من أصل ${stats?.totalWords || 0} كلمة. استمر في التعلم!`
    }
    
    if (lowerQuery.includes('نصيحة') || lowerQuery.includes('advice')) {
      return `💡 نصيحة اليوم: حاول مراجعة الكلمات في نفس الوقت يومياً. أفضل وقت للمراجعة هو ${analytics?.optimalReviewTime || 'الصباح الباكر'}.`
    }
    
    if (lowerQuery.includes('صعب') || lowerQuery.includes('difficult')) {
      const difficult = analytics?.weakestWords || []
      if (difficult.length > 0) {
        return `🎯 الكلمات التي تحتاج تركيز: ${difficult.slice(0, 3).map(w => w.word).join(', ')}. جرب استخدامها في جمل للتذكر أفضل.`
      }
      return '👍 لا توجد كلمات صعبة حالياً. استمر في التعلم!'
    }
    
    return `🤖 أنا مساعدك الذكي! يمكنني مساعدتك في:
• تخطيط مراجعاتك
• اقتراح كلمات للتعلم
• تحليل تقدمك
• تقديم نصائح تعليمية

اسألني أي سؤال عن تعلمك!`
  }

  // نسخ الرسالة
  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success('تم النسخ!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // نطق الرسالة
  const speakMessage = (content: string) => {
    if ('speechSynthesis' in window) {
      // استخراج الكلمات الإنجليزية فقط للنطق
      const englishWords = content.match(/[a-zA-Z]+/g) || []
      if (englishWords.length > 0) {
        const utterance = new SpeechSynthesisUtterance(englishWords.join(', '))
        utterance.lang = 'en-US'
        utterance.rate = 0.8
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // الحصول على لون الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // الحصول على أيقونة النوع
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <RefreshCw className="w-4 h-4" />
      case 'learn': return <BookOpen className="w-4 h-4" />
      case 'practice': return <Target className="w-4 h-4" />
      case 'focus': return <Zap className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* ملخص التعلم */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-2 bg-gradient-to-l from-violet-500 to-purple-600" />
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
              <Brain className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">المساعد الذكي</h3>
              <p className="text-sm text-gray-500">تحليلات ونصائح مخصصة لتعلمك</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats?.learnedWords || 0}</div>
              <div className="text-xs text-gray-500">كلمة محفوظة</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-amber-600">{getWordsForReview('need-review', 100).length}</div>
              <div className="text-xs text-gray-500">للمراجعة</div>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-violet-600">{analytics?.weakestWords?.length || 0}</div>
              <div className="text-xs text-gray-500">تحتاج تركيز</div>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-rose-600">{stats?.streak || 0}</div>
              <div className="text-xs text-gray-500">يوم متواصل</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-1" />
            المحادثة
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Lightbulb className="w-4 h-4 mr-1" />
            الاقتراحات
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-1" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        {/* تبويب المحادثة */}
        <TabsContent value="chat" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {/* رسائل المحادثة */}
              <ScrollArea className="h-80 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 mb-4">مرحباً! أنا مساعدك الذكي</p>
                    <div className="space-y-2">
                      {['كيف تقدمي؟', 'نصيحة للمراجعة', 'ما هي الكلمات الصعبة؟'].map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          className="block w-full"
                          onClick={() => setInputMessage(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "flex gap-2",
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                              <Bot className="w-4 h-4 text-violet-600" />
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[80%] rounded-2xl p-3",
                            msg.role === 'user'
                              ? "bg-violet-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800"
                          )}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className={cn(
                              "flex items-center gap-2 mt-2",
                              msg.role === 'user' ? "justify-end" : "justify-start"
                            )}>
                              <span className="text-xs opacity-70">
                                {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.role === 'assistant' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => copyMessage(msg.content, msg.id)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                  >
                                    {copiedId === msg.id ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => speakMessage(msg.content)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {isLoading && (
                      <div className="flex gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* حقل الإدخال */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="اسأل المساعد..."
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الاقتراحات */}
        <TabsContent value="suggestions" className="space-y-4 mt-4">
          {suggestions.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-8 text-center">
                <Lightbulb className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">لا توجد اقتراحات حالياً</p>
                <p className="text-sm text-gray-400">أضف المزيد من الكلمات للحصول على اقتراحات</p>
              </CardContent>
            </Card>
          ) : (
            suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-md overflow-hidden">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setSelectedSuggestion(
                      selectedSuggestion === suggestion.id ? null : suggestion.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          suggestion.type === 'review' && "bg-rose-100 text-rose-600",
                          suggestion.type === 'learn' && "bg-emerald-100 text-emerald-600",
                          suggestion.type === 'practice' && "bg-amber-100 text-amber-600",
                          suggestion.type === 'focus' && "bg-violet-100 text-violet-600"
                        )}>
                          {getTypeIcon(suggestion.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <p className="text-sm text-gray-500">{suggestion.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority === 'high' ? 'عاجل' :
                           suggestion.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        {selectedSuggestion === suggestion.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedSuggestion === suggestion.id && suggestion.words && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                          {suggestion.words.map((word) => (
                            <div
                              key={word.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div>
                                <span className="font-medium">{word.word}</span>
                                <span className="text-gray-500 mx-2">-</span>
                                <span className="text-sm text-gray-600">{word.translation}</span>
                              </div>
                              {word.reviewCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round((word.correctCount / word.reviewCount) * 100)}%
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* تبويب التحليلات */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          {/* الهدف الأسبوعي */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-500" />
                الهدف الأسبوعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>التقدم</span>
                  <span>{analytics?.currentProgress || 0} / {analytics?.weeklyGoal || 50} كلمة</span>
                </div>
                <Progress
                  value={((analytics?.currentProgress || 0) / (analytics?.weeklyGoal || 50)) * 100}
                  className="h-3"
                />
              </div>
            </CardContent>
          </Card>

          {/* أفضل وقت للمراجعة */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium">أفضل وقت للمراجعة</h4>
                  <p className="text-sm text-gray-500">{analytics?.optimalReviewTime || 'الصباح الباكر'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الكلمات الأقوى */}
          {analytics?.strongestWords && analytics.strongestWords.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  أقوى الكلمات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.strongestWords.slice(0, 5).map((word, index) => (
                    <div
                      key={word.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span>{word.word}</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {Math.round((word.correctCount / word.reviewCount) * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* الكلمات الأضعف */}
          {analytics?.weakestWords && analytics.weakestWords.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  تحتاج تركيز
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.weakestWords.slice(0, 5).map((word, index) => (
                    <div
                      key={word.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span>{word.word}</span>
                        <span className="text-gray-500 text-sm">- {word.translation}</span>
                      </div>
                      <Badge className="bg-rose-100 text-rose-700">
                        {Math.round((word.correctCount / word.reviewCount) * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* نصائح التعلم */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg shrink-0">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">نصيحة اليوم</h4>
                  <p className="text-white/90 text-sm">
                    {words.length < 20
                      ? 'ابدأ بإضافة 20 كلمة على الأقل للحصول على تحليلات أفضل ونصائح مخصصة.'
                      : stats?.streak === 0
                        ? 'ابدأ سلسلة التعلم اليوم! حاول المراجعة يومياً للحفاظ على التذكر.'
                        : 'أداؤك ممتاز! استمر في المراجعة المنتظمة وستلاحظ تحسناً ملحوظاً.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
