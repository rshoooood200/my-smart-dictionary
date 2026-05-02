'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'

interface Mistake {
  incorrect: string; correct: string; explanation: string;
  example_incorrect: string; example_correct: string;
  quiz_question: string; quiz_answer: string;
}

export function CommonMistakesSection() {
  const currentUserId = useVocabStore(state => state.currentUserId)
  const [isLoading, setIsLoading] = useState(false)
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<number | null>(null)
  const [userAnswer, setUserAnswer] = useState<string>('')
  const [showResult, setShowResult] = useState(false)

  const generateMistakes = async () => {
    setIsLoading(true)
    setMistakes([])
    setCurrentQuiz(null)
    try {
      const res = await fetch('/api/common-mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      })
      const data = await res.json()
      if (data.success && data.data) setMistakes(data.data)
      else toast.error(data.error || 'Failed to load')
    } catch { toast.error('Error') } finally { setIsLoading(false) }
  }

  const checkAnswer = () => {
    setShowResult(true)
    const isCorrect = userAnswer.toLowerCase().trim() === mistakes[currentQuiz!].quiz_answer.toLowerCase()
    if (isCorrect) toast.success('Correct! 🎉')
    else toast.error('Incorrect!')
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-rose-600" />Common Mistakes</CardTitle>
          <p className="text-sm text-gray-500">Learn the most common mistakes Arabic speakers make in English</p>
        </CardHeader>
        <CardContent>
          <Button onClick={generateMistakes} disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Generate Quiz
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <AnimatePresence>
          {mistakes.map((mistake, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive" className="line-through">{mistake.incorrect}</Badge>
                    <span className="text-gray-400">→</span>
                    <Badge className="bg-emerald-100 text-emerald-700">{mistake.correct}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" dir="rtl">{mistake.explanation}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg"><X className="w-3 h-3 inline text-rose-500 mr-1" />{mistake.example_incorrect}</div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg"><Check className="w-3 h-3 inline text-emerald-500 mr-1" />{mistake.example_correct}</div>
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => { setCurrentQuiz(index); setUserAnswer(''); setShowResult(false) }}>
                      Take Quick Quiz
                    </Button>
                  </div>

                  <AnimatePresence>
                    {currentQuiz === index && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-2 space-y-2">
                          <p className="font-medium text-sm">{mistake.quiz_question}</p>
                          <div className="flex gap-2">
                            <Input value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Your answer..." className="text-sm" dir="ltr" />
                            <Button size="sm" onClick={checkAnswer} disabled={!userAnswer}>Check</Button>
                          </div>
                          {showResult && (
                            <p className={`text-sm font-medium ${userAnswer.toLowerCase().trim() === mistake.quiz_answer.toLowerCase() ? "text-emerald-600" : "text-rose-600"}`}>
                              {userAnswer.toLowerCase().trim() === mistake.quiz_answer.toLowerCase() ? 'Correct!' : `Wrong! The correct answer is: ${mistake.quiz_answer}`}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
