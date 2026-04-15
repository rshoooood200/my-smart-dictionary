'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Star, Crown, Medal, Award, Target, Flame, BookOpen,
  CheckCircle2, Zap, Brain, Calendar, Clock, TrendingUp, Lock,
  Sparkles, Gift, ChevronRight, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// تعريف الإنجازات
interface AchievementDefinition {
  id: string
  name: string
  nameAr: string
  description: string
  icon: string
  color: string
  xp: number
  category: 'words' | 'learning' | 'streak' | 'games' | 'special'
  requirement: number
}

const ACHIEVEMENTS: AchievementDefinition[] = [
  // إنجازات الكلمات
  { id: 'first_word', name: 'First Word', nameAr: 'أول كلمة', description: 'أضفت أول كلمة لك', icon: '📝', color: 'emerald', xp: 5, category: 'words', requirement: 1 },
  { id: 'first_10_words', name: 'Word Collector', nameAr: 'جامع الكلمات', description: 'أضفت 10 كلمات', icon: '📚', color: 'emerald', xp: 15, category: 'words', requirement: 10 },
  { id: 'first_50_words', name: 'Vocabulary Builder', nameAr: 'بناء المفردات', description: 'أضفت 50 كلمة', icon: '📖', color: 'amber', xp: 50, category: 'words', requirement: 50 },
  { id: 'first_100_words', nameAr: 'مئة كلمة', name: 'Century', description: 'أضفت 100 كلمة', icon: '🏆', color: 'amber', xp: 100, category: 'words', requirement: 100 },
  { id: 'first_500_words', nameAr: 'نصف ألف', name: 'Half Thousand', description: 'أضفت 500 كلمة', icon: '👑', color: 'violet', xp: 500, category: 'words', requirement: 500 },
  
  // إنجازات التعلم
  { id: 'learned_5', name: 'Quick Learner', nameAr: 'متعلم سريع', description: 'أتقنت 5 كلمات', icon: '🧠', color: 'violet', xp: 20, category: 'learning', requirement: 5 },
  { id: 'learned_25', name: 'Knowledge Seeker', nameAr: 'باحث المعرفة', description: 'أتقنت 25 كلمة', icon: '🌟', color: 'violet', xp: 75, category: 'learning', requirement: 25 },
  { id: 'learned_50', name: 'Scholar', nameAr: 'عالم', description: 'أتقنت 50 كلمة', icon: '🎓', color: 'violet', xp: 150, category: 'learning', requirement: 50 },
  { id: 'learned_100', name: 'Master', nameAr: 'خبير', description: 'أتقنت 100 كلمة', icon: '💎', color: 'violet', xp: 300, category: 'learning', requirement: 100 },
  
  // إنجازات السلسلة
  { id: 'streak_3', name: 'Getting Started', nameAr: 'البداية', description: 'حافظت على سلسلة 3 أيام', icon: '🔥', color: 'orange', xp: 15, category: 'streak', requirement: 3 },
  { id: 'streak_7', name: 'Week Warrior', nameAr: 'محارب الأسبوع', description: 'حافظت على سلسلة أسبوع كامل', icon: '⚡', color: 'orange', xp: 50, category: 'streak', requirement: 7 },
  { id: 'streak_14', name: 'Two Week Champion', nameAr: 'بطل الأسبوعين', description: 'حافظت على سلسلة أسبوعين', icon: '🏅', color: 'orange', xp: 100, category: 'streak', requirement: 14 },
  { id: 'streak_30', name: 'Month Master', nameAr: 'سيد الشهر', description: 'حافظت على سلسلة شهر كامل', icon: '👑', color: 'orange', xp: 300, category: 'streak', requirement: 30 },
  { id: 'streak_100', name: 'Legend', nameAr: 'أسطورة', description: 'حافظت على سلسلة 100 يوم', icon: '🌟', color: 'orange', xp: 1000, category: 'streak', requirement: 100 },
  
  // إنجازات الألعاب
  { id: 'quiz_master', name: 'Quiz Master', nameAr: 'بطل الاختبارات', description: 'أكمل 10 اختبارات', icon: '🎯', color: 'rose', xp: 50, category: 'games', requirement: 10 },
  { id: 'speed_demon', name: 'Speed Demon', nameAr: 'سريع البرق', description: 'أكمل 10 ألعاب سرعة', icon: '⚡', color: 'cyan', xp: 50, category: 'games', requirement: 10 },
  { id: 'perfect_score', name: 'Perfect Score', nameAr: 'درجة كاملة', description: 'احصل على 100% في أي لعبة', icon: '💯', color: 'amber', xp: 75, category: 'games', requirement: 1 },
  { id: 'game_winner', name: 'Game Winner', nameAr: 'الفائز', description: 'فزت في 50 لعبة', icon: '🏆', color: 'amber', xp: 200, category: 'games', requirement: 50 },
  
  // إنجازات خاصة
  { id: 'night_owl', name: 'Night Owl', nameAr: 'بومة الليل', description: 'درست بعد منتصف الليل', icon: '🦉', color: 'violet', xp: 25, category: 'special', requirement: 1 },
  { id: 'early_bird', name: 'Early Bird', nameAr: 'طائر الصباح', description: 'درست قبل الساعة 6 صباحاً', icon: '🐦', color: 'amber', xp: 25, category: 'special', requirement: 1 },
  { id: 'marathon', name: 'Marathon', nameAr: 'ماراثون', description: 'درست لأكثر من ساعة متواصلة', icon: '🏃', color: 'rose', xp: 100, category: 'special', requirement: 1 },
  { id: 'perfectionist', name: 'Perfectionist', nameAr: 'كمالي', description: 'أتقنت 50 كلمة بدون أخطاء', icon: '✨', color: 'amber', xp: 200, category: 'special', requirement: 50 },
]

