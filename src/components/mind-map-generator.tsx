'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Search, Sparkles, RefreshCw, Volume2,
  ZoomIn, ZoomOut, RotateCcw, Download, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MindMapNode {
  word: string
  children: MindMapNode[]
}

interface MindMapGeneratorProps {
  currentUserId?: string
}

// Branch colors for each category
const branchColors = [
  { bg: '#10B981', light: '#D1FAE5', dark: '#065F46', label: 'emerald' },
  { bg: '#F59E0B', light: '#FEF3C7', dark: '#92400E', label: 'amber' },
  { bg: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6', label: 'violet' },
  { bg: '#EF4444', light: '#FEE2E2', dark: '#991B1B', label: 'rose' },
  { bg: '#3B82F6', light: '#DBEAFE', dark: '#1E40AF', label: 'blue' },
  { bg: '#EC4899', light: '#FCE7F3', dark: '#9D174D', label: 'pink' },
]

export function MindMapGenerator({ currentUserId }: MindMapGeneratorProps) {
  const [word, setWord] = useState('')
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [zoom, setZoom] = useState(1)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const svgRef = useRef<SVGSVGElement>(null)

  const generateMindMap = useCallback(async (searchWord?: string) => {
    const targetWord = searchWord || word.trim()
    if (!targetWord) {
      toast.error('الرجاء إدخال كلمة')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord })
      })

      if (!response.ok) throw new Error('Failed to generate mind map')

      const data = await response.json()
      setMindMap(data.mindMap)
      
      // Auto-expand all nodes
      const allNodes = new Set<string>()
      const collectNodes = (node: MindMapNode) => {
        allNodes.add(node.word)
        node.children?.forEach(collectNodes)
      }
      if (data.mindMap) {
        collectNodes(data.mindMap)
        setExpandedNodes(allNodes)
      }

      // Add to history
      if (!history.includes(targetWord.toLowerCase())) {
        setHistory(prev => [targetWord.toLowerCase(), ...prev].slice(0, 10))
      }

      toast.success('تم توليد الخريطة الذهنية بنجاح! 🧠')
    } catch {
      toast.error('فشل في توليد الخريطة الذهنية')
    } finally {
      setIsLoading(false)
    }
  }, [word, history])

  const speakWord = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const exportMindMap = useCallback(() => {
    if (!svgRef.current) return
    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mindmap-${mindMap?.word || 'export'}.svg`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('تم تصدير الخريطة الذهنية')
  }, [mindMap])

  const toggleNode = (nodeWord: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeWord)) {
        newSet.delete(nodeWord)
      } else {
        newSet.add(nodeWord)
      }
      return newSet
    })
  }

  // Calculate tree layout for SVG rendering
  const calculateLayout = (node: MindMapNode, x: number, y: number, angle: number, radius: number, depth: number): {
    nodes: { x: number; y: number; word: string; depth: number; colorIdx: number; childCount: number }[]
    links: { x1: number; y1: number; x2: number; y2: number; colorIdx: number }[]
  } => {
    const nodes: { x: number; y: number; word: string; depth: number; colorIdx: number; childCount: number }[] = []
    const links: { x1: number; y1: number; x2: number; y2: number; colorIdx: number }[] = []

    // Root node
    nodes.push({ x, y, word: node.word, depth: 0, colorIdx: -1, childCount: node.children.length })

    if (node.children.length === 0) return { nodes, links }

    const angleStep = (2 * Math.PI) / node.children.length
    const childRadius = depth === 0 ? 180 : 130

    node.children.forEach((child, i) => {
      const childAngle = angleStep * i - Math.PI / 2
      const childX = x + childRadius * Math.cos(childAngle)
      const childY = y + childRadius * Math.sin(childAngle)

      nodes.push({ x: childX, y: childY, word: child.word, depth: 1, colorIdx: i % branchColors.length, childCount: child.children.length })
      links.push({ x1: x, y1: y, x2: childX, y2: childY, colorIdx: i % branchColors.length })

      // Third level
      if (child.children.length > 0) {
        const subAngleStep = (Math.PI * 0.8) / child.children.length
        const startAngle = childAngle - (Math.PI * 0.4)
        const subRadius = 110

        child.children.forEach((grandchild, j) => {
          const gcAngle = startAngle + subAngleStep * (j + 0.5)
          const gcX = childX + subRadius * Math.cos(gcAngle)
          const gcY = childY + subRadius * Math.sin(gcAngle)

          nodes.push({ x: gcX, y: gcY, word: grandchild.word, depth: 2, colorIdx: i % branchColors.length, childCount: 0 })
          links.push({ x1: childX, y1: childY, x2: gcX, y2: gcY, colorIdx: i % branchColors.length })
        })
      }
    })

    return { nodes, links }
  }

  const layout = mindMap ? calculateLayout(mindMap, 450, 350, 0, 0, 0) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الخرائط الذهنية</h2>
            <p className="text-gray-500 text-sm">أدخل كلمة وسيولد الذكاء الاصطناعي شجرة مرتبطة بالكلمة</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          مدعوم بـ AI
        </Badge>
      </div>

      {/* Search Input */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateMindMap()}
                placeholder="أدخل كلمة بالإنجليزية... (مثل: happy, learn, book)"
                className="pr-10 text-lg h-12"
                dir="ltr"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => generateMindMap()}
              disabled={isLoading || !word.trim()}
              className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  توليد
                </>
              )}
            </Button>
          </div>

          {/* Quick word suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['happy', 'learn', 'beautiful', 'think', 'grow', 'dream', 'create', 'explore'].map((w) => (
              <Badge
                key={w}
                variant="secondary"
                className="cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                onClick={() => {
                  setWord(w)
                  generateMindMap(w)
                }}
              >
                {w}
              </Badge>
            ))}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 mb-2">سابقًا:</p>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h) => (
                  <Badge
                    key={h}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
                    onClick={() => {
                      setWord(h)
                      generateMindMap(h)
                    }}
                  >
                    {h}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mind Map Visualization */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-200 dark:border-emerald-800" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <Brain className="absolute inset-0 m-auto w-8 h-8 text-emerald-500" />
            </div>
            <p className="mt-4 text-gray-500 animate-pulse">جاري توليد الخريطة الذهنية...</p>
          </motion.div>
        )}

        {mindMap && !isLoading && layout && (
          <motion.div
            key="mindmap"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(1)}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => speakWord(mindMap.word)}>
                  <Volume2 className="w-4 h-4 ml-1" />
                  نطق الكلمة
                </Button>
                <Button variant="outline" size="sm" onClick={exportMindMap}>
                  <Download className="w-4 h-4 ml-1" />
                  تصدير
                </Button>
              </div>
            </div>

            {/* SVG Mind Map */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                  <svg
                    ref={svgRef}
                    viewBox="0 0 900 700"
                    className="w-full"
                    style={{ 
                      minWidth: 600, 
                      minHeight: 500,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                      </filter>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Links */}
                    {layout.links.map((link, i) => (
                      <g key={`link-${i}`}>
                        <line
                          x1={link.x1}
                          y1={link.y1}
                          x2={link.x2}
                          y2={link.y2}
                          stroke={branchColors[link.colorIdx]?.bg || '#9CA3AF'}
                          strokeWidth={2.5}
                          strokeOpacity={0.4}
                        />
                        <line
                          x1={link.x1}
                          y1={link.y1}
                          x2={link.x2}
                          y2={link.y2}
                          stroke={branchColors[link.colorIdx]?.bg || '#9CA3AF'}
                          strokeWidth={2}
                          strokeOpacity={0.6}
                          strokeDasharray="6 3"
                        />
                      </g>
                    ))}

                    {/* Nodes */}
                    {layout.nodes.map((node, i) => {
                      const color = node.colorIdx >= 0 ? branchColors[node.colorIdx] : null
                      const isRoot = node.depth === 0
                      const isCategory = node.depth === 1

                      // Calculate text width approximation
                      const textLen = node.word.length
                      const nodeWidth = isRoot ? Math.max(textLen * 14 + 40, 120) : isCategory ? Math.max(textLen * 10 + 30, 90) : Math.max(textLen * 9 + 24, 70)
                      const nodeHeight = isRoot ? 52 : isCategory ? 40 : 34
                      const fontSize = isRoot ? 18 : isCategory ? 14 : 12
                      const fontWeight = isRoot ? 800 : isCategory ? 700 : 500

                      return (
                        <g
                          key={`node-${i}`}
                          className="cursor-pointer"
                          onClick={() => {
                            speakWord(node.word)
                            if (node.childCount > 0) toggleNode(node.word)
                          }}
                        >
                          {/* Node background */}
                          <rect
                            x={node.x - nodeWidth / 2}
                            y={node.y - nodeHeight / 2}
                            width={nodeWidth}
                            height={nodeHeight}
                            rx={isRoot ? 26 : isCategory ? 20 : 17}
                            fill={isRoot ? '#10B981' : isCategory ? (color?.light || '#F3F4F6') : 'white'}
                            stroke={isRoot ? 'none' : isCategory ? (color?.bg || '#9CA3AF') : (color?.bg || '#D1D5DB')}
                            strokeWidth={isRoot ? 0 : isCategory ? 2 : 1.5}
                            filter="url(#shadow)"
                          />

                          {/* Category indicator dot */}
                          {isCategory && color && (
                            <circle
                              cx={node.x - nodeWidth / 2 + 14}
                              cy={node.y}
                              r={4}
                              fill={color.bg}
                            />
                          )}

                          {/* Node text */}
                          <text
                            x={node.x + (isCategory ? 4 : 0)}
                            y={node.y + fontSize * 0.35}
                            textAnchor="middle"
                            fill={isRoot ? 'white' : isCategory ? (color?.dark || '#374151') : '#374151'}
                            fontSize={fontSize}
                            fontWeight={fontWeight}
                            fontFamily="system-ui, sans-serif"
                          >
                            {node.word}
                          </text>

                          {/* Root glow effect */}
                          {isRoot && (
                            <rect
                              x={node.x - nodeWidth / 2 - 4}
                              y={node.y - nodeHeight / 2 - 4}
                              width={nodeWidth + 8}
                              height={nodeHeight + 8}
                              rx={30}
                              fill="none"
                              stroke="#10B981"
                              strokeWidth={2}
                              strokeOpacity={0.3}
                              filter="url(#glow)"
                            />
                          )}

                          {/* Volume icon hint on hover */}
                          {!isRoot && (
                            <circle
                              cx={node.x + nodeWidth / 2 - 10}
                              cy={node.y - nodeHeight / 2 + 10}
                              r={6}
                              fill={color?.bg || '#9CA3AF'}
                              fillOpacity={0.15}
                            />
                          )}
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Word Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mindMap.children?.map((branch, idx) => {
                const color = branchColors[idx % branchColors.length]
                return (
                  <Card key={branch.word} className="border-0 shadow-md overflow-hidden">
                    <div className="h-1.5" style={{ background: color.bg }} />
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-3 h-3 rounded-full" style={{ background: color.bg }} />
                        {branch.word}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex flex-wrap gap-2">
                        {branch.children?.map((child) => (
                          <Badge
                            key={child.word}
                            variant="secondary"
                            className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-sm py-1 px-3"
                            onClick={() => speakWord(child.word)}
                          >
                            {child.word}
                            <Volume2 className="w-3 h-3 mr-1 opacity-50" />
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </motion.div>
        )}

        {!mindMap && !isLoading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <Brain className="w-20 h-20 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500 mb-2">أدخل كلمة للبدء</h3>
            <p className="text-gray-400 dark:text-gray-600 max-w-md mx-auto">
              اكتب أي كلمة إنجليزية وسيولد الذكاء الاصطناعي خريطة ذهنية شاملة تتضمن المرادفات، المتضادات، الكلمات المرتبطة، أشكال الكلمة، والعبارات
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
