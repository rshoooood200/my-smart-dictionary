'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Send, Mic, MicOff, Volume2, RefreshCw, Lightbulb,
  BookOpen, MessageSquare, Pen, Headphones, Target,
  Sparkles, Zap, Brain, CheckCircle, X, Copy, Play,
  Pause, ChevronRight, Clock, TrendingUp, Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestedWords?: string[]
}

interface AILearningHubProps {
  currentUserId: string
  weakWords?: string[]
  strongWords?: string[]
  learningLevel?: string
}

const quickActions = [
  { id: 'chat', label: 'محادثة ذكية', labelEn: 'Smart Chat', icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
  { id: 'test', label: 'اختبار ذكي', labelEn: 'Smart Test', icon: Target, color: 'from-emerald-500 to-teal-500' },
  { id: 'pronunciation', label: 'تصحيح النطق', labelEn: 'Pronunciation', icon: Mic, color: 'from-violet-500 to-purple-500' },
  { id: 'writing', label: 'تحسين الكتابة', labelEn: 'Writing', icon: Pen, color: 'from-orange-500 to-amber-500' },
  { id: 'grammar', label: 'شرح القواعد', labelEn: 'Grammar', icon: BookOpen, color: 'from-rose-500 to-pink-500' },
  { id: 'practice', label: 'تدريب محادثة', labelEn: 'Conversation', icon: Headphones, color: 'from-indigo-500 to-blue-500' },
]

export function AILearningHub({ 
  currentUserId, 
  weakWords = [], 
  strongWords = [],
  learningLevel = 'beginner'
}: AILearningHubProps) {
  // State
  const [activeMode, setActiveMode] = useState<string>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  // Test state
  const [currentTest, setCurrentTest] = useState<Record<string, unknown> | null>(null)
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({})
  const [testSubmitted, setTestSubmitted] = useState(false)
  const [testScore, setTestScore] = useState(0)
  
  // Pronunciation state
  const [pronunciationWord, setPronunciationWord] = useState('')
  const [pronunciationResult, setPronunciationResult] = useState<Record<string, unknown> | null>(null)
  
  // Writing state
  const [writingPrompt, setWritingPrompt] = useState('')
  const [writingResponse, setWritingResponse] = useState('')
  const [writingFeedback, setWritingFeedback] = useState<Record<string, unknown> | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
        toast.error('خطأ في التعرف على الصوت')
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Send message to AI
  const sendMessage = async () => {
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
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          userId: currentUserId,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          })),
          learningLevel,
          weakWords,
          strongWords
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        suggestedWords: data.suggestedWords
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch {
      toast.error('فشل في إرسال الرسالة')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate smart test
  const generateTest = async (testType: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          weakWords,
          testType,
          difficulty: learningLevel,
          count: 5
        })
      })

      const data = await response.json()
      setCurrentTest(data.test)
      setTestAnswers({})
      setTestSubmitted(false)
      setTestScore(0)
    } catch {
      toast.error('فشل في إنشاء الاختبار')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit test answers
  const submitTest = () => {
    if (!currentTest || !currentTest.questions) return

    const questions = currentTest.questions as Array<{ correctAnswer: number }>
    let correct = 0

    questions.forEach((q, index) => {
      if (testAnswers[index] === q.correctAnswer) {
        correct++
      }
    })

    const score = Math.round((correct / questions.length) * 100)
    setTestScore(score)
    setTestSubmitted(true)

    if (score >= 80) {
      toast.success(`ممتاز! نتيجتك ${score}%`)
    } else if (score >= 60) {
      toast.info(`جيد! نتيجتك ${score}%`)
    } else {
      toast.warning(`تحتاج لمزيد من التدريب. نتيجتك ${score}%`)
    }
  }

  // Analyze pronunciation
  const analyzePronunciation = async () => {
    if (!pronunciationWord.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: pronunciationWord,
          difficulty: learningLevel
        })
      })

      const data = await response.json()
      setPronunciationResult(data)
    } catch {
      toast.error('فشل في تحليل النطق')
    } finally {
      setIsLoading(false)
    }
  }

  // Analyze writing
  const analyzeWriting = async () => {
    if (!writingResponse.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `حلل هذا النص الإنجليزي وأعطني ملاحظات حول القواعد والمفردات والأسلوب:\n\n"${writingResponse}"`,
          userId: currentUserId,
          learningLevel
        })
      })

      const data = await response.json()
      setWritingFeedback({
        feedback: data.message,
        originalText: writingResponse
      })
    } catch {
      toast.error('فشل في تحليل الكتابة')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  // Speak text
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  // Copy text
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('تم نسخ النص')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">مركز التعلم الذكي</h2>
            <p className="text-gray-500 text-sm">تعلم بمساعدة الذكاء الاصطناعي</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          مدعوم بـ AI
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'الكلمات الضعيفة', value: weakWords.length, icon: Target, color: 'text-rose-500' },
          { label: 'الكلمات القوية', value: strongWords.length, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'المستوى', value: learningLevel, icon: TrendingUp, color: 'text-blue-500' },
          { label: 'الرسائل', value: messages.length, icon: MessageSquare, color: 'text-purple-500' }
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-gray-100 dark:bg-gray-800", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveMode(action.id)
              if (action.id === 'test') {
                generateTest('vocabulary')
              }
            }}
            className={cn(
              "p-4 rounded-xl border transition-all text-center",
              activeMode === action.id
                ? "border-transparent bg-gradient-to-br " + action.color + " text-white shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}
          >
            <action.icon className={cn("w-6 h-6 mx-auto mb-2", activeMode !== action.id && action.color.replace('from-', 'text-').split(' ')[0])} />
            <span className="text-sm font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {/* Chat Mode */}
        {activeMode === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  محادثة مع المعلم الذكي
                </CardTitle>
                <CardDescription className="text-blue-100">
                  اسأل أي سؤال عن اللغة الإنجليزية وسأساعدك
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 mb-4">مرحباً! أنا معلمك الذكي للإنجليزية 👋</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['كيف أتعلم الإنجليزية؟', 'اشرح لي المضارع البسيط', 'كلمات جديدة للمبتدئين'].map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => setInputMessage(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2",
                          msg.role === 'user'
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.suggestedWords && msg.suggestedWords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              {msg.suggestedWords.map((word) => (
                                <Badge
                                  key={word}
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-emerald-100"
                                  onClick={() => speakText(word)}
                                >
                                  {word}
                                  <Volume2 className="w-3 h-3 mr-1" />
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs opacity-50">
                              {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.role === 'assistant' && (
                              <>
                                <button
                                  onClick={() => speakText(msg.content)}
                                  className="text-xs opacity-50 hover:opacity-100"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => copyText(msg.content)}
                                  className="text-xs opacity-50 hover:opacity-100"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleListening}
                    className={cn(isListening && "bg-rose-100 text-rose-600")}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="اكتب رسالتك بالعربية أو الإنجليزية..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Test Mode */}
        {activeMode === 'test' && (
          <motion.div
            key="test"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-emerald-500" />
                      {currentTest?.titleAr || currentTest?.title || 'اختبار ذكي'}
                    </CardTitle>
                    <CardDescription>
                      اختبار مخصص بناءً على نقاط ضعفك
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateTest('vocabulary')}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                    اختبار جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-500" />
                    <p className="text-gray-500 mt-2">جاري إنشاء الاختبار...</p>
                  </div>
                ) : currentTest?.questions ? (
                  <>
                    {testSubmitted && (
                      <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl font-bold text-emerald-600">{testScore}%</div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {testScore >= 80 ? 'ممتاز! 🎉' : testScore >= 60 ? 'جيد! 👍' : 'تحتاج تدريب أكثر 💪'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {testScore >= 80 ? 'أداء رائع!' : 'راجع الكلمات وحاول مرة أخرى'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(currentTest.questions as Array<Record<string, unknown>>).map((q, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <p className="font-medium mb-3">
                          {index + 1}. {q.questionAr || q.question}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {(q.options as string[]).map((option, optIndex) => (
                            <button
                              key={optIndex}
                              onClick={() => !testSubmitted && setTestAnswers(prev => ({ ...prev, [index]: optIndex }))}
                              disabled={testSubmitted}
                              className={cn(
                                "p-3 rounded-lg border text-right transition-all",
                                testAnswers[index] === optIndex
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                                  : "hover:border-gray-300",
                                testSubmitted && optIndex === q.correctAnswer
                                  ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/50"
                                  : "",
                                testSubmitted && testAnswers[index] === optIndex && optIndex !== q.correctAnswer
                                  ? "border-rose-500 bg-rose-50 dark:bg-rose-900/30"
                                  : ""
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {testSubmitted && q.explanation && (
                          <p className="mt-2 text-sm text-gray-600">{q.explanation as string}</p>
                        )}
                      </div>
                    ))}

                    {!testSubmitted && (
                      <Button
                        onClick={submitTest}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={Object.keys(testAnswers).length < (currentTest.questions as unknown[]).length}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        إرسال الإجابات
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 mb-4">اختر نوع الاختبار للبدء</p>
                    <div className="flex gap-2 justify-center">
                      {[
                        { type: 'vocabulary', label: 'مفردات' },
                        { type: 'grammar', label: 'قواعد' },
                        { type: 'listening', label: 'استماع' }
                      ].map((t) => (
                        <Button key={t.type} onClick={() => generateTest(t.type)}>
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pronunciation Mode */}
        {activeMode === 'pronunciation' && (
          <motion.div
            key="pronunciation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-violet-500" />
                  تصحيح النطق
                </CardTitle>
                <CardDescription>
                  أدخل كلمة وسيقوم AI بتحليل نطقك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={pronunciationWord}
                    onChange={(e) => setPronunciationWord(e.target.value)}
                    placeholder="أدخل كلمة بالإنجليزية..."
                    className="flex-1"
                  />
                  <Button
                    onClick={() => speakText(pronunciationWord)}
                    variant="outline"
                    disabled={!pronunciationWord}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={analyzePronunciation}
                    disabled={!pronunciationWord || isLoading}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    تحليل
                  </Button>
                </div>

                {pronunciationResult && (
                  <div className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">النتيجة</span>
                        <span className={cn(
                          "text-2xl font-bold",
                          (pronunciationResult.score as number) >= 80 ? "text-emerald-600" :
                          (pronunciationResult.score as number) >= 60 ? "text-amber-600" : "text-rose-600"
                        )}>
                          {pronunciationResult.score}%
                        </span>
                      </div>
                      <Progress value={pronunciationResult.score as number} />
                    </div>

                    {(pronunciationResult.feedback as Record<string, string>) && (
                      <div className="space-y-2">
                        <h4 className="font-medium">التغذية الراجعة:</h4>
                        {Object.entries(pronunciationResult.feedback as Record<string, string>).map(([key, value]) => (
                          <div key={key} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{key}: </span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {(pronunciationResult.tips as string[]) && (
                      <div>
                        <h4 className="font-medium mb-2">نصائح:</h4>
                        <ul className="space-y-1">
                          {(pronunciationResult.tips as string[]).map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-sm">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Weak Words Practice */}
                {weakWords.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">تمرين على كلماتك الضعيفة:</h4>
                    <div className="flex flex-wrap gap-2">
                      {weakWords.slice(0, 10).map((word) => (
                        <Badge
                          key={word}
                          variant="outline"
                          className="cursor-pointer hover:bg-violet-100"
                          onClick={() => {
                            setPronunciationWord(word)
                            speakText(word)
                          }}
                        >
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Writing Mode */}
        {activeMode === 'writing' && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pen className="w-5 h-5 text-orange-500" />
                  تحسين الكتابة
                </CardTitle>
                <CardDescription>
                  اكتب نصاً بالإنجليزية وسيقوم AI بتحسينه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={writingResponse}
                  onChange={(e) => setWritingResponse(e.target.value)}
                  placeholder="اكتب فقرة بالإنجليزية..."
                  rows={6}
                />
                <Button
                  onClick={analyzeWriting}
                  disabled={!writingResponse.trim() || isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  تحليل النص
                </Button>

                {writingFeedback && (
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 mt-4">
                    <h4 className="font-medium mb-2">تحليل AI:</h4>
                    <p className="whitespace-pre-wrap text-sm">{writingFeedback.feedback as string}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Grammar Mode */}
        {activeMode === 'grammar' && (
          <motion.div
            key="grammar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-rose-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">شرح القواعد</h3>
                <p className="text-gray-500 mb-4">اسأل عن أي قاعدة نحوية</p>
                <Button onClick={() => {
                  setActiveMode('chat')
                  setInputMessage('اشرح لي قواعد اللغة الإنجليزية الأساسية')
                }}>
                  ابدأ المحادثة
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Conversation Practice Mode */}
        {activeMode === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <Headphones className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">تدريب المحادثة</h3>
                <p className="text-gray-500 mb-4">تدرب على محادثات واقعية</p>
                <Button onClick={() => {
                  setActiveMode('chat')
                  setInputMessage('أريد تدريب محادثة عن السفر والمطار')
                }}>
                  ابدأ التدريب
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
