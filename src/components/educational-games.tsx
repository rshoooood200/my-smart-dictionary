'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gamepad2, Shuffle, Target, Clock, Trophy, Star, 
  Check, X, RefreshCw, ArrowRight, Zap, Award,
  Brain, Lightbulb, Volume2, Puzzle, Pen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { speakWord } from '@/hooks/use-speech'

// Types
interface Word {
  id: string
  word: string
  translation: string
  pronunciation?: string | null
  definition?: string | null
  partOfSpeech?: string | null
  sentences: { id: string; sentence: string; translation: string }[]
}

interface GameResult {
  score: number
  total: number
  correct: number
  wrong: number
  xpEarned: number
  timeSpent: number
}

interface GameConfig {
  name: string
  nameAr: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  xpPerCorrect: number
}

// Game Configurations
const gameConfigs: GameConfig[] = [
  {
    name: 'word-match',
    nameAr: 'مطابقة الكلمات',
    description: 'طابق الكلمات بمعانيها الصحيحة',
    icon: Target,
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-600',
    xpPerCorrect: 5
  },
  {
    name: 'word-scramble',
    nameAr: 'ترتيب الحروف',
    description: 'أعد ترتيب الحروف لتكوين الكلمة الصحيحة',
    icon: Shuffle,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-amber-600',
    xpPerCorrect: 10
  },
  {
    name: 'fill-blank',
    nameAr: 'املأ الفراغ',
    description: 'أكمل الجملة بالكلمة المناسبة',
    icon: Pen,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-600',
    xpPerCorrect: 15
  },
  {
    name: 'spelling-challenge',
    nameAr: 'تحدي الإملاء',
    description: 'اكتب الكلمة الصحيحة من الترجمة',
    icon: Brain,
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-blue-600',
    xpPerCorrect: 20
  }
]

// Props
interface EducationalGamesProps {
  words: Word[]
  onGameComplete?: (result: GameResult) => void
}

