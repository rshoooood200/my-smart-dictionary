'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Sparkles, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useVocabStore } from '@/store/vocab-store'

interface Branch { category_name: string; words: string[] }
interface CollocationData { center_word: string; branches: Branch[] }

const collColors = [
  { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-400' },
  { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-400' },
  { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-400' },
  { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-400' },
]

export function CollocationsWeb() {
  const currentUserId = useVocabStore(state => state.currentUserId)
  const [word, setWord] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<CollocationData | null>(null)

  const generate = async () => {
    if (!word.trim()) return
    setIsLoading(true); setData(null)
    try {
      const res = await fetch('/api/collocations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim(), userId: currentUserId }),
      })
      const result = await res.json()
      if (result.success && result.data) setData(result.data)
      else toast.error('Failed')
    } catch { toast.error('Error') } finally { setIsLoading(false) }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Network className="w-5 h-5 text-blue-600" />Collocations Web</CardTitle>
          <p className="text-sm text-gray-500">See which words naturally go together</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Type a word (e.g., Decision)..." value={word} onChange={(e) => setWord(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generate()} dir="ltr" />
            <Button onClick={generate} disabled={isLoading || !word} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-xl text-white text-center">
              <p className="text-sm opacity-80">Collocations for</p>
              <h2 className="text-2xl font-bold capitalize">{data.center_word}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.branches.map((branch, index) => {
                const color = collColors[index % collColors.length]
                return (
                  <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
                    <Card className={cn("border-t-4 shadow-sm", color.bg, color.border)}>
                      <CardContent className="p-4">
                        <h3 className={cn("font-bold mb-3", color.text)}>{branch.category_name}</h3>
                        <div className="flex flex-wrap gap-2">
                          {branch.words.map((w, i) => (
                            <Badge key={i} variant="outline" className={cn("bg-white/50 dark:bg-black/20", color.text, "border-current/30")}>{w}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
