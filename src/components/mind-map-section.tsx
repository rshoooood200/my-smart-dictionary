'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'

interface Branch {
  category_name: string
  arabic_category: string
  words: string[]
}

interface MindMapData {
  center_word: string
  branches: Branch[]
}

const branchColors = [
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-800', line: '#10B981' },
  { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-300 dark:border-rose-800', line: '#F43F5E' },
  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-800', line: '#3B82F6' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-800', line: '#F59E0B' },
  { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-300 dark:border-violet-800', line: '#8B5CF6' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-300 dark:border-cyan-800', line: '#06B6D4' },
]

export function MindMapSection() {
  const currentUserId = useVocabStore(state => state.currentUserId)
  const [word, setWord] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mapData, setMapData] = useState<MindMapData | null>(null)

  const generateMap = async () => {
    if (!word.trim()) return
    setIsLoading(true)
    setMapData(null)

    try {
      const res = await fetch('/api/mind-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim(), userId: currentUserId }),
      })
      const data = await res.json()

      if (data.success && data.data) {
        setMapData(data.data)
      } else {
        toast.error(data.error || 'فشل في توليد الخريطة الذهنية')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600" />
            الخرائط الذهنية للكلمات
          </CardTitle>
          <p className="text-sm text-gray-500">أدخل كلمة وسيتم تصميم خريطة ذهنية توضح كل الكلمات المرتبطة بها بشكل احترافي</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="اكتب كلمة بالإنجليزية (مثال: Adventure)..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => e.key === 'Enter' && generateMap()}
              />
            </div>
            <Button onClick={generateMap} disabled={isLoading || !word} className="bg-violet-600 hover:bg-violet-700">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              توليد الخريطة
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {mapData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-8"
            style={{ minHeight: '500px' }}
          >
            {/* SVG Lines Background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {mapData.branches.map((branch, index) => {
                const angle = (2 * Math.PI * index) / mapData.branches.length - Math.PI / 2
                const radius = 38
                const x = 50 + radius * Math.cos(angle)
                const y = 50 + radius * Math.sin(angle)
                
                return (
                  <motion.line
                    key={index}
                    x1="50%" y1="50%"
                    x2={`${x}%`} y2={`${y}%`}
                    stroke={branchColors[index % branchColors.length].line}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 0.8, delay: index * 0.15 }}
                  />
                )
              })}
            </svg>

            {/* Center Word */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800">
                <span className="text-white font-bold text-xl text-center px-2">{mapData.center_word}</span>
              </div>
            </motion.div>

            {/* Branches */}
            {mapData.branches.map((branch, index) => {
              const angle = (2 * Math.PI * index) / mapData.branches.length - Math.PI / 2
              const radius = 38
              const x = 50 + radius * Math.cos(angle)
              const y = 50 + radius * Math.sin(angle)
              const color = branchColors[index % branchColors.length]

              return (
                <motion.div
                  key={index}
                  className="absolute z-10 w-48"
                  style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                >
                  <Card className={`shadow-lg border-2 ${color.border} ${color.bg}`}>
                    <CardContent className="p-3">
                      <Badge variant="outline" className={`mb-2 text-xs ${color.text} border-current`}>
                        {branch.arabic_category}
                      </Badge>
                      <div className="flex flex-wrap gap-1.5">
                        {branch.words.map((w, i) => (
                          <span key={i} className={`text-sm font-medium ${color.text}`}>
                            {w}{i < branch.words.length - 1 ? ' •' : ''}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