export function EducationalGames({ words, onGameComplete }: EducationalGamesProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  const handleGameComplete = useCallback(async (result: GameResult) => {
    setGameResult(result)
    setGameStarted(false)
    
    // Save game result to API
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result,
          gameType: selectedGame
        })
      })
    } catch (error) {
      console.error('Failed to save game result:', error)
    }
    
    onGameComplete?.(result)
  }, [selectedGame, onGameComplete])

  const startGame = (gameName: string) => {
    if (words.length < 4) {
      toast.error('تحتاج على الأقل 4 كلمات للعب')
      return
    }
    setSelectedGame(gameName)
    setGameStarted(true)
    setGameResult(null)
  }

  const exitGame = () => {
    setSelectedGame(null)
    setGameStarted(false)
    setGameResult(null)
  }

  const playAgain = () => {
    setGameStarted(true)
    setGameResult(null)
  }

  // Game Selection Screen
  if (!selectedGame) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            الألعاب التعليمية
          </h2>
          <p className="text-gray-500">
            تعلم بطريقة ممتعة وتكسب نقاط خبرة!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {gameConfigs.map((game, index) => (
            <motion.div
              key={game.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => startGame(game.name)}
              >
                <div className={cn("h-2 bg-gradient-to-l", game.gradient)} />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-2xl bg-gradient-to-br", game.gradient)}>
                      <game.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {game.nameAr}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {game.description}
                      </p>
                      <Badge variant="outline" className="gap-1">
                        <Zap className="w-3 h-3" />
                        +{game.xpPerCorrect} XP للإجابة الصحيحة
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {words.length < 4 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <CardContent className="p-4 flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <p className="text-amber-700 dark:text-amber-400 text-sm">
                أضف على الأقل 4 كلمات لتتمكن من لعب الألعاب التعليمية
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Game Result Screen
  if (gameResult && !gameStarted) {
    const gameConfig = gameConfigs.find(g => g.name === selectedGame)!
    const percentage = Math.round((gameResult.correct / gameResult.total) * 100)
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className={cn("h-3 bg-gradient-to-l", gameConfig.gradient)} />
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className={cn(
                "w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center",
                percentage >= 70 ? "bg-emerald-100 dark:bg-emerald-900/30" : 
                percentage >= 50 ? "bg-amber-100 dark:bg-amber-900/30" : 
                "bg-rose-100 dark:bg-rose-900/30"
              )}
            >
              {percentage >= 70 ? (
                <Trophy className="w-12 h-12 text-emerald-600" />
              ) : percentage >= 50 ? (
                <Star className="w-12 h-12 text-amber-600" />
              ) : (
                <RefreshCw className="w-12 h-12 text-rose-600" />
              )}
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {percentage >= 70 ? 'أحسنت!' : percentage >= 50 ? 'جيد!' : 'حاول مرة أخرى!'}
            </h2>
            
            <p className="text-gray-500 mb-6">{gameConfig.nameAr}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <div className="text-3xl font-bold text-emerald-600">{gameResult.correct}</div>
                <div className="text-sm text-gray-500">إجابات صحيحة</div>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                <div className="text-3xl font-bold text-rose-600">{gameResult.wrong}</div>
                <div className="text-sm text-gray-500">إجابات خاطئة</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl mb-6">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-violet-600" />
                <span className="text-2xl font-bold text-violet-600">+{gameResult.xpEarned}</span>
                <span className="text-gray-500">نقطة خبرة</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={exitGame}
              >
                العودة للألعاب
              </Button>
              <Button 
                className={cn("flex-1 rounded-xl bg-gradient-to-r", gameConfig.gradient)}
                onClick={playAgain}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                العب مجدداً
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Game Screens
  const gameConfig = gameConfigs.find(g => g.name === selectedGame)!
  
  switch (selectedGame) {
    case 'word-match':
      return <WordMatchGame words={words} config={gameConfig} onComplete={handleGameComplete} onExit={exitGame} />
    case 'word-scramble':
      return <WordScrambleGame words={words} config={gameConfig} onComplete={handleGameComplete} onExit={exitGame} />
    case 'fill-blank':
      return <FillBlankGame words={words} config={gameConfig} onComplete={handleGameComplete} onExit={exitGame} />
    case 'spelling-challenge':
      return <SpellingGame words={words} config={gameConfig} onComplete={handleGameComplete} onExit={exitGame} />
    default:
      return null
  }
}

// ============================================
// WORD MATCH GAME
// ============================================
interface GameProps {
  words: Word[]
  config: GameConfig
  onComplete: (result: GameResult) => void
  onExit: () => void
}

function WordMatchGame({ words, config, onComplete, onExit }: GameProps) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [options, setOptions] = useState<{ word: Word; isCorrect: boolean }[]>([])
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [gameWords, setGameWords] = useState<Word[]>([])
  const startTime = useState(Date.now())[0]

  const totalRounds = Math.min(10, words.length)

  // Initialize game
  useEffect(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, totalRounds)
    setGameWords(shuffled)
  }, [words, totalRounds])

  // Setup round
  useEffect(() => {
    if (gameWords.length > 0 && round < totalRounds) {
      const word = gameWords[round]
      setCurrentWord(word)
      
      // Create options (1 correct + 3 wrong)
      const wrongOptions = words
        .filter(w => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      
      const allOptions = [
        { word, isCorrect: true },
        ...wrongOptions.map(w => ({ word: w, isCorrect: false }))
      ].sort(() => Math.random() - 0.5)
      
      setOptions(allOptions)
      setTimeLeft(15)
      setShowResult(false)
      setSelectedOption(null)
    }
  }, [round, gameWords, words])

  // Timer
  useEffect(() => {
    if (showResult || round >= totalRounds) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null)
          return 15
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [showResult, round, totalRounds])

  const handleAnswer = (optionId: string | null) => {
    if (showResult) return
    
    setSelectedOption(optionId)
    setShowResult(true)
    
    const isCorrect = options.find(o => o.word.id === optionId)?.isCorrect || false
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }))
    }

    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        const finalCorrect = score.correct + (isCorrect ? 1 : 0)
        const finalWrong = score.wrong + (isCorrect ? 0 : 1)
        onComplete({
          score: finalCorrect,
          total: totalRounds,
          correct: finalCorrect,
          wrong: finalWrong,
          xpEarned: finalCorrect * config.xpPerCorrect,
          timeSpent: Math.round((Date.now() - startTime) / 1000)
        })
      } else {
        setRound(prev => prev + 1)
      }
    }, 1500)
  }

  if (!currentWord) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onExit}>
          <X className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-base px-4">
            {round + 1} / {totalRounds}
          </Badge>
          <div className="flex items-center gap-2">
            <Clock className={cn("w-5 h-5", timeLeft <= 5 ? "text-rose-500 animate-pulse" : "text-gray-400")} />
            <span className={cn("font-bold", timeLeft <= 5 ? "text-rose-500" : "")}>{timeLeft}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-100 text-emerald-700">
            <Check className="w-3 h-3 mr-1" /> {score.correct}
          </Badge>
          <Badge className="bg-rose-100 text-rose-700">
            <X className="w-3 h-3 mr-1" /> {score.wrong}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={((round + 1) / totalRounds) * 100} className="h-2 mb-8" />

      {/* Question */}
      <motion.div
        key={round}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
            {currentWord.word}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => speakWord(currentWord.word)}
            className="rounded-full"
          >
            <Volume2 className="w-6 h-6 text-violet-500" />
          </Button>
        </div>
        {currentWord.pronunciation && (
          <p className="text-gray-500">/{currentWord.pronunciation}/</p>
        )}
        <p className="text-gray-400 mt-4">اختر الترجمة الصحيحة</p>
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.word.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleAnswer(option.word.id)}
            disabled={showResult}
            className={cn(
              "p-6 rounded-2xl border-2 text-right transition-all duration-300",
              "hover:shadow-lg active:scale-95",
              showResult && option.isCorrect
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                : showResult && selectedOption === option.word.id && !option.isCorrect
                ? "border-rose-500 bg-rose-50 dark:bg-rose-900/30"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {option.word.translation}
              </span>
              {showResult && option.isCorrect && (
                <Check className="w-6 h-6 text-emerald-500" />
              )}
              {showResult && selectedOption === option.word.id && !option.isCorrect && (
                <X className="w-6 h-6 text-rose-500" />
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// WORD SCRAMBLE GAME
// ============================================
function WordScrambleGame({ words, config, onComplete, onExit }: GameProps) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([])
  const [selectedLetters, setSelectedLetters] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [gameWords, setGameWords] = useState<Word[]>([])
  const startTime = useState(Date.now())[0]
  const totalRounds = Math.min(10, words.length)

  // Initialize game
  useEffect(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, totalRounds)
    setGameWords(shuffled)
  }, [words, totalRounds])

  // Setup round
  useEffect(() => {
    if (gameWords.length > 0 && round < totalRounds) {
      const word = gameWords[round]
      setCurrentWord(word)
      
      // Scramble letters
      const letters = word.word.split('').sort(() => Math.random() - 0.5)
      setScrambledLetters(letters)
      setSelectedLetters([])
      setShowResult(false)
    }
  }, [round, gameWords])

  const selectLetter = (index: number) => {
    if (showResult) return
    
    const letter = scrambledLetters[index]
    setSelectedLetters(prev => [...prev, letter])
    setScrambledLetters(prev => prev.filter((_, i) => i !== index))
  }

  const unselectLetter = (index: number) => {
    if (showResult) return
    
    const letter = selectedLetters[index]
    setScrambledLetters(prev => [...prev, letter])
    setSelectedLetters(prev => prev.filter((_, i) => i !== index))
  }

  const checkAnswer = () => {
    const answer = selectedLetters.join('').toLowerCase()
    const correct = currentWord!.word.toLowerCase()
    
    setShowResult(true)
    
    if (answer === correct) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }))
    }

    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        const isCorrect = answer === correct
        onComplete({
          score: score.correct + (isCorrect ? 1 : 0),
          total: totalRounds,
          correct: score.correct + (isCorrect ? 1 : 0),
          wrong: score.wrong + (isCorrect ? 0 : 1),
          xpEarned: (score.correct + (isCorrect ? 1 : 0)) * config.xpPerCorrect,
          timeSpent: Math.round((Date.now() - startTime) / 1000)
        })
      } else {
        setRound(prev => prev + 1)
      }
    }, 1500)
  }

  const skipQuestion = () => {
    setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }))
    setShowResult(true)
    
    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        onComplete({
          score: score.correct,
          total: totalRounds,
          correct: score.correct,
          wrong: score.wrong + 1,
          xpEarned: score.correct * config.xpPerCorrect,
          timeSpent: Math.round((Date.now() - startTime) / 1000)
        })
      } else {
        setRound(prev => prev + 1)
      }
    }, 1500)
  }

  if (!currentWord) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onExit}>
          <X className="w-5 h-5" />
        </Button>
        <Badge variant="outline" className="text-base px-4">
          {round + 1} / {totalRounds}
        </Badge>
        <div className="flex gap-2">
          <Badge className="bg-emerald-100 text-emerald-700">
            <Check className="w-3 h-3 mr-1" /> {score.correct}
          </Badge>
          <Badge className="bg-rose-100 text-rose-700">
            <X className="w-3 h-3 mr-1" /> {score.wrong}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={((round + 1) / totalRounds) * 100} className="h-2 mb-8" />

      {/* Translation Hint */}
      <motion.div
        key={round}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="text-gray-400 mb-2">رتّب الحروف لتكتب الكلمة التي تعني:</p>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {currentWord.translation}
        </h2>
      </motion.div>

      {/* Selected Letters (Answer) */}
      <div className="min-h-16 p-4 mb-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
        <div className="flex flex-wrap justify-center gap-2">
          {selectedLetters.map((letter, index) => (
            <motion.button
              key={`selected-${index}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => unselectLetter(index)}
              disabled={showResult}
              className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-xl font-bold text-xl flex items-center justify-center",
                "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md",
                "hover:shadow-lg transition-all active:scale-95"
              )}
            >
              {letter}
            </motion.button>
          ))}
          {selectedLetters.length === 0 && (
            <p className="text-gray-400 text-sm">اضغط على الحروف لترتيبها</p>
          )}
        </div>
      </div>

      {/* Available Letters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {scrambledLetters.map((letter, index) => (
          <motion.button
            key={`scrambled-${index}`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            onClick={() => selectLetter(index)}
            disabled={showResult}
            className="w-12 h-12 md:w-14 md:h-14 rounded-xl font-bold text-xl flex items-center justify-center
              bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 shadow-md
              hover:shadow-lg hover:border-violet-300 transition-all active:scale-95"
          >
            {letter}
          </motion.button>
        ))}
      </div>

      {/* Result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-2xl text-center mb-6",
              selectedLetters.join('').toLowerCase() === currentWord.word.toLowerCase()
                ? "bg-emerald-50 dark:bg-emerald-900/20"
                : "bg-rose-50 dark:bg-rose-900/20"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <p className={cn(
                "text-lg font-bold",
                selectedLetters.join('').toLowerCase() === currentWord.word.toLowerCase()
                  ? "text-emerald-600"
                  : "text-rose-600"
              )}>
                {selectedLetters.join('').toLowerCase() === currentWord.word.toLowerCase()
                  ? "صحيح! 🎉"
                  : `خطأ! الإجابة: ${currentWord.word}`}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => speakWord(currentWord.word)}
                className="rounded-full"
              >
                <Volume2 className="w-5 h-5 text-orange-500" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={skipQuestion} disabled={showResult}>
          تخطي
        </Button>
        <Button 
          onClick={checkAnswer}
          disabled={selectedLetters.length !== currentWord.word.length || showResult}
          className="bg-gradient-to-r from-violet-500 to-purple-600"
        >
          تحقق
        </Button>
      </div>
    </div>
  )
}

// ============================================
// FILL IN THE BLANK GAME
// ============================================
function FillBlankGame({ words, config, onComplete, onExit }: GameProps) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [sentence, setSentence] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameWords, setGameWords] = useState<Word[]>([])
  const startTime = useState(Date.now())[0]
  const totalRounds = Math.min(10, words.filter(w => w.sentences.length > 0).length)

  // Initialize game
  useEffect(() => {
    const wordsWithSentences = words.filter(w => w.sentences.length > 0)
    const shuffled = wordsWithSentences.sort(() => Math.random() - 0.5).slice(0, totalRounds)
    setGameWords(shuffled)
  }, [words, totalRounds])

  // Setup round
  useEffect(() => {
    if (gameWords.length > 0 && round < totalRounds) {
      const word = gameWords[round]
      setCurrentWord(word)
      
      const originalSentence = word.sentences[0].sentence
      // Create blank by replacing the word with ___
      const regex = new RegExp(`\\b${word.word}\\b`, 'gi')
      const blankedSentence = originalSentence.replace(regex, '_____')
      setSentence(blankedSentence)
      
      // Create options
      const wrongOptions = words
        .filter(w => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.word)
      
      const allOptions = [word.word, ...wrongOptions].sort(() => Math.random() - 0.5)
      setOptions(allOptions)
      setShowResult(false)
      setSelectedOption(null)
    }
  }, [round, gameWords, words])

  const handleAnswer = (option: string) => {
    if (showResult) return
    
    setSelectedOption(option)
    setShowResult(true)
    
    const isCorrect = option.toLowerCase() === currentWord!.word.toLowerCase()
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }))
    }

    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        const finalCorrect = score.correct + (isCorrect ? 1 : 0)
        onComplete({
          score: finalCorrect,
          total: totalRounds,
          correct: finalCorrect,
          wrong: score.wrong + (isCorrect ? 0 : 1),
          xpEarned: finalCorrect * config.xpPerCorrect,
          timeSpent: Math.round((Date.now() - startTime) / 1000)
        })
      } else {
        setRound(prev => prev + 1)
      }
    }, 1500)
  }

  if (!currentWord || totalRounds === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-6">
            <p className="text-amber-700 dark:text-amber-400">
              لا توجد جمل كافية للعب. قم بتوليد جمل للكلمات أولاً.
            </p>
            <Button variant="outline" className="mt-4" onClick={onExit}>
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onExit}>
          <X className="w-5 h-5" />
        </Button>
        <Badge variant="outline" className="text-base px-4">
          {round + 1} / {totalRounds}
        </Badge>
        <div className="flex gap-2">
          <Badge className="bg-emerald-100 text-emerald-700">
            <Check className="w-3 h-3 mr-1" /> {score.correct}
          </Badge>
          <Badge className="bg-rose-100 text-rose-700">
            <X className="w-3 h-3 mr-1" /> {score.wrong}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={((round + 1) / totalRounds) * 100} className="h-2 mb-8" />

      {/* Sentence */}
      <motion.div
        key={round}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-xl md:text-2xl text-gray-900 dark:text-white leading-relaxed">
                {sentence}
              </p>
              {showResult && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const fullSentence = currentWord.sentences[0]?.sentence || ''
                    if (fullSentence) speakWord(fullSentence)
                  }}
                  className="rounded-full"
                >
                  <Volume2 className="w-5 h-5 text-emerald-500" />
                </Button>
              )}
            </div>
            {currentWord.sentences[0] && (
              <p className="text-gray-500 mt-4 text-sm">
                {currentWord.sentences[0].translation}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleAnswer(option)}
            disabled={showResult}
            className={cn(
              "p-4 rounded-2xl border-2 text-center transition-all duration-300 font-medium",
              "hover:shadow-lg active:scale-95",
              showResult && option.toLowerCase() === currentWord.word.toLowerCase()
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700"
                : showResult && selectedOption === option && option.toLowerCase() !== currentWord.word.toLowerCase()
                ? "border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700"
                : "border-gray-200 dark:border-gray-700 hover:border-emerald-300"
            )}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// SPELLING CHALLENGE GAME
// ============================================
function SpellingGame({ words, config, onComplete, onExit }: GameProps) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [userInput, setUserInput] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [gameWords, setGameWords] = useState<Word[]>([])
  const [hintShown, setHintShown] = useState(false)
  const startTime = useState(Date.now())[0]
  const totalRounds = Math.min(10, words.length)

  // Initialize game
  useEffect(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, totalRounds)
    setGameWords(shuffled)
  }, [words, totalRounds])

  // Setup round
  useEffect(() => {
    if (gameWords.length > 0 && round < totalRounds) {
      setCurrentWord(gameWords[round])
      setUserInput('')
      setShowResult(false)
      setHintShown(false)
    }
  }, [round, gameWords])

  const checkAnswer = () => {
    if (!userInput.trim() || showResult) return
    
    setShowResult(true)
    const isCorrect = userInput.trim().toLowerCase() === currentWord!.word.toLowerCase()
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }))
    }

    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        onComplete({
          score: score.correct + (isCorrect ? 1 : 0),
          total: totalRounds,
          correct: score.correct + (isCorrect ? 1 : 0),
          wrong: score.wrong + (isCorrect ? 0 : 1),
          xpEarned: (score.correct + (isCorrect ? 1 : 0)) * config.xpPerCorrect,
          timeSpent: Math.round((Date.now() - startTime) / 1000)
        })
      } else {
        setRound(prev => prev + 1)
      }
    }, 2000)
  }

  if (!currentWord) return null

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onExit}>
          <X className="w-5 h-5" />
        </Button>
        <Badge variant="outline" className="text-base px-4">
          {round + 1} / {totalRounds}
        </Badge>
        <div className="flex gap-2">
          <Badge className="bg-emerald-100 text-emerald-700">
            <Check className="w-3 h-3 mr-1" /> {score.correct}
          </Badge>
          <Badge className="bg-rose-100 text-rose-700">
            <X className="w-3 h-3 mr-1" /> {score.wrong}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={((round + 1) / totalRounds) * 100} className="h-2 mb-8" />

      {/* Translation */}
      <motion.div
        key={round}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="text-gray-400 mb-2">اكتب الكلمة الإنجليزية التي تعني:</p>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {currentWord.translation}
        </h2>
      </motion.div>

      {/* Input */}
      <div className="mb-6">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
          disabled={showResult}
          placeholder="اكتب الكلمة هنا..."
          className={cn(
            "w-full p-4 text-xl text-center rounded-2xl border-2 bg-white dark:bg-gray-800",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500",
            showResult && userInput.trim().toLowerCase() === currentWord.word.toLowerCase()
              ? "border-emerald-500"
              : showResult
              ? "border-rose-500"
              : "border-gray-200 dark:border-gray-700"
          )}
          autoFocus
        />
      </div>

      {/* Hint */}
      {!showResult && (
        <div className="text-center mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setHintShown(true)}
            className="text-gray-400"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            تلميح
          </Button>
          {hintShown && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 mt-2"
            >
              تبدأ بـ: {currentWord.word[0].toUpperCase()}
              {currentWord.word.length > 3 && ` وتحتوي على ${currentWord.word.length} حروف`}
            </motion.p>
          )}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-2xl text-center mb-6",
              userInput.trim().toLowerCase() === currentWord.word.toLowerCase()
                ? "bg-emerald-50 dark:bg-emerald-900/20"
                : "bg-rose-50 dark:bg-rose-900/20"
            )}
          >
            {userInput.trim().toLowerCase() === currentWord.word.toLowerCase() ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-bold text-emerald-600">صحيح! 🎉</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakWord(currentWord.word)}
                  className="rounded-full"
                >
                  <Volume2 className="w-5 h-5 text-cyan-500" />
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-rose-600 mb-2">خطأ!</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    الإجابة الصحيحة: <span className="font-bold">{currentWord.word}</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speakWord(currentWord.word)}
                    className="rounded-full"
                  >
                    <Volume2 className="w-5 h-5 text-cyan-500" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <Button 
        onClick={checkAnswer}
        disabled={!userInput.trim() || showResult}
        className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-lg"
      >
        تحقق
      </Button>
    </div>
  )
}
