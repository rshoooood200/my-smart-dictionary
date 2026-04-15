'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Trophy, Star, Flame, Target, Zap, Crown, 
  Lock, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useVocabStore } from '@/store/vocab-store'
import { ACHIEVEMENTS, getUserData } from '@/lib/local-storage'
import type { Achievement } from '@/lib/local-storage'

const categoryLabels: Record<string, { label: string; icon: typeof Trophy; color: string }> = {
  words: { label: 'الكلمات', icon: Star, color: 'from-blue-500 to-cyan-500' },
  review: { label: 'المراجعة', icon: Target, color: 'from-green-500 to-emerald-500' },
  streak: { label: 'السلسلة', icon: Flame, color: 'from-orange-500 to-red-500' },
  accuracy: { label: 'الدقة', icon: Zap, color: 'from-purple-500 to-pink-500' },
  progress: { label: 'المستوى', icon: Crown, color: 'from-yellow-500 to-amber-500' },
}

interface AchievementsPanelProps {
  userId: string
}

export function AchievementsPanel({ userId }: AchievementsPanelProps) {
  const { userData, getStats } = useVocabStore()
  const [isOpen, setIsOpen] = useState(false)

  const stats = getStats()
  const achievements = userData?.achievements || []

  // Group achievements by category
  const groupedAchievements = ACHIEVEMENTS.reduce((acc, achievement) => {
    const earned = achievements.find(a => a.key === achievement.key)
    const category = achievement.category
    
    if (!acc[category]) {
      acc[category] = []
    }
    
    acc[category].push({
      ...achievement,
      earnedAt: earned?.earnedAt,
    })
    
    return acc
  }, {} as Record<string, (typeof ACHIEVEMENTS[0] & { earnedAt?: string })[]>)

  const earnedCount = achievements.length
  const totalAchievements = ACHIEVEMENTS.length

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-amber-400 to-yellow-600'
    if (level >= 25) return 'from-purple-400 to-pink-600'
    if (level >= 10) return 'from-blue-400 to-cyan-600'
    if (level >= 5) return 'from-green-400 to-emerald-600'
    return 'from-gray-400 to-gray-600'
  }

  const getLevelTitle = (level: number) => {
    if (level >= 50) return 'أسطوري'
    if (level >= 25) return 'خبير'
    if (level >= 10) return 'متقدم'
    if (level >= 5) return 'متوسط'
    return 'مبتدئ'
  }

  if (!stats || !userData) return null

  const levelInfo = {
    currentLevel: userData.stats.level,
    xpForCurrentLevel: 100,
    xpInCurrentLevel: userData.stats.totalXP % 100,
    progressToNextLevel: userData.stats.totalXP % 100,
  }

  return (
    <>
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className={cn("h-1.5 bg-gradient-to-l", getLevelColor(levelInfo.currentLevel))} />
        <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
          {/* Level Progress */}
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div 
              className={cn(
                "relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                getLevelColor(levelInfo.currentLevel)
              )}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <span className="text-xl md:text-2xl font-bold text-white">{levelInfo.currentLevel}</span>
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs md:text-sm text-gray-500">المستوى {levelInfo.currentLevel}</span>
                  <Badge variant="outline" className="ml-2 text-[10px] md:text-xs">
                    {getLevelTitle(levelInfo.currentLevel)}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {userData.stats.totalXP} XP
                </span>
              </div>
              <Progress value={levelInfo.progressToNextLevel} className="h-2" />
              <p className="text-[10px] md:text-xs text-gray-400 mt-1">
                {levelInfo.xpInCurrentLevel} / 100 XP للمستوى التالي
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
              <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
              <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{userData.stats.currentStreak}</div>
              <div className="text-[10px] md:text-xs text-gray-500">سلسلة</div>
            </div>
            <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
              <Star className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{userData.stats.totalWords}</div>
              <div className="text-[10px] md:text-xs text-gray-500">كلمة</div>
            </div>
            <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
              <Target className="w-5 h-5 mx-auto text-green-500 mb-1" />
              <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{userData.stats.totalReviews}</div>
              <div className="text-[10px] md:text-xs text-gray-500">مراجعة</div>
            </div>
          </div>

          {/* Achievements Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">الإنجازات</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-emerald-600"
                onClick={() => setIsOpen(true)}
              >
                عرض الكل ({earnedCount}/{totalAchievements})
                <ChevronRight className="w-4 h-4 mr-1" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 4).map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" style={{ color: achievement.color }} />
                  <span className="text-[10px] md:text-xs text-gray-700 dark:text-gray-300">
                    {achievement.nameAr}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Achievements Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 z-50">
          <DialogHeader className="p-4 md:p-6 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              الإنجازات ({earnedCount}/{totalAchievements})
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh]">
            <div className="p-4 md:p-6 space-y-6">
              {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
                const config = categoryLabels[category]
                const Icon = config?.icon || Trophy
                const earnedInCategory = categoryAchievements.filter(a => a.earnedAt).length
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        "p-2 rounded-xl bg-gradient-to-br",
                        config?.color || 'from-gray-400 to-gray-600'
                      )}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{config?.label || category}</h3>
                        <p className="text-xs text-gray-500">{earnedInCategory}/{categoryAchievements.length} محقق</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categoryAchievements.map((achievement) => (
                        <motion.div
                          key={achievement.key}
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all",
                            achievement.earnedAt 
                              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                              : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-2xl",
                              achievement.earnedAt ? "" : "grayscale"
                            )}>
                              {achievement.earnedAt ? (
                                <Trophy className="w-5 h-5" style={{ color: achievement.color }} />
                              ) : (
                                <Lock className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{achievement.nameAr}</h4>
                                {achievement.earnedAt && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{achievement.descriptionAr}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="outline" className="text-[10px]">
                                  +{achievement.xpReward} XP
                                </Badge>
                                {achievement.earnedAt && (
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(achievement.earnedAt).toLocaleDateString('ar-SA')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

// مكون إشعار الإنجاز الجديد
export function AchievementNotification({ 
  achievement, 
  onClose 
}: { 
  achievement: { nameAr: string; color: string; xpReward: number }
  onClose: () => void 
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl shadow-2xl p-4 flex items-center gap-3 text-white"
    >
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
        <Trophy className="w-6 h-6" style={{ color: achievement.color }} />
      </div>
      <div>
        <div className="font-bold">🏆 إنجاز جديد!</div>
        <div className="text-sm">{achievement.nameAr}</div>
        <div className="text-xs opacity-80">+{achievement.xpReward} XP</div>
      </div>
    </motion.div>
  )
}
