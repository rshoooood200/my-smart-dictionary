'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Baby, GraduationCap, BookOpen, Sparkles, Users, Target, ArrowLeft, Check, Rocket, Brain, Trophy, Star, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { KidsLearning } from './kids-learning'
import { AdultsLearning } from './adults-learning'

interface LearningSectionSelectorProps {
  words: Array<{
    id: string
    word: string
    translation: string
    pronunciation?: string
    definition?: string
    level: string
  }>
  userId?: string
}

type AudienceType = 'selector' | 'kids' | 'adults'

export function LearningSectionSelector({ words, userId }: LearningSectionSelectorProps) {
  const [activeSection, setActiveSection] = useState<AudienceType>('selector')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // ميزات كل فئة
  const audiences = [
    {
      id: 'kids',
      title: 'تعليم الأشبال',
      titleEn: 'Cubs Learning',
      subtitle: 'رحلة تعليمية ممتعة',
      description: 'محتوى تعليمي تفاعلي وممتع للأطفال من 5 إلى 14 سنة',
      icon: Rocket,
      emoji: '🦁',
      color: 'from-amber-500 via-orange-500 to-rose-500',
      bgColor: 'from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-rose-950/30',
      borderColor: 'border-amber-300 dark:border-amber-700',
      features: [
        { icon: '🎬', text: 'فيديوهات تعليمية ممتعة' },
        { icon: '🎵', text: 'أغاني وقصص تفاعلية' },
        { icon: '🎮', text: 'ألعاب تعليمية' },
        { icon: '📊', text: 'تتبع التقدم والتقدم' },
        { icon: '🛡️', text: 'محتوى آمن ومُراقب' }
      ],
      stats: {
        label: 'الفئة العمرية',
        value: '5-14',
        suffix: 'سنة'
      },
      level: 'مبتدئ - متوسط'
    },
    {
      id: 'adults',
      title: 'تعليم الكبار',
      titleEn: 'Adults Learning',
      subtitle: 'مهارات احترافية متقدمة',
      description: 'محتوى متقدم للمستوى المتوسط والعالي والاحترافي',
      icon: Brain,
      emoji: '🎓',
      color: 'from-indigo-500 via-purple-500 to-violet-600',
      bgColor: 'from-indigo-50 via-purple-50 to-violet-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-violet-950/30',
      borderColor: 'border-indigo-300 dark:border-indigo-700',
      features: [
        { icon: '💼', text: 'مصطلحات الأعمال' },
        { icon: '🎓', text: 'المصطلحات الأكاديمية' },
        { icon: '💬', text: 'مهارات التواصل' },
        { icon: '✍️', text: 'مهارات الكتابة' },
        { icon: '🎤', text: 'المحادثة المهنية' }
      ],
      stats: {
        label: 'الفئة العمرية',
        value: '15+',
        suffix: 'سنة'
      },
      level: 'متوسط - احترافي'
    }
  ]

  // شاشة الاختيار
  if (activeSection === 'selector') {
    return (
      <div className="space-y-8">
        {/* Hero Header */}
        <motion.div 
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 text-center shadow-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"
              animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
          </div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white font-medium">اختر مسارك التعليمي</span>
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-white mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              قسم التعلم
            </motion.h2>
            
            <motion.p 
              className="text-white/90 max-w-xl mx-auto text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              اختر الفئة المناسبة للبدء في رحلة تعلم اللغة الإنجليزية
            </motion.p>
          </div>
        </motion.div>

        {/* Audience Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              onMouseEnter={() => setHoveredCard(audience.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-500 overflow-hidden group h-full",
                  "border-2 hover:shadow-2xl",
                  audience.borderColor,
                  hoveredCard === audience.id && "scale-[1.02]"
                )}
                onClick={() => setActiveSection(audience.id as AudienceType)}
              >
                {/* Gradient Header */}
                <div className={cn("h-3 bg-gradient-to-r", audience.color)} />
                
                <div className="relative">
                  {/* Background Pattern */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-30 transition-opacity",
                    audience.bgColor,
                    hoveredCard === audience.id && "opacity-50"
                  )} />
                  
                  <CardHeader className="relative pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {/* Icon Container */}
                        <motion.div 
                          className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl",
                            "bg-gradient-to-br",
                            audience.color
                          )}
                          animate={hoveredCard === audience.id ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <audience.icon className="w-8 h-8 text-white" />
                        </motion.div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{audience.emoji}</span>
                            <CardTitle className="text-2xl">{audience.title}</CardTitle>
                          </div>
                          <CardDescription className="text-sm">{audience.titleEn}</CardDescription>
                        </div>
                      </div>
                      
                      {/* Age Badge */}
                      <motion.div
                        animate={hoveredCard === audience.id ? { scale: 1.1 } : { scale: 1 }}
                        className={cn(
                          "flex flex-col items-center px-4 py-2 rounded-xl text-white font-bold shadow-lg",
                          "bg-gradient-to-br",
                          audience.color
                        )}
                      >
                        <span className="text-2xl">{audience.stats.value}</span>
                        <span className="text-xs opacity-90">{audience.stats.suffix}</span>
                      </motion.div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">
                      {audience.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    {/* Level Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className={cn("border-current", 
                        audience.id === 'kids' ? 'text-amber-600' : 'text-indigo-600'
                      )}>
                        <Zap className="w-3 h-3 mr-1" />
                        {audience.level}
                      </Badge>
                    </div>
                    
                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {audience.features.map((feature, i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-center gap-2 text-sm"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                        >
                          <span className="text-base">{feature.icon}</span>
                          <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* CTA Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        className={cn(
                          "w-full h-12 text-lg font-bold shadow-lg transition-all",
                          "bg-gradient-to-r hover:opacity-90",
                          audience.color
                        )}
                      >
                        <Rocket className="w-5 h-5 ml-2" />
                        ابدأ التعلم الآن
                      </Button>
                    </motion.div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-4 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: BookOpen, label: 'كلمة متاحة', value: words.length, color: 'from-blue-500 to-cyan-500' },
            { icon: Target, label: 'مسار تعلم', value: '2', color: 'from-emerald-500 to-teal-500' },
            { icon: Users, label: 'فئة مستهدفة', value: '2', color: 'from-amber-500 to-orange-500' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center"
            >
              <Card className="shadow-lg border-0 overflow-hidden">
                <div className={cn("h-1 bg-gradient-to-r", stat.color)} />
                <CardContent className="p-4">
                  <div className={cn(
                    "w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md",
                    stat.color
                  )}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }

  // عرض المحتوى حسب الفئة المختارة
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button
          variant="outline"
          onClick={() => setActiveSection('selector')}
          className={cn(
            "gap-2 shadow-md hover:shadow-lg transition-all",
            activeSection === 'kids' 
              ? "border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30" 
              : "border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للقائمة الرئيسية
        </Button>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'kids' && (
          <motion.div
            key="kids-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <KidsLearning userId={userId} />
          </motion.div>
        )}
        
        {activeSection === 'adults' && (
          <motion.div
            key="adults-content"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <AdultsLearning words={words} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
