'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gamepad2, Trophy, Check, X, Clock, Keyboard, Shuffle,
  RefreshCw, Volume2, Lightbulb
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Word {
  id: string
  word: string
  translation: string
  level?: string
}

interface NewGamesProps {
  words: Word[]
  onGameComplete: (score: number, total: number) => void
  speak?: (text: string) => void
}

type GameType = 'spelling' | 'scramble' | 'sentence' | null

export function NewGames({ words, onGameComplete, speak }: NewGamesProps) {
  const [activeGame, setActiveGame] = useState<GameType>(null)
  const [gameWords, setGameWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  
  // Spelling game state
  const [spellingInput, setSpellingInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [attempts, setAttempts] = useState(0)
  
  // Scramble game state
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([])
  const [selectedLetters, setSelectedLetters] = useState<string[]>([])
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)

  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5)

  // Get random words
  const getRandomWords = useCallback((count: number) => {
    return shuffleArray(words).slice(0, Math.min(count, words.length))
  }, [words])

  // ================== SPELLING GAME ==================
  
  const startSpellingGame = useCallback(() => {
    if (words.length < 5) {
      toast.error('تحتاج على الأقل 5 كلمات للعب')
      return
    }
    
    const selected = getRandomWords(10)
    setGameWords(selected)
    setCurrentIndex(0)
    setScore(0)
    setStreak(0)
    setSpellingInput('')
    setShowHint(false)
    setAttempts(0)
    setActiveGame('spelling')
    setGameStarted(true)
    setTimeLeft(60) // 60 seconds
  }, [words, getRandomWords])

  const checkSpelling = useCallback(() => {
    if (!gameWords[currentIndex]) return
    
    const correctWord = gameWords[currentIndex].word.toLowerCase().trim()
    const userAnswer = spellingInput.toLowerCase().trim()
    
    if (userAnswer === correctWord) {
      const bonus = Math.max(0, 20 - attempts * 5) // Bonus decreases with attempts
      const points = 10 + bonus + (streak * 2) // Streak bonus
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      toast.success(`صحيح! +${points} نقاط ${streak > 0 ? `🔥 ${streak + 1} متتالي` : ''}`)
      
      if (currentIndex < gameWords.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setSpellingInput('')
        setShowHint(false)
        setAttempts(0)
      } else {
        toast.success(`🎉 انتهت اللعبة! النتيجة: ${score + points} نقطة`)
        onGameComplete(score + points, gameWords.length)
        setActiveGame(null)
        setGameStarted(false)
      }
    } else {
      setAttempts(prev => prev + 1)
      setStreak(0)
      toast.error('خطأ! حاول مرة أخرى')
    }
  }, [gameWords, currentIndex, spellingInput, attempts, streak, score, onGameComplete])

  // ================== SCRAMBLE GAME ==================

  const startScrambleGame = useCallback(() => {
    if (words.length < 5) {
      toast.error('تحتاج على الأقل 5 كلمات للعب')
      return
    }
    
    const selected = getRandomWords(10)
    setGameWords(selected)
    setCurrentIndex(0)
    setScore(0)
    setStreak(0)
    setSelectedLetters([])
    setActiveGame('scramble')
    setGameStarted(true)
    
    // Scramble first word
    if (selected[0]) {
      const letters = selected[0].word.split('')
      setScrambledLetters(shuffleArray(letters))
    }
  }, [words, getRandomWords])

  const handleLetterClick = useCallback((letter: string, index: number) => {
    setSelectedLetters(prev => [...prev, letter])
    setScrambledLetters(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSelectedLetterClick = useCallback((index: number) => {
    const letter = selectedLetters[index]
    setSelectedLetters(prev => prev.filter((_, i) => i !== index))
    setScrambledLetters(prev => [...prev, letter])
  }, [selectedLetters])

  const checkScramble = useCallback(() => {
    if (!gameWords[currentIndex]) return
    
    const correctWord = gameWords[currentIndex].word.toLowerCase().trim()
    const userAnswer = selectedLetters.join('').toLowerCase().trim()
    
    if (userAnswer === correctWord) {
      const points = 15 + (streak * 3)
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      toast.success(`صحيح! +${points} نقاط`)
      
      if (currentIndex < gameWords.length - 1) {
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)
        setSelectedLetters([])
        const letters = gameWords[nextIndex].word.split('')
        setScrambledLetters(shuffleArray(letters))
      } else {
        toast.success(`🎉 انتهت اللعبة! النتيجة: ${score + points} نقطة`)
        onGameComplete(score + points, gameWords.length)
        setActiveGame(null)
        setGameStarted(false)
      }
    } else {
      setStreak(0)
      toast.error('خطأ! رتب الحروف بشكل صحيح')
    }
  }, [gameWords, currentIndex, selectedLetters, streak, score, onGameComplete])

  // ================== SENTENCE GAME ==================

  const [sentenceWords, setSentenceWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [correctSentence, setCorrectSentence] = useState('')

  const startSentenceGame = useCallback(() => {
    if (words.length < 3) {
      toast.error('تحتاج على الأقل 3 كلمات للعب')
      return
    }
    
    const selected = getRandomWords(5)
    setGameWords(selected)
    setCurrentIndex(0)
    setScore(0)
    setStreak(0)
    setSelectedWords([])
    setActiveGame('sentence')
    setGameStarted(true)
    
    // Generate a simple sentence from the word
    if (selected[0]) {
      const sentence = `I ${selected[0].word} every day.`
      setCorrectSentence(sentence)
      const wordsInSentence = sentence.replace(/[.]/g, '').split(' ')
      setSentenceWords(shuffleArray(wordsInSentence))
    }
  }, [words, getRandomWords])

  const handleWordClick = useCallback((word: string, index: number) => {
    setSelectedWords(prev => [...prev, word])
    setSentenceWords(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSelectedWordClick = useCallback((index: number) => {
    const word = selectedWords[index]
    setSelectedWords(prev => prev.filter((_, i) => i !== index))
    setSentenceWords(prev => [...prev, word])
  }, [selectedWords])

  const checkSentence = useCallback(() => {
    const userAnswer = selectedWords.join(' ') + '.'
    const correct = correctSentence
    
    if (userAnswer.toLowerCase() === correct.toLowerCase()) {
      const points = 20 + (streak * 5)
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      toast.success(`صحيح! +${points} نقاط`)
      
      if (currentIndex < gameWords.length - 1) {
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)
        setSelectedWords([])
        const sentence = `I ${gameWords[nextIndex].word} every day.`
        setCorrectSentence(sentence)
        const wordsInSentence = sentence.replace(/[.]/g, '').split(' ')
        setSentenceWords(shuffleArray(wordsInSentence))
      } else {
        toast.success(`🎉 انتهت اللعبة! النتيجة: ${score + points} نقطة`)
        onGameComplete(score + points, gameWords.length)
        setActiveGame(null)
        setGameStarted(false)
      }
    } else {
      setStreak(0)
      toast.error('خطأ! رتب الكلمات لتكوين جملة صحيحة')
    }
  }, [selectedWords, correctSentence, streak, currentIndex, gameWords, score, onGameComplete])

  const exitGame = useCallback(() => {
    setActiveGame(null)
    setGameStarted(false)
  }, [])

  const getHint = useCallback(() => {
    if (!gameWords[currentIndex]) return
    
    const word = gameWords[currentIndex].word
    const hintLength = Math.ceil(word.length / 3)
    const hint = word.substring(0, hintLength) + '_'.repeat(word.length - hintLength)
    setShowHint(true)
    toast.info(`تلميح: ${hint}`)
  }, [gameWords, currentIndex])

  // ================== RENDER ==================

  if (!activeGame) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">ألعاب تعليمية</h2>
          <p className="text-gray-500">تعلّم بطريقة ممتعة وتفاعلية</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Spelling Game */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="cursor-pointer border-0 shadow-md hover:shadow-xl transition-all"
              onClick={startSpellingGame}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Keyboard className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">لعبة الإملاء</h3>
                <p className="text-sm text-gray-500">اكتب الكلمة الصحيحة</p>
                <Badge variant="secondary" className="mt-2">+10-20 نقطة</Badge>
              </CardContent>
            </Card>
          </motion.div>

          {/* Scramble Game */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="cursor-pointer border-0 shadow-md hover:shadow-xl transition-all"
              onClick={startScrambleGame}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Shuffle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">ترتيب الحروف</h3>
                <p className="text-sm text-gray-500">رتب الحروف لتكوين الكلمة</p>
                <Badge variant="secondary" className="mt-2">+15-25 نقطة</Badge>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sentence Game */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="cursor-pointer border-0 shadow-md hover:shadow-xl transition-all"
              onClick={startSentenceGame}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">ترتيب الجمل</h3>
                <p className="text-sm text-gray-500">كوّن جملة صحيحة</p>
                <Badge variant="secondary" className="mt-2">+20-30 نقطة</Badge>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {words.length < 5 && (
          <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-amber-600 dark:text-amber-400">
              أضف المزيد من الكلمات لفتح جميع الألعاب (تحتاج 5 كلمات على الأقل)
            </p>
          </div>
        )}
      </div>
    )
  }

  // Game UI
  const currentWord = gameWords[currentIndex]
  const progress = ((currentIndex + 1) / gameWords.length) * 100

  return (
    <div className="max-w-lg mx-auto">
      <Card className="shadow-xl">
        {/* Header */}
        <CardHeader className="text-center pb-2">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline" className="text-sm">
              {currentIndex + 1} / {gameWords.length}
            </Badge>
            <div className="flex items-center gap-2">
              {streak > 1 && (
                <Badge className="bg-orange-500 text-white">
                  🔥 {streak}
                </Badge>
              )}
              <Badge className="bg-amber-100 text-amber-700">
                <Trophy className="w-3 h-3 mr-1" />
                {score}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </CardHeader>

        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {/* Spelling Game */}
            {activeGame === 'spelling' && currentWord && (
              <motion.div
                key={`spelling-${currentIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <p className="text-gray-500 mb-2">اكتب الكلمة:</p>
                <h2 className="text-3xl font-bold mb-6">{currentWord.translation}</h2>
                
                {showHint && (
                  <p className="text-sm text-blue-500 mb-4">
                    تلميح: يبدأ بـ "{currentWord.word[0].toUpperCase()}"
                  </p>
                )}
                
                <Input
                  value={spellingInput}
                  onChange={(e) => setSpellingInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkSpelling()}
                  placeholder="اكتب الكلمة هنا..."
                  className="text-center text-lg h-12 mb-4"
                  autoFocus
                />
                
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={getHint}>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    تلميح
                  </Button>
                  <Button onClick={checkSpelling}>
                    تحقق
                  </Button>
                </div>
                
                {speak && (
                  <Button variant="ghost" className="mt-4" onClick={() => speak(currentWord.word)}>
                    <Volume2 className="w-4 h-4 mr-2" />
                    استمع للنطق
                  </Button>
                )}
              </motion.div>
            )}

            {/* Scramble Game */}
            {activeGame === 'scramble' && currentWord && (
              <motion.div
                key={`scramble-${currentIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <p className="text-gray-500 mb-2">رتب الحروف لتكوين:</p>
                <h2 className="text-3xl font-bold mb-6">{currentWord.translation}</h2>
                
                {/* Selected letters */}
                <div className="min-h-12 flex flex-wrap justify-center gap-2 mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  {selectedLetters.length === 0 ? (
                    <span className="text-gray-400">اضغط على الحروف</span>
                  ) : (
                    selectedLetters.map((letter, i) => (
                      <motion.button
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => handleSelectedWordClick(i)}
                        className="w-10 h-10 bg-emerald-500 text-white rounded-lg font-bold text-lg hover:bg-emerald-600 transition-colors"
                      >
                        {letter}
                      </motion.button>
                    ))
                  )}
                </div>
                
                {/* Available letters */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {scrambledLetters.map((letter, i) => (
                    <motion.button
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={() => handleLetterClick(letter, i)}
                      className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      {letter}
                    </motion.button>
                  ))}
                </div>
                
                <Button onClick={checkScramble}>تحقق</Button>
              </motion.div>
            )}

            {/* Sentence Game */}
            {activeGame === 'sentence' && currentWord && (
              <motion.div
                key={`sentence-${currentIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <p className="text-gray-500 mb-2">رتّب الكلمات لتكوين جملة:</p>
                <h2 className="text-2xl font-bold mb-4">"{currentWord.translation}"</h2>
                <p className="text-sm text-gray-400 mb-6">استخدم الكلمة في جملة</p>
                
                {/* Selected words */}
                <div className="min-h-12 flex flex-wrap justify-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  {selectedWords.length === 0 ? (
                    <span className="text-gray-400">اضغط على الكلمات</span>
                  ) : (
                    selectedWords.map((word, i) => (
                      <motion.button
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => handleSelectedWordClick(i)}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                      >
                        {word}
                      </motion.button>
                    ))
                  )}
                </div>
                
                {/* Available words */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {sentenceWords.map((word, i) => (
                    <motion.button
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={() => handleWordClick(word, i)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      {word}
                    </motion.button>
                  ))}
                </div>
                
                <Button onClick={checkSentence}>تحقق</Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exit button */}
          <Button variant="ghost" className="w-full mt-4" onClick={exitGame}>
            <X className="w-4 h-4 mr-2" />
            إنهاء اللعبة
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
