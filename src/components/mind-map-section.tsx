'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Sparkles, Zap, Save, Trash2, History, Network, Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useVocabStore } from '@/store/vocab-store'

interface Branch {
  category_name: string
  words: string[]
}

interface MindMapData {
  center_word: string
  branches: Branch[]
  is_correct?: boolean
  suggestions?: string[]
}

const branchColors = [
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-400 dark:border-emerald-700', line: '#10B981' },
  { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-400 dark:border-rose-700', line: '#F43F5E' },
  { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-400 dark:border-blue-700', line: '#3B82F6' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-400 dark:border-amber-700', line: '#F59E0B' },
  { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-400 dark:border-violet-700', line: '#8B5CF6' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-400 dark:border-cyan-700', line: '#06B6D4' },
]

export function MindMapSection() {
  const currentUserId = useVocabStore(state => state.currentUserId)
  const [word, setWord] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mapData, setMapData] = useState<MindMapData | null>(null)
  const [savedMaps, setSavedMaps] = useState<MindMapData[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedMaps = localStorage.getItem('savedMindMaps')
    if (storedMaps) {
      try { setSavedMaps(JSON.parse(storedMaps)) } catch (e) { console.error(e) }
    }
  }, [])

  // السماح بالخروج من Fullscreen عبر زر Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
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
        // فحص إذا كانت الكلمة خاطئة إملائياً
        if (data.data.is_correct === false) {
          const suggestions = data.data.suggestions?.join(', ') || 'No suggestions'
          toast.error(`Word might be misspelled! Did you mean: ${suggestions}?`, { duration: 6000 })
          setIsLoading(false)
          return
        }
        setMapData(data.data)
      } else {
        toast.error(data.error || 'Failed to generate mind map')
      }
    } catch { toast.error('Connection error') } finally { setIsLoading(false) }
  }

  const saveMap = () => {
    if (!mapData) return
    if (savedMaps.some(m => m.center_word === mapData.center_word)) { toast.info('Already saved!'); return }
    const updatedMaps = [mapData, ...savedMaps]
    setSavedMaps(updatedMaps)
    localStorage.setItem('savedMindMaps', JSON.stringify(updatedMaps))
    toast.success('Mind map saved!')
  }

  const deleteMap = (index: number) => {
    const updatedMaps = savedMaps.filter((_, i) => i !== index)
    setSavedMaps(updatedMaps)
    localStorage.setItem('savedMindMaps', JSON.stringify(updatedMaps))
    toast.success('Map deleted')
  }

  const loadMap = (map: MindMapData) => { setWord(map.center_word); setMapData(map) }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Network className="w-5 h-5 text-violet-600" />Mind Maps</CardTitle>
          <p className="text-sm text-gray-500">Generate a visual network of related English words</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Type an English word..." value={word} onChange={(e) => setWord(e.target.value)} className="pr-10" onKeyDown={(e) => e.key === 'Enter' && generateMap()} dir="ltr" />
            </div>
            <Button onClick={() => generateMap()} disabled={isLoading || !word} className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {mapData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-purple-700 p-4 rounded-xl text-white">
              <h2 className="text-xl font-bold capitalize">{mapData.center_word}</h2>
              <div className="flex gap-2">
                <Button onClick={saveMap} variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"><Save className="w-4 h-4 mr-1" />Save</Button>
                <Button onClick={() => setIsFullscreen(!isFullscreen)} variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                  {isFullscreen ? <Minimize className="w-4 h-4 mr-1" /> : <Maximize className="w-4 h-4 mr-1" />}{isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
              </div>
            </div>

            {/* Mind Map Canvas */}
            <div className={cn(
              "relative bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden transition-all duration-300",
              isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-[600px] md:h-[700px]"
            )}>
              
              {/* زر الخروج من Fullscreen العائم */}
              {isFullscreen && (
                <Button 
                  onClick={() => setIsFullscreen(false)} 
                  className="absolute bottom-6 right-6 z-[60] bg-rose-500 hover:bg-rose-600 text-white rounded-full w-14 h-14 shadow-2xl flex items-center justify-center"
                >
                  <Minimize className="w-6 h-6" />
                </Button>
              )}

              <div ref={canvasRef} className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing">
                <div className="relative w-[800px] h-[800px] mx-auto" style={{ minHeight: '100%', minWidth: '100%' }}>
                  
                  {/* SVG Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {mapData.branches.map((branch, index) => {
                      const angle = (2 * Math.PI * index) / mapData.branches.length - Math.PI / 2
                      const r = 30
                      const x = 50 + r * Math.cos(angle)
                      const y = 50 + r * Math.sin(angle)
                      return (
                        <motion.line key={index} x1="50%" y1="50%" x2={`${x}%`} y2={`${y}%`} stroke={branchColors[index % branchColors.length].line} strokeWidth="3" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }} transition={{ duration: 0.8, delay: index * 0.15 }} />
                      )
                    })}
                  </svg>

                  {/* Center Circle */}
                  <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800">
                      <span className="text-white font-bold text-2xl text-center px-2 capitalize">{mapData.center_word}</span>
                    </div>
                  </motion.div>

                  {/* Branch Circles */}
                  {mapData.branches.map((branch, index) => {
                    const angle = (2 * Math.PI * index) / mapData.branches.length - Math.PI / 2
                    const r = 30
                    const x = 50 + r * Math.cos(angle)
                    const y = 50 + r * Math.sin(angle)
                    const color = branchColors[index % branchColors.length]

                    return (
                      <motion.div
                        key={index}
                        className="absolute w-44 z-10"
                        style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                      >
                        <div className={cn("rounded-2xl shadow-xl border-2 p-3 text-center", color.bg, color.border)}>
                          <h3 className={cn("font-bold text-sm mb-1", color.text)}>{branch.category_name}</h3>
                          <div className="flex flex-wrap justify-center gap-1">
                            {branch.words.map((w, i) => (
                              <span key={i} className={cn("text-xs font-medium", color.text)}>{w}{i < branch.words.length - 1 ? ' •' : ''}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Maps */}
      {savedMaps.length > 0 && (
        <Card className="border-0 shadow-md mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><History className="w-5 h-5 text-gray-600" />Saved Mind Maps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {savedMaps.map((map, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors" onClick={() => loadMap(map)}>
                    <Network className="w-6 h-6 text-violet-500" />
                    <span className="font-semibold capitalize text-sm">{map.center_word}</span>
                    <span className="text-xs text-gray-500">{map.branches.length} branches</span>
                  </Button>
                  <button onClick={() => deleteMap(index)} className="absolute -top-2 -left-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 className="w-3 h-3" /></button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
