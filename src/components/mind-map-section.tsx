'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Sparkles, Zap, Save, Trash2, History, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'

interface Branch {
  category_name: string
  words: string[]
}

interface MindMapData {
  center_word: string
  branches: Branch[]
}

const branchColors = [
  { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-400 dark:border-emerald-700', line: '#10B981' },
  { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-400 dark:border-rose-700', line: '#F43F5E' },
  { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-400 dark:border-blue-700', line: '#3B82F6' },
  { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-400 dark:border-amber-700', line: '#F59E0B' },
  { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-400 dark:border-violet-700', line: '#8B5CF6' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-400 dark:border-cyan-700', line: '#06B6D4' },
]

export function MindMapSection() {
  const currentUserId = useVocabStore(state => state.currentUserId)
  const [word, setWord] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mapData, setMapData] = useState<MindMapData | null>(null)
  
  // Saved Maps State
  const [savedMaps, setSavedMaps] = useState<MindMapData[]>([])

  // Load saved maps from local storage on mount
  useEffect(() => {
    const storedMaps = localStorage.getItem('savedMindMaps')
    if (storedMaps) {
      try {
        setSavedMaps(JSON.parse(storedMaps))
      } catch (e) {
        console.error("Failed to parse saved maps", e)
      }
    }
  }, [])

  const generateMap = async (searchWord?: string) => {
    const query = searchWord || word
    if (!query.trim()) return
    
    setIsLoading(true)
    setMapData(null)

    try {
      const res = await fetch('/api/mind-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: query.trim(), userId: currentUserId }),
      })
      const data = await res.json()

      if (data.success && data.data) {
        setMapData(data.data)
      } else {
        toast.error(data.error || 'Failed to generate mind map')
      }
    } catch (error) {
      toast.error('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveMap = () => {
    if (!mapData) return
    
    // Check if already saved
    const exists = savedMaps.some(m => m.center_word === mapData.center_word)
    if (exists) {
      toast.info('This map is already saved!')
      return
    }

    const updatedMaps = [mapData, ...savedMaps]
    setSavedMaps(updatedMaps)
    localStorage.setItem('savedMindMaps', JSON.stringify(updatedMaps))
    toast.success('Mind map saved successfully!')
  }

  const deleteMap = (index: number) => {
    const updatedMaps = savedMaps.filter((_, i) => i !== index)
    setSavedMaps(updatedMaps)
    localStorage.setItem('savedMindMaps', JSON.stringify(updatedMaps))
    toast.success('Map deleted')
  }

  const loadMap = (map: MindMapData) => {
    setWord(map.center_word)
    setMapData(map)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-violet-600" />
            Mind Maps
          </CardTitle>
          <p className="text-sm text-gray-500">Generate a visual network of related English words</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Type an English word (e.g., Adventure)..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => e.key === 'Enter' && generateMap()}
                dir="ltr"
              />
            </div>
            <Button onClick={() => generateMap()} disabled={isLoading || !word} className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Map Display */}
      <AnimatePresence>
        {mapData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Center Word & Save Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-purple-700 p-6 rounded-2xl shadow-xl text-white">
              <div className="text-center sm:text-right">
                <p className="text-sm opacity-80">Mind Map for</p>
                <h2 className="text-3xl font-bold capitalize">{mapData.center_word}</h2>
              </div>
              <Button onClick={saveMap} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                <Save className="w-4 h-4 mr-2" /> Save Map
              </Button>
            </div>

            {/* Responsive Grid for Branches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapData.branches.map((branch, index) => {
                const color = branchColors[index % branchColors.length]
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`h-full border-r-4 ${color.border} ${color.bg} shadow-sm hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4">
                        <h3 className={`font-bold text-lg mb-3 ${color.text}`}>
                          {branch.category_name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {branch.words.map((w, i) => (
                            <Badge key={i} variant="outline" className={`${color.text} border-current/30 bg-white/50 dark:bg-black/20`}>
                              {w}
                            </Badge>
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

      {/* Saved Maps List */}
      {savedMaps.length > 0 && (
        <Card className="border-0 shadow-md mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-gray-600" />
              Saved Mind Maps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {savedMaps.map((map, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative group"
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    onClick={() => loadMap(map)}
                  >
                    <Network className="w-6 h-6 text-violet-500" />
                    <span className="font-semibold capitalize text-sm">{map.center_word}</span>
                    <span className="text-xs text-gray-500">{map.branches.length} branches</span>
                  </Button>
                  <button
                    onClick={() => deleteMap(index)}
                    className="absolute -top-2 -left-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