// التحديات الأسبوعية
interface WeeklyChallenge {
  id: string
  name: string
  description: string
  target: number
  progress: number
  xp: number
  icon: string
  color: string
}

interface AchievementsSystemProps {
  words: {
    length: number
    filter: (fn: (w: { isLearned?: boolean }) => boolean) => { length: number }
  }
  xp: number
  level: number
  streak: number
  achievements: string[]
  onUnlockAchievement?: (achievementId: string) => void
}

export function AchievementsSystem({ 
  words, 
  xp, 
  level, 
  streak, 
  achievements,
  onUnlockAchievement 
}: AchievementsSystemProps) {
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  
  // حساب الإنجازات المفتوحة والمقفلة
  const { unlocked, locked, progress } = useMemo(() => {
    const unlocked: AchievementDefinition[] = []
    const locked: AchievementDefinition[] = []
    const progress: Record<string, number> = {}
    
    const totalWords = words.length
    const learnedWords = words.filter(w => w.isLearned).length
    
    ACHIEVEMENTS.forEach(achievement => {
      let currentProgress = 0
      
      switch (achievement.category) {
        case 'words':
          currentProgress = totalWords
          break
        case 'learning':
          currentProgress = learnedWords
          break
        case 'streak':
          currentProgress = streak
          break
        default:
          currentProgress = achievements.includes(achievement.id) ? achievement.requirement : 0
      }
      
      progress[achievement.id] = Math.min(100, (currentProgress / achievement.requirement) * 100)
      
      if (achievements.includes(achievement.id)) {
        unlocked.push(achievement)
      } else {
        locked.push(achievement)
      }
    })
    
    return { unlocked, locked, progress }
  }, [words, streak, achievements])
  
  // حساب XP الكلي من الإنجازات
  const totalXpFromAchievements = useMemo(() => {
    return unlocked.reduce((sum, a) => sum + a.xp, 0)
  }, [unlocked])
  
  // إنجازات مقترحة للفتح
  const suggestedAchievements = locked.slice(0, 3)
  
  // التحديات الأسبوعية (محاكاة - في التطبيق الحقيقي ستكون من قاعدة البيانات)
  const weeklyChallenges: WeeklyChallenge[] = [
    { id: 'wc1', name: 'مراجع هذا الأسبوع', description: 'راجع 50 كلمة', target: 50, progress: 32, xp: 100, icon: '🎯', color: 'violet' },
    { id: 'wc2', name: 'السلسلة المتتالية', description: 'حافظ على السلسلة 7 أيام', target: 7, progress: Math.min(streak, 7), xp: 75, icon: '🔥', color: 'orange' },
    { id: 'wc3', name: 'التعلم اليومي', description: 'تعلم 10 كلمات جديدة', target: 10, progress: 6, xp: 50, icon: '📚', color: 'emerald' },
  ]
  
  return (
    <div className="space-y-4">
      {/* ملخص الإنجازات */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unlocked.length}/{ACHIEVEMENTS.length}</p>
                <p className="text-sm text-white/80">إنجاز مفتوح</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-lg font-bold">+{totalXpFromAchievements} XP</p>
              <p className="text-xs text-white/80">من الإنجازات</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* التحديات الأسبوعية */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-violet-500" />
            التحديات الأسبوعية
          </CardTitle>
          <CardDescription>
            تحديث يوم الأحد القادم
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {weeklyChallenges.map((challenge) => (
            <div key={challenge.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{challenge.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{challenge.name}</p>
                    <p className="text-xs text-gray-500">{challenge.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="w-3 h-3" />
                  {challenge.xp} XP
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(challenge.progress / challenge.target) * 100} 
                  className="h-2 flex-1" 
                />
                <span className="text-xs text-gray-500 w-16 text-left">
                  {challenge.progress}/{challenge.target}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* الإنجازات المقترحة */}
      {suggestedAchievements.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-amber-500" />
              الإنجازات التالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedAchievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer"
                onClick={() => setShowDetails(achievement.id)}
              >
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl opacity-50">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{achievement.nameAr}</p>
                  <p className="text-xs text-gray-500">{achievement.description}</p>
                  <Progress value={progress[achievement.id] || 0} className="h-1.5 mt-1" />
                </div>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" />
                  {achievement.xp}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* جميع الإنجازات */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-violet-500" />
              جميع الإنجازات
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAll(!showAll)}
              className="text-violet-600"
            >
              {showAll ? 'عرض أقل' : 'عرض الكل'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-2 transition-all duration-300",
            showAll ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-4 sm:grid-cols-6"
          )}>
            {ACHIEVEMENTS.slice(0, showAll ? undefined : 12).map((achievement) => {
              const isUnlocked = achievements.includes(achievement.id)
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all",
                    isUnlocked 
                      ? `bg-gradient-to-br from-${achievement.color}-100 to-${achievement.color}-200 dark:from-${achievement.color}-900/30 dark:to-${achievement.color}-800/30`
                      : "bg-gray-100 dark:bg-gray-800 opacity-50"
                  )}
                  onClick={() => setShowDetails(achievement.id)}
                >
                  <span className={cn("text-2xl mb-1", !isUnlocked && "grayscale")}>
                    {achievement.icon}
                  </span>
                  <span className="text-[10px] text-center font-medium truncate w-full">
                    {achievement.nameAr}
                  </span>
                  {!isUnlocked && (
                    <Lock className="w-3 h-3 text-gray-400 mt-1" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* حوار تفاصيل الإنجاز */}
      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className="max-w-sm">
          {showDetails && (() => {
            const achievement = ACHIEVEMENTS.find(a => a.id === showDetails)!
            const isUnlocked = achievements.includes(achievement.id)
            const currentProgress = progress[achievement.id] || 0
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-3xl">{achievement.icon}</span>
                    {achievement.nameAr}
                  </DialogTitle>
                  <DialogDescription>{achievement.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className={cn(
                    "p-6 rounded-xl text-center",
                    isUnlocked 
                      ? `bg-gradient-to-br from-${achievement.color}-100 to-${achievement.color}-200`
                      : "bg-gray-100 dark:bg-gray-800"
                  )}>
                    <span className={cn("text-6xl", !isUnlocked && "grayscale opacity-50")}>
                      {achievement.icon}
                    </span>
                    <div className="mt-2">
                      {isUnlocked ? (
                        <Badge className="gap-1 bg-emerald-500">
                          <CheckCircle2 className="w-3 h-3" />
                          مفتوح
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="w-3 h-3" />
                          مقفل
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {!isUnlocked && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">التقدم</span>
                        <span>{Math.round(currentProgress)}%</span>
                      </div>
                      <Progress value={currentProgress} className="h-3" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">مكافأة</span>
                    <Badge className="gap-1 bg-violet-500">
                      <Zap className="w-3 h-3" />
                      {achievement.xp} XP
                    </Badge>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// تصدير تعريفات الإنجازات للاستخدام في أماكن أخرى
export { ACHIEVEMENTS }
export type { AchievementDefinition }
