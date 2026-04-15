'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Route, Plus, Search, Play, Check, Clock, BookOpen, Award,
  ChevronRight, ChevronDown, ChevronLeft, Star, Users, Lock, Globe,
  Target, TrendingUp, Calendar, Zap, ArrowRight, Edit, Trash2,
  X, CheckCircle2, Circle, Loader2, Sparkles, Trophy, Flame,
  BarChart3, Layers, Bookmark, Lightbulb, Timer, Medal,
  Crown, Diamond, Gift, Rocket, Heart, Eye, Settings,
  ArrowLeft, RefreshCw, Download, Share2, Info, Video,
  FileText, Headphones, PenTool, MessageSquare, Volume2,
  VolumeX, Maximize, Minimize, SkipBack, SkipForward,
  Pause, RotateCcw, ThumbsUp, ThumbsDown, HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// أنواع المحتوى
type ContentType = 'video' | 'text' | 'audio' | 'quiz' | 'practice' | 'reading'

interface ContentItem {
  id: string
  type: ContentType
  title: string
  titleAr: string
  duration: number // بالثواني
  content: string
  videoUrl?: string
  audioUrl?: string
  transcription?: string
  notes?: string
}

interface Lesson {
  id: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  order: number
  duration: number
  wordCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  skills?: string[]
  content: ContentItem[]
  vocabulary: {
    word: string
    translation: string
    pronunciation: string
    example: string
    exampleTranslation: string
  }[]
  progress?: {
    id: string
    status: 'not_started' | 'in_progress' | 'completed'
    progress: number
    score: number
    startedAt?: string
    completedAt?: string
  }
}

interface LearningPath {
  id: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  level: string
  category?: string
  icon?: string
  color: string
  isPublic: boolean
  isTemplate: boolean
  estimatedDays: number
  totalLessons: number
  totalWords: number
  lessons: Lesson[]
  progressPercentage?: number
  completedLessons?: number
  inProgressLessons?: number
  prerequisites?: string[]
  skills?: string[]
  certificates?: boolean
  xpReward?: number
}

// إعدادات المستويات
const levelConfig: Record<string, { label: string; color: string; icon: any; description: string; minXP: number }> = {
  beginner: {
    label: 'مبتدئ',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: Seedling,
    description: 'للمتعلمين الجدد',
    minXP: 0
  },
  elementary: {
    label: 'ابتدائي',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    icon: Sprout,
    description: 'أساسيات متينة',
    minXP: 500
  },
  intermediate: {
    label: 'متوسط',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: TreePine,
    description: 'مهارات متوسطة',
    minXP: 1500
  },
  upper_intermediate: {
    label: 'فوق المتوسط',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    icon: TreeDeciduous,
    description: 'مستوى متقدم',
    minXP: 3000
  },
  advanced: {
    label: 'متقدم',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    icon: Crown,
    description: 'إتقان عالي',
    minXP: 5000
  },
  expert: {
    label: 'خبير',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Diamond,
    description: 'مستوى احترافي',
    minXP: 8000
  }
}

// تصنيفات المسارات
const categories = [
  { id: 'general', label: 'عام', icon: Globe, color: 'from-slate-500 to-gray-600' },
  { id: 'business', label: 'الأعمال', icon: Briefcase, color: 'from-blue-500 to-cyan-600' },
  { id: 'academic', label: 'أكاديمي', icon: GraduationCap, color: 'from-purple-500 to-violet-600' },
  { id: 'travel', label: 'السفر', icon: Plane, color: 'from-sky-500 to-blue-600' },
  { id: 'technology', label: 'التقنية', icon: Cpu, color: 'from-emerald-500 to-teal-600' },
  { id: 'medical', label: 'الطب', icon: HeartPulse, color: 'from-rose-500 to-pink-600' },
  { id: 'conversation', label: 'المحادثة', icon: MessageCircle, color: 'from-amber-500 to-orange-600' },
  { id: 'exam', label: 'الاختبارات', icon: FileCheck, color: 'from-indigo-500 to-purple-600' }
]

// نوع المحتوى
const contentTypeConfig: Record<ContentType, { label: string; icon: any; color: string }> = {
  video: { label: 'فيديو', icon: Video, color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30' },
  text: { label: 'نص', icon: FileText, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  audio: { label: 'صوت', icon: Headphones, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  quiz: { label: 'اختبار', icon: HelpCircle, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
  practice: { label: 'تمرين', icon: PenTool, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30' },
  reading: { label: 'قراءة', icon: BookOpen, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' }
}

// مسار 1: أساسيات الإنجليزية
const englishFoundationsLessons: Lesson[] = [
  {
    id: 'ef-1',
    title: 'Greetings and Introductions',
    titleAr: 'التحيات والمقدمات',
    description: 'Learn how to greet people and introduce yourself in English',
    descriptionAr: 'تعلم كيفية تحية الأشخاص وتقديم نفسك بالإنجليزية',
    order: 1,
    duration: 15,
    wordCount: 30,
    difficulty: 'easy',
    skills: ['التحية', 'المقدمة', 'التعارف'],
    content: [
      {
        id: 'ef-1-v1',
        type: 'video',
        title: 'Basic Greetings Video',
        titleAr: 'التحيات الأساسية',
        duration: 300,
        content: 'Hello, Hi, Good morning, Good afternoon, Good evening, Nice to meet you',
        notes: 'اضغط على أي كلمة للاستماع إلى نطقها الصحيح'
      },
      {
        id: 'ef-1-t1',
        type: 'text',
        title: 'Introduction Patterns',
        titleAr: 'أنماط المقدمة',
        duration: 180,
        content: `
## التحيات الأساسية

### تحيات الصباح
- **Good morning** - صباح الخير
- **Good morning! How are you?** - صباح الخير! كيف حالك؟

### تحيات المساء
- **Good afternoon** - مساء الخير (بعد الظهر)
- **Good evening** - مساء الخير (المساء)

### تحيات عامة
- **Hello** - مرحباً
- **Hi** - أهلاً
- **Hey** - هلا (غير رسمية)

## كيفية التعريف بالنفس

### التعريف الرسمي
- **My name is [اسمك]** - اسمي [اسمك]
- **I am [اسمك]** - أنا [اسمك]
- **Nice to meet you** - تشرفت بلقائك

### التعريف غير الرسمي
- **I'm [اسمك]** - أنا [اسمك]
- **Call me [الاسم]** - نادني [الاسم]
        `
      },
      {
        id: 'ef-1-a1',
        type: 'audio',
        title: 'Pronunciation Practice',
        titleAr: 'تمرين النطق',
        duration: 120,
        content: 'استمع وكرر التحيات الأساسية',
        transcription: 'Hello - Hi - Good morning - Good afternoon - Good evening - Nice to meet you'
      },
      {
        id: 'ef-1-q1',
        type: 'quiz',
        title: 'Greetings Quiz',
        titleAr: 'اختبار التحيات',
        duration: 300,
        content: 'اختبر معلوماتك في التحيات والمقدمات'
      }
    ],
    vocabulary: [
      { word: 'Hello', translation: 'مرحباً', pronunciation: '/həˈloʊ/', example: 'Hello, my name is John.', exampleTranslation: 'مرحباً، اسمي جون.' },
      { word: 'Good morning', translation: 'صباح الخير', pronunciation: '/ɡʊd ˈmɔːrnɪŋ/', example: 'Good morning! How are you?', exampleTranslation: 'صباح الخير! كيف حالك؟' },
      { word: 'Nice to meet you', translation: 'تشرفت بلقائك', pronunciation: '/naɪs tuː miːt juː/', example: 'Nice to meet you, Sarah.', exampleTranslation: 'تشرفت بلقائك يا سارة.' },
      { word: 'My name is', translation: 'اسمي', pronunciation: '/maɪ neɪm ɪz/', example: 'My name is Ahmed.', exampleTranslation: 'اسمي أحمد.' },
      { word: 'How are you?', translation: 'كيف حالك؟', pronunciation: '/haʊ ɑːr juː/', example: 'Hello! How are you?', exampleTranslation: 'مرحباً! كيف حالك؟' }
    ]
  },
  {
    id: 'ef-2',
    title: 'Numbers and Counting',
    titleAr: 'الأرقام والعد',
    description: 'Learn numbers from 1 to 100 and how to use them',
    descriptionAr: 'تعلم الأرقام من 1 إلى 100 وكيفية استخدامها',
    order: 2,
    duration: 20,
    wordCount: 35,
    difficulty: 'easy',
    skills: ['الأرقام', 'العد', 'الحساب الأساسي'],
    content: [
      {
        id: 'ef-2-v1',
        type: 'video',
        title: 'Numbers 1-100',
        titleAr: 'الأرقام من 1 إلى 100',
        duration: 420,
        content: 'One, Two, Three, Four, Five, Ten, Twenty, Fifty, One hundred',
        notes: 'اضغط على أي رقم للاستماع إلى نطقه'
      },
      {
        id: 'ef-2-t1',
        type: 'text',
        title: 'Numbers Guide',
        titleAr: 'دليل الأرقام',
        duration: 240,
        content: `
## الأرقام الأساسية (1-20)

| الرقم | الإنجليزية | النطق |
|-------|-----------|-------|
| 1 | One | /wʌn/ |
| 2 | Two | /tuː/ |
| 3 | Three | /θriː/ |
| 4 | Four | /fɔːr/ |
| 5 | Five | /faɪv/ |
| 6 | Six | /sɪks/ |
| 7 | Seven | /ˈsevn/ |
| 8 | Eight | /eɪt/ |
| 9 | Nine | /naɪn/ |
| 10 | Ten | /ten/ |

## العشرات (20-100)

- **20** - Twenty
- **30** - Thirty
- **40** - Forty
- **50** - Fifty
- **60** - Sixty
- **70** - Seventy
- **80** - Eighty
- **90** - Ninety
- **100** - One hundred

## استخدامات الأرقام

### الأعمار
- **I am 25 years old** - عمري 25 سنة

### الأسعار
- **It costs 10 dollars** - يكلف 10 دولارات

### أرقام الهاتف
- **My number is 555-1234** - رقمي هو 555-1234
        `
      },
      {
        id: 'ef-2-p1',
        type: 'practice',
        title: 'Numbers Practice',
        titleAr: 'تمرين الأرقام',
        duration: 300,
        content: 'تدرب على كتابة ونطق الأرقام'
      }
    ],
    vocabulary: [
      { word: 'One', translation: 'واحد', pronunciation: '/wʌn/', example: 'I have one book.', exampleTranslation: 'لدي كتاب واحد.' },
      { word: 'Twenty', translation: 'عشرون', pronunciation: '/ˈtwenti/', example: 'She is twenty years old.', exampleTranslation: 'عمرها عشرون سنة.' },
      { word: 'Hundred', translation: 'مئة', pronunciation: '/ˈhʌndrəd/', example: 'There are a hundred students.', exampleTranslation: 'يوجد مئة طالب.' }
    ]
  },
  {
    id: 'ef-3',
    title: 'Colors and Shapes',
    titleAr: 'الألوان والأشكال',
    description: 'Learn basic colors and geometric shapes',
    descriptionAr: 'تعلم الألوان الأساسية والأشكال الهندسية',
    order: 3,
    duration: 15,
    wordCount: 25,
    difficulty: 'easy',
    skills: ['الألوان', 'الأشكال', 'الوصف'],
    content: [
      {
        id: 'ef-3-v1',
        type: 'video',
        title: 'Colors Video',
        titleAr: 'الألوان الأساسية',
        duration: 240,
        content: 'Red, Blue, Green, Yellow, Orange, Purple, Black, White, Pink, Brown'
      },
      {
        id: 'ef-3-t1',
        type: 'text',
        title: 'Colors and Shapes Guide',
        titleAr: 'دليل الألوان والأشكال',
        duration: 180,
        content: `
## الألوان الأساسية

| اللون | الإنجليزية | مثال |
|-------|-----------|------|
| 🔴 أحمر | Red | A red apple |
| 🔵 أزرق | Blue | The blue sky |
| 🟢 أخضر | Green | Green grass |
| 🟡 أصفر | Yellow | Yellow sun |
| 🟠 برتقالي | Orange | An orange fruit |
| 🟣 بنفسجي | Purple | Purple flowers |
| ⚫ أسود | Black | Black cat |
| ⚪ أبيض | White | White snow |
| 🩷 وردي | Pink | Pink dress |
| 🟤 بني | Brown | Brown dog |

## الأشكال الهندسية

- **Circle** - دائرة ⭕
- **Square** - مربع ⬜
- **Triangle** - مثلث 🔺
- **Rectangle** - مستطيل ▬
- **Oval** - شكل بيضاوي ⬭
        `
      }
    ],
    vocabulary: [
      { word: 'Red', translation: 'أحمر', pronunciation: '/red/', example: 'The apple is red.', exampleTranslation: 'التفاحة حمراء.' },
      { word: 'Blue', translation: 'أزرق', pronunciation: '/bluː/', example: 'The sky is blue.', exampleTranslation: 'السماء زرقاء.' },
      { word: 'Circle', translation: 'دائرة', pronunciation: '/ˈsɜːrkl/', example: 'Draw a circle.', exampleTranslation: 'ارسم دائرة.' }
    ]
  },
  {
    id: 'ef-4',
    title: 'Family Members',
    titleAr: 'أفراد العائلة',
    description: 'Learn vocabulary related to family members',
    descriptionAr: 'تعلم المفردات المتعلقة بأفراد العائلة',
    order: 4,
    duration: 18,
    wordCount: 30,
    difficulty: 'easy',
    skills: ['العائلة', 'العلاقات', 'الوصف'],
    content: [
      {
        id: 'ef-4-v1',
        type: 'video',
        title: 'Family Members Video',
        titleAr: 'أفراد العائلة',
        duration: 300,
        content: 'Mother, Father, Sister, Brother, Grandmother, Grandfather, Uncle, Aunt, Cousin'
      },
      {
        id: 'ef-4-t1',
        type: 'text',
        title: 'Family Vocabulary',
        titleAr: 'مفردات العائلة',
        duration: 200,
        content: `
## أفراد العائلة المباشرين

| العربية | الإنجليزية | النطق |
|---------|-----------|-------|
| أم | Mother / Mom | /ˈmʌðər/ |
| أب | Father / Dad | /ˈfɑːðər/ |
| أخت | Sister | /ˈsɪstər/ |
| أخ | Brother | /ˈbrʌðər/ |
| جد | Grandfather | /ˈɡrænfɑːðər/ |
| جدة | Grandmother | /ˈɡrænmʌðər/ |

## أفراد العائلة الممتدة

- **Uncle** - خال/عم
- **Aunt** - خالة/عمة
- **Cousin** - ابن عم/ابن خال
- **Nephew** - ابن الأخ/ابن الأخت
- **Niece** - بنت الأخ/بنت الأخت

## جمل مفيدة

- **This is my mother** - هذه أمي
- **I have two brothers** - لدي أخوان
- **She is my sister** - هي أختي
        `
      }
    ],
    vocabulary: [
      { word: 'Mother', translation: 'أم', pronunciation: '/ˈmʌðər/', example: 'My mother is a teacher.', exampleTranslation: 'أمي معلمة.' },
      { word: 'Father', translation: 'أب', pronunciation: '/ˈfɑːðər/', example: 'My father works in an office.', exampleTranslation: 'أبي يعمل في مكتب.' },
      { word: 'Sister', translation: 'أخت', pronunciation: '/ˈsɪstər/', example: 'I have one sister.', exampleTranslation: 'لدي أخت واحدة.' }
    ]
  },
  {
    id: 'ef-5',
    title: 'Days and Months',
    titleAr: 'الأيام والشهور',
    description: 'Learn days of the week and months of the year',
    descriptionAr: 'تعلم أيام الأسبوع وشهور السنة',
    order: 5,
    duration: 15,
    wordCount: 25,
    difficulty: 'easy',
    skills: ['الوقت', 'التقويم', 'التاريخ'],
    content: [
      {
        id: 'ef-5-v1',
        type: 'video',
        title: 'Days and Months Video',
        titleAr: 'الأيام والشهور',
        duration: 280,
        content: 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, January, February, March'
      },
      {
        id: 'ef-5-t1',
        type: 'text',
        title: 'Calendar Vocabulary',
        titleAr: 'مفردات التقويم',
        duration: 200,
        content: `
## أيام الأسبوع

| اليوم | الإنجليزية | الاختصار |
|-------|-----------|---------|
| الأحد | Sunday | Sun |
| الاثنين | Monday | Mon |
| الثلاثاء | Tuesday | Tue |
| الأربعاء | Wednesday | Wed |
| الخميس | Thursday | Thu |
| الجمعة | Friday | Fri |
| السبت | Saturday | Sat |

## شهور السنة

| الشهر | الإنجليزية |
|-------|-----------|
| يناير | January |
| فبراير | February |
| مارس | March |
| أبريل | April |
| مايو | May |
| يونيو | June |
| يوليو | July |
| أغسطس | August |
| سبتمبر | September |
| أكتوبر | October |
| نوفمبر | November |
| ديسمبر | December |

## جمل مفيدة

- **Today is Monday** - اليوم الاثنين
- **My birthday is in June** - عيد ميلادي في يونيو
- **See you on Friday** - أراك يوم الجمعة
        `
      }
    ],
    vocabulary: [
      { word: 'Monday', translation: 'الاثنين', pronunciation: '/ˈmʌndeɪ/', example: 'I start work on Monday.', exampleTranslation: 'أبدأ العمل يوم الاثنين.' },
      { word: 'January', translation: 'يناير', pronunciation: '/ˈdʒænjueri/', example: 'New Year is in January.', exampleTranslation: 'رأس السنة في يناير.' }
    ]
  }
]

// مسار 2: المحادثات اليومية
const dailyConversationsLessons: Lesson[] = [
  {
    id: 'dc-1',
    title: 'At the Restaurant',
    titleAr: 'في المطعم',
    description: 'Learn how to order food and interact at restaurants',
    descriptionAr: 'تعلم كيفية طلب الطعام والتفاعل في المطاعم',
    order: 1,
    duration: 20,
    wordCount: 40,
    difficulty: 'easy',
    skills: ['طلب الطعام', 'التعامل مع النادل', 'الدفع'],
    content: [
      {
        id: 'dc-1-v1',
        type: 'video',
        title: 'Restaurant Dialogue',
        titleAr: 'في المطعم',
        duration: 360,
        content: 'May I see the menu?, I would like to order, Could I have the bill?, This is delicious, Can I pay by card?',
        notes: 'عبارات مهمة للمطاعم'
      },
      {
        id: 'dc-1-t1',
        type: 'text',
        title: 'Restaurant Vocabulary',
        titleAr: 'مفردات المطعم',
        duration: 240,
        content: `
## في المطعم - At the Restaurant

### التحية والجلوس
- **Table for two, please** - طاولة لشخصين، من فضلك
- **Can I see the menu?** - هل يمكنني رؤية القائمة؟
- **I have a reservation** - لدي حجز

### طلب الطعام
- **I would like to order** - أود أن أطلب
- **What do you recommend?** - ماذا تنصح؟
- **I'll have the steak** - سآخذ ستيك
- **Could I have some water?** - هل يمكنني الحصول على ماء؟

### خلال الوجبة
- **This is delicious** - هذا لذيذ
- **Could I have some more napkins?** - هل يمكنني الحصول على المزيد من المناديل؟
- **Excuse me, could I have the salt?** - عذراً، هل يمكنني الحصول على الملح؟

### الدفع
- **Could I have the bill, please?** - هل يمكنني الحصول على الفاتورة؟
- **Can I pay by card?** - هل يمكنني الدفع بالبطاقة؟
- **Keep the change** - احتفظ بالباقي
        `
      },
      {
        id: 'dc-1-a1',
        type: 'audio',
        title: 'Restaurant Conversation',
        titleAr: 'محادثة في المطعم',
        duration: 180,
        content: 'استمع لمحادثة كاملة في المطعم',
        transcription: `
Waiter: Good evening! Table for how many?
Customer: Table for two, please.
Waiter: Right this way. Here's your menu.
Customer: Thank you. What do you recommend?
Waiter: Our special today is grilled salmon.
Customer: That sounds good. I'll have that.
        `
      },
      {
        id: 'dc-1-p1',
        type: 'practice',
        title: 'Order Practice',
        titleAr: 'تمرين الطلب',
        duration: 300,
        content: 'تدرب على طلب الطعام'
      }
    ],
    vocabulary: [
      { word: 'Menu', translation: 'قائمة الطعام', pronunciation: '/ˈmenjuː/', example: 'Can I see the menu?', exampleTranslation: 'هل يمكنني رؤية القائمة؟' },
      { word: 'Order', translation: 'طلب', pronunciation: '/ˈɔːrdər/', example: 'I would like to order now.', exampleTranslation: 'أود أن أطلب الآن.' },
      { word: 'Bill', translation: 'الفاتورة', pronunciation: '/bɪl/', example: 'Could I have the bill?', exampleTranslation: 'هل يمكنني الحصول على الفاتورة؟' }
    ]
  },
  {
    id: 'dc-2',
    title: 'At the Shopping Mall',
    titleAr: 'في مركز التسوق',
    description: 'Learn shopping vocabulary and expressions',
    descriptionAr: 'تعلم مفردات التسوق والتعبيرات',
    order: 2,
    duration: 20,
    wordCount: 35,
    difficulty: 'easy',
    skills: ['التسوق', 'المساومة', 'الدفع'],
    content: [
      {
        id: 'dc-2-v1',
        type: 'video',
        title: 'Shopping Dialogue',
        titleAr: 'في المتجر',
        duration: 340,
        content: 'How much is this?, Do you have this in a different size?, Can I try this on?, Is there a discount?, I will take it'
      },
      {
        id: 'dc-2-t1',
        type: 'text',
        title: 'Shopping Vocabulary',
        titleAr: 'مفردات التسوق',
        duration: 200,
        content: `
## في المتجر - At the Store

### الاستفسار عن المنتجات
- **How much is this?** - كم سعر هذا؟
- **Do you have this in a different size?** - هل لديكم هذا بمقاس مختلف؟
- **Do you have this in another color?** - هل لديكم هذا بلون آخر؟
- **Where can I find...?** - أين يمكنني أن أجد...؟

### تجربة الملابس
- **Can I try this on?** - هل يمكنني تجربة هذا؟
- **Where is the fitting room?** - أين غرفة القياس؟
- **It fits perfectly** - يناسبني تماماً
- **It's too small/big** - إنه صغير/كبير جداً

### الدفع والخصومات
- **Is there a discount?** - هل هناك خصم؟
- **Do you accept credit cards?** - هل تقبلون بطاقات الائتمان؟
- **Can I get a receipt?** - هل يمكنني الحصول على إيصال؟
- **I'll take it** - سآخذه
        `
      }
    ],
    vocabulary: [
      { word: 'Price', translation: 'السعر', pronunciation: '/praɪs/', example: 'What is the price of this shirt?', exampleTranslation: 'ما سعر هذا القميص؟' },
      { word: 'Discount', translation: 'خصم', pronunciation: '/ˈdɪskaʊnt/', example: 'Is there any discount?', exampleTranslation: 'هل هناك أي خصم؟' },
      { word: 'Size', translation: 'المقاس', pronunciation: '/saɪz/', example: 'What size is this?', exampleTranslation: 'ما مقاس هذا؟' }
    ]
  },
  {
    id: 'dc-3',
    title: 'At the Airport',
    titleAr: 'في المطار',
    description: 'Learn airport and travel vocabulary',
    descriptionAr: 'تعلم مفردات المطار والسفر',
    order: 3,
    duration: 25,
    wordCount: 45,
    difficulty: 'medium',
    skills: ['السفر', 'المطار', 'إجراءات السفر'],
    content: [
      {
        id: 'dc-3-v1',
        type: 'video',
        title: 'Airport Procedures',
        titleAr: 'في المطار',
        duration: 400,
        content: 'Where is gate 15?, I need to check in, Is this flight on time?, May I see your passport?, Where is baggage claim?',
        notes: 'عبارات السفر والمطار'
      },
      {
        id: 'dc-3-t1',
        type: 'text',
        title: 'Airport Vocabulary',
        titleAr: 'مفردات المطار',
        duration: 250,
        content: `
## في المطار - At the Airport

### إجراءات السفر
- **I need to check in** - أحتاج لتسجيل الدخول
- **Where is gate 15?** - أين البوابة 15؟
- **Is this flight on time?** - هل هذه الرحلة في موعدها؟
- **My flight has been delayed** - تم تأجيل رحلتي

### عند الجوازات
- **May I see your passport?** - هل يمكنني رؤية جواز سفرك؟
- **What is the purpose of your visit?** - ما الغرض من زيارتك؟
- **I'm here for tourism/business** - أنا هنا للسياحة/العمل
- **How long will you stay?** - كم ستبقى؟

### استلام الأمتعة
- **Where is baggage claim?** - أين استلام الأمتعة؟
- **My luggage is missing** - أمتعتي مفقودة
- **I can't find my suitcase** - لا أجد حقيبتي

### على الطائرة
- **Excuse me, where is my seat?** - عذراً، أين مقعدي؟
- **Could I have a blanket?** - هل يمكنني الحصول على بطانية؟
- **What time do we land?** - في أي وقت نحط؟
        `
      }
    ],
    vocabulary: [
      { word: 'Passport', translation: 'جواز سفر', pronunciation: '/ˈpæspɔːrt/', example: 'May I see your passport?', exampleTranslation: 'هل يمكنني رؤية جواز سفرك؟' },
      { word: 'Boarding pass', translation: 'بطاقة الصعود', pronunciation: '/ˈbɔːrdɪŋ pæs/', example: 'Here is your boarding pass.', exampleTranslation: 'إليك بطاقة صعودك.' },
      { word: 'Luggage', translation: 'الأمتعة', pronunciation: '/ˈlʌɡɪdʒ/', example: 'Where is the luggage claim?', exampleTranslation: 'أين استلام الأمتعة؟' }
    ]
  }
]

// مسار 3: التواصل المهني
const businessCommunicationLessons: Lesson[] = [
  {
    id: 'bc-1',
    title: 'Business Introductions',
    titleAr: 'المقدمات المهنية',
    description: 'Learn how to introduce yourself professionally',
    descriptionAr: 'تعلم كيفية تقديم نفسك بشكل احترافي',
    order: 1,
    duration: 25,
    wordCount: 40,
    difficulty: 'medium',
    skills: ['التقديم المهني', 'ال networking', 'بطاقات العمل'],
    content: [
      {
        id: 'bc-1-v1',
        type: 'video',
        title: 'Professional Introductions',
        titleAr: 'المقدمات المهنية',
        duration: 380,
        content: 'Nice to meet you, Let me introduce myself, I work as a manager, Here is my business card, I look forward to working with you',
        notes: 'عبارات مهنية للتعارف'
      },
      {
        id: 'bc-1-t1',
        type: 'text',
        title: 'Business Introduction Guide',
        titleAr: 'دليل المقدمة المهنية',
        duration: 300,
        content: `
## المقدمة المهنية - Professional Introduction

### صيغة التقديم
**"Hello, I'm [Name]. I'm the [Job Title] at [Company]. I specialize in [Area]."**

مرحباً، أنا [الاسم]. أنا [المسمى الوظيفي] في [الشركة]. أتخصص في [المجال].

### مثال عملي
**"Hello, I'm Sarah Johnson. I'm the Marketing Director at Tech Solutions. I specialize in digital marketing strategies and brand development."**

### أسئلة الشائعة
- **What do you do?** - ماذا تعمل؟
- **How long have you been with the company?** - منذ متى وأنت في الشركة؟
- **What brings you here today?** - ما الذي أحضرك هنا اليوم؟

### تبادل بطاقات العمل
- **Here's my card** - هذه بطاقتي
- **May I have your card?** - هل يمكنني الحصول على بطاقتك؟
- **I'll send you an email** - سأرسل لك بريداً إلكترونياً
        `
      },
      {
        id: 'bc-1-p1',
        type: 'practice',
        title: 'Introduction Practice',
        titleAr: 'تمرين المقدمة',
        duration: 400,
        content: 'تدرب على تقديم نفسك بشكل مهني'
      }
    ],
    vocabulary: [
      { word: 'Colleague', translation: 'زميل عمل', pronunciation: '/ˈkɑːliːɡ/', example: 'Let me introduce my colleague.', exampleTranslation: 'دعني أقدم زميلي.' },
      { word: 'Specialize', translation: 'يتخصص', pronunciation: '/ˈspeʃəlaɪz/', example: 'I specialize in finance.', exampleTranslation: 'أتخصص في المالية.' },
      { word: 'Networking', translation: 'بناء العلاقات', pronunciation: '/ˈnetwɜːrkɪŋ/', example: 'Networking is important for career growth.', exampleTranslation: 'بناء العلاقات مهم للنمو المهني.' }
    ]
  },
  {
    id: 'bc-2',
    title: 'Email Writing',
    titleAr: 'كتابة البريد الإلكتروني',
    description: 'Learn professional email writing skills',
    descriptionAr: 'تعلم مهارات كتابة البريد الإلكتروني المهني',
    order: 2,
    duration: 30,
    wordCount: 50,
    difficulty: 'medium',
    skills: ['الكتابة المهنية', 'البريد الإلكتروني', 'التواصل الرسمي'],
    content: [
      {
        id: 'bc-2-v1',
        type: 'video',
        title: 'Email Writing Tips',
        titleAr: 'كتابة البريد المهني',
        duration: 420,
        content: 'Dear Sir or Madam, I am writing to inquire about, Please find attached, Thank you for your time, Best regards',
        notes: 'نصائح لكتابة بريد مهني'
      },
      {
        id: 'bc-2-t1',
        type: 'text',
        title: 'Professional Email Structure',
        titleAr: 'هيكل البريد المهني',
        duration: 350,
        content: `
## كتابة البريد الإلكتروني المهني

### هيكل البريد

**الموضوع (Subject Line)**
- Request for Meeting - طلب اجتماع
- Follow-up on Our Discussion - متابعة نقاشنا
- Project Update - تحديث المشروع

**التحية (Greeting)**
- Dear Mr./Ms. [Name],
- Dear [Name],
- Good morning [Name],

**المقدمة (Opening)**
- I hope this email finds you well.
- I am writing to inquire about...
- Following up on our last meeting...

**المحتوى (Body)**
- I would like to request...
- Please find attached...
- Could you please...

**الختام (Closing)**
- I look forward to hearing from you.
- Thank you for your time.
- Best regards,
- Sincerely,

### مثال كامل

**Subject:** Meeting Request - Project Alpha

**Dear Mr. Johnson,**

I hope this email finds you well.

I am writing to request a meeting to discuss the progress of Project Alpha. We have completed the initial phase and would like to present our findings.

Would you be available next Tuesday or Wednesday afternoon?

I look forward to your response.

**Best regards,**
Sarah Ahmed
Project Manager
        `
      }
    ],
    vocabulary: [
      { word: 'Attach', translation: 'مرفق', pronunciation: '/əˈtætʃ/', example: 'Please find the report attached.', exampleTranslation: 'يرجى إيجاد التقرير مرفقاً.' },
      { word: 'Inquire', translation: 'استفسار', pronunciation: '/ɪnˈkwaɪər/', example: 'I am writing to inquire about the position.', exampleTranslation: 'أكتب للاستفسار عن الوظيفة.' },
      { word: 'Follow up', translation: 'متابعة', pronunciation: '/ˈfɑːloʊ ʌp/', example: 'I will follow up on this matter.', exampleTranslation: 'سأتابع هذا الأمر.' }
    ]
  },
  {
    id: 'bc-3',
    title: 'Meetings and Presentations',
    titleAr: 'الاجتماعات والعروض التقديمية',
    description: 'Learn meeting vocabulary and presentation skills',
    descriptionAr: 'تعلم مفردات الاجتماعات ومهارات العرض',
    order: 3,
    duration: 35,
    wordCount: 55,
    difficulty: 'medium',
    skills: ['الاجتماعات', 'العروض التقديمية', 'النقاش'],
    content: [
      {
        id: 'bc-3-v1',
        type: 'video',
        title: 'Meeting Skills',
        titleAr: 'مهارات الاجتماعات',
        duration: 450,
        content: 'Let us get started, I have a question, I agree with you, Could you elaborate on that?, Let us summarize the main points',
        notes: 'عبارات مهمة للاجتماعات'
      },
      {
        id: 'bc-3-t1',
        type: 'text',
        title: 'Meeting Vocabulary',
        titleAr: 'مفردات الاجتماعات',
        duration: 300,
        content: `
## في الاجتماعات - In Meetings

### بدء الاجتماع
- **Let's get started** - لنبدأ
- **Thank you all for coming** - شكراً لجميعكم على الحضور
- **The purpose of this meeting is...** - الغرض من هذا الاجتماع هو...

### المشاركة
- **I'd like to add something** - أود إضافة شيء
- **Could you elaborate on that?** - هل يمكنك التوسع في ذلك؟
- **I agree with you** - أوافقك الرأي
- **I have a different opinion** - لدي رأي مختلف

### التلخيص والختام
- **To summarize** - للتلخيص
- **Let's wrap up** - لنختتم
- **The next steps are...** - الخطوات التالية هي...
- **We'll follow up on this** - سنتابع هذا

## العروض التقديمية - Presentations

### مقدمة العرض
- **Good morning everyone** - صباح الخير للجميع
- **Today I'm going to talk about...** - اليوم سأتحدث عن...
- **My presentation is divided into three parts** - عرضي مقسم إلى ثلاثة أجزاء

### خلال العرض
- **As you can see on this slide** - كما ترون في هذه الشريحة
- **Let me explain this in more detail** - دعني أشرح هذا بمزيد من التفاصيل
- **This brings us to the next point** - هذا يقودنا إلى النقطة التالية

### الختام
- **In conclusion** - في الختام
- **Thank you for your attention** - شكراً على انتباهكم
- **Are there any questions?** - هل هناك أي أسئلة؟
        `
      }
    ],
    vocabulary: [
      { word: 'Agenda', translation: 'جدول الأعمال', pronunciation: '/əˈdʒendə/', example: 'Let\'s review the agenda.', exampleTranslation: 'لنراجع جدول الأعمال.' },
      { word: 'Deadline', translation: 'موعد نهائي', pronunciation: '/ˈdedlaɪn/', example: 'The deadline is next Friday.', exampleTranslation: 'الموعد النهائي هو الجمعة القادمة.' },
      { word: 'Feedback', translation: 'ملاحظات', pronunciation: '/ˈfiːdbæk/', example: 'I appreciate your feedback.', exampleTranslation: 'أقدر ملاحظاتك.' }
    ]
  }
]

// مسار 4: التقنية والحاسوب
const technologyLessons: Lesson[] = [
  {
    id: 'tech-1',
    title: 'Computer Basics',
    titleAr: 'أساسيات الحاسوب',
    description: 'Learn essential computer vocabulary',
    descriptionAr: 'تعلم مفردات الحاسوب الأساسية',
    order: 1,
    duration: 25,
    wordCount: 45,
    difficulty: 'medium',
    skills: ['الأجهزة', 'البرمجيات', 'التشغيل'],
    content: [
      {
        id: 'tech-1-v1',
        type: 'video',
        title: 'Computer Hardware',
        titleAr: 'عتاد الحاسوب',
        duration: 380,
        content: 'Keyboard, Mouse, Monitor, CPU, Hard drive, RAM, Graphics card, USB port, Power supply, Motherboard',
        notes: 'مكونات الحاسوب الأساسية'
      },
      {
        id: 'tech-1-t1',
        type: 'text',
        title: 'Computer Vocabulary',
        titleAr: 'مفردات الحاسوب',
        duration: 280,
        content: `
## العتاد (Hardware)

| الإنجليزية | العربية | الوصف |
|-----------|---------|-------|
| Keyboard | لوحة المفاتيح | للكتابة |
| Mouse | الفأرة | للنقر والتحريك |
| Monitor | الشاشة | لعرض المعلومات |
| CPU | المعالج | عقل الحاسوب |
| RAM | الذاكرة العشوائية | للتخزين المؤقت |
| Hard Drive | القرص الصلب | للتخزين الدائم |

## البرمجيات (Software)

- **Operating System** - نظام التشغيل (Windows, macOS, Linux)
- **Application** - تطبيق
- **Browser** - متصفح
- **File** - ملف
- **Folder** - مجلد

## الإجراءات (Actions)

- **Click** - انقر
- **Double-click** - انقر مرتين
- **Right-click** - انقر بالزر الأيمن
- **Drag and drop** - اسحب وأفلت
- **Copy and paste** - انسخ والصق
- **Save** - احفظ
- **Delete** - احذف
        `
      }
    ],
    vocabulary: [
      { word: 'Hardware', translation: 'العتاد/الأجهزة', pronunciation: '/ˈhɑːrdwer/', example: 'This computer has good hardware.', exampleTranslation: 'هذا الحاسوب لديه عتاد جيد.' },
      { word: 'Software', translation: 'البرمجيات', pronunciation: '/ˈsɔːftwer/', example: 'You need to update the software.', exampleTranslation: 'تحتاج لتحديث البرمجيات.' },
      { word: 'Download', translation: 'تحميل', pronunciation: '/ˈdaʊnloʊd/', example: 'Please download the file.', exampleTranslation: 'يرجى تحميل الملف.' }
    ]
  },
  {
    id: 'tech-2',
    title: 'Internet and Networking',
    titleAr: 'الإنترنت والشبكات',
    description: 'Learn internet and networking terminology',
    descriptionAr: 'تعلم مصطلحات الإنترنت والشبكات',
    order: 2,
    duration: 30,
    wordCount: 50,
    difficulty: 'medium',
    skills: ['الشبكات', 'الإنترنت', 'الأمان'],
    content: [
      {
        id: 'tech-2-v1',
        type: 'video',
        title: 'Internet Basics',
        titleAr: 'أساسيات الإنترنت',
        duration: 400,
        content: 'Website, Browser, Search engine, Download, Upload, Wi-Fi, Password, Username, Login, Logout',
        notes: 'مصطلحات الإنترنت الأساسية'
      },
      {
        id: 'tech-2-t1',
        type: 'text',
        title: 'Internet Vocabulary',
        titleAr: 'مفردات الإنترنت',
        duration: 300,
        content: `
## مصطلحات الإنترنت

### الاتصال
- **Wi-Fi** - وايرلس / شبكة لاسلكية
- **Router** - جهاز التوجيه
- **Connection** - اتصال
- **Bandwidth** - عرض النطاق
- **Speed** - السرعة

### التصفح
- **Website** - موقع إلكتروني
- **Webpage** - صفحة ويب
- **URL** - عنوان الموقع
- **Link** - رابط
- **Search engine** - محرك بحث

### الأمان
- **Password** - كلمة المرور
- **Username** - اسم المستخدم
- **Login/Sign in** - تسجيل الدخول
- **Logout/Sign out** - تسجيل الخروج
- **Firewall** - جدار الحماية
- **Virus** - فيروس
- **Antivirus** - برنامج مكافحة الفيروسات

### البريد الإلكتروني
- **Email address** - عنوان البريد الإلكتروني
- **Inbox** - صندوق الوارد
- **Sent** - المرسلة
- **Spam** - البريد العشوائي
- **Attachment** - مرفق
        `
      }
    ],
    vocabulary: [
      { word: 'Network', translation: 'شبكة', pronunciation: '/ˈnetwɜːrk/', example: 'The network is down.', exampleTranslation: 'الشبكة معطلة.' },
      { word: 'Server', translation: 'خادم', pronunciation: '/ˈsɜːrvər/', example: 'The server is not responding.', exampleTranslation: 'الخادم لا يستجيب.' },
      { word: 'Security', translation: 'الأمان', pronunciation: '/sɪˈkjʊrəti/', example: 'We need to improve security.', exampleTranslation: 'نحتاج لتحسين الأمان.' }
    ]
  }
]

// مسار 5: السفر والسياحة
const travelLessons: Lesson[] = [
  {
    id: 'tr-1',
    title: 'Hotel Reservations',
    titleAr: 'حجز الفنادق',
    description: 'Learn how to book and check into hotels',
    descriptionAr: 'تعلم كيفية حجز والتسجيل في الفنادق',
    order: 1,
    duration: 20,
    wordCount: 35,
    difficulty: 'easy',
    skills: ['حجز الفنادق', 'الإقامة', 'الخدمات'],
    content: [
      {
        id: 'tr-1-v1',
        type: 'video',
        title: 'Hotel Check-in',
        titleAr: 'التسجيل في الفندق',
        duration: 350,
        content: 'I have a reservation, Can I see your ID?, Here is your key, What time is breakfast?, Is there Wi-Fi?',
        notes: 'عبارات التسجيل في الفندق'
      },
      {
        id: 'tr-1-t1',
        type: 'text',
        title: 'Hotel Vocabulary',
        titleAr: 'مفردات الفندق',
        duration: 250,
        content: `
## في الفندق - At the Hotel

### الحجز
- **I have a reservation** - لدي حجز
- **I'd like to book a room** - أود حجز غرفة
- **For how many nights?** - لكم ليلة؟
- **What's the rate per night?** - ما سعر الليلة؟

### أنواع الغرف
- **Single room** - غرفة مفردة
- **Double room** - غرفة مزدوجة
- **Suite** - جناح
- **Sea view** - إطلالة بحرية

### التسجيل
- **Check-in** - تسجيل الدخول
- **Check-out** - تسجيل الخروج
- **Room key** - مفتاح الغرفة
- **ID/Passport** - الهوية/جواز السفر

### الخدمات
- **Room service** - خدمة الغرف
- **Housekeeping** - التنظيف
- **Breakfast included** - الفطور مشمول
- **Wi-Fi password** - كلمة مرور الواي فاي

### الطلبات
- **Could I have extra towels?** - هل يمكنني الحصول على مناشف إضافية؟
- **The AC isn't working** - المكيف لا يعمل
- **What time is breakfast?** - في أي وقت الفطور؟
        `
      }
    ],
    vocabulary: [
      { word: 'Reservation', translation: 'حجز', pronunciation: '/ˌrezərˈveɪʃn/', example: 'I have a reservation for tonight.', exampleTranslation: 'لدي حجز لهذه الليلة.' },
      { word: 'Reception', translation: 'الاستقبال', pronunciation: '/rɪˈsepʃn/', example: 'Please contact reception.', exampleTranslation: 'يرجى التواصل مع الاستقبال.' },
      { word: 'Amenities', translation: 'المرافق', pronunciation: '/əˈmenɪtiz/', example: 'What amenities does the hotel have?', exampleTranslation: 'ما المرافق المتوفرة في الفندق؟' }
    ]
  },
  {
    id: 'tr-2',
    title: 'Asking for Directions',
    titleAr: 'طلب الاتجاهات',
    description: 'Learn how to ask for and give directions',
    descriptionAr: 'تعلم كيفية طلب وإعطاء الاتجاهات',
    order: 2,
    duration: 18,
    wordCount: 30,
    difficulty: 'easy',
    skills: ['الاتجاهات', 'المواصلات', 'الملاحة'],
    content: [
      {
        id: 'tr-2-v1',
        type: 'video',
        title: 'Directions',
        titleAr: 'الاتجاهات',
        duration: 300,
        content: 'Turn left, Turn right, Go straight, At the corner, Next to, Across from, How far is it?, Can you show me on the map?',
        notes: 'عبارات طلب الاتجاهات'
      },
      {
        id: 'tr-2-t1',
        type: 'text',
        title: 'Directions Vocabulary',
        titleAr: 'مفردات الاتجاهات',
        duration: 200,
        content: `
## طلب الاتجاهات - Asking for Directions

### السؤال عن الموقع
- **Excuse me, where is...?** - عذراً، أين...؟
- **How do I get to...?** - كيف أصل إلى...؟
- **Is it far from here?** - هل هو بعيد من هنا؟
- **Can you show me on the map?** - هل يمكنك إرشادي على الخريطة؟

### الاتجاهات
- **Turn left** - انعطف يساراً
- **Turn right** - انعطف يميناً
- **Go straight** - امضِ قدماً
- **Go back** - ارجع للخلف
- **At the corner** - عند الزاوية
- **Next to** - بجانب
- **Across from** - مقابل
- **Between** - بين

### المعالم
- **Traffic light** - إشارة مرور
- **Roundabout** - دوار
- **Intersection** - تقاطع
- **Bridge** - جسر
- **Subway station** - محطة المترو
- **Bus stop** - محطة الحافلة

### مثال
**"Go straight for two blocks, turn left at the traffic light, and it's on your right."**
امضِ قدماً لقطعتين، انعطف يساراً عند الإشارة، وستجده على يمينك.
        `
      }
    ],
    vocabulary: [
      { word: 'Straight', translation: 'مستقيم', pronunciation: '/streɪt/', example: 'Go straight ahead.', exampleTranslation: 'امضِ قدماً.' },
      { word: 'Corner', translation: 'زاوية', pronunciation: '/ˈkɔːrnər/', example: 'Turn at the corner.', exampleTranslation: 'انعطف عند الزاوية.' },
      { word: 'Nearby', translation: 'قريب', pronunciation: '/ˈnɪrbaɪ/', example: 'Is there a restaurant nearby?', exampleTranslation: 'هل هناك مطعم قريب؟' }
    ]
  }
]

// مسار 6: التميز الأكاديمي
const academicLessons: Lesson[] = [
  {
    id: 'ac-1',
    title: 'Academic Writing',
    titleAr: 'الكتابة الأكاديمية',
    description: 'Learn academic writing skills and vocabulary',
    descriptionAr: 'تعلم مهارات ومفردات الكتابة الأكاديمية',
    order: 1,
    duration: 40,
    wordCount: 60,
    difficulty: 'hard',
    skills: ['الكتابة الأكاديمية', 'التنظيم', 'المراجع'],
    content: [
      {
        id: 'ac-1-v1',
        type: 'video',
        title: 'Academic Writing Structure',
        titleAr: 'هيكل الكتابة الأكاديمية',
        duration: 500,
        content: 'Introduction, Literature review, Methodology, Results, Discussion, Conclusion, References, Abstract',
        notes: 'أجزاء البحث الأكاديمي'
      },
      {
        id: 'ac-1-t1',
        type: 'text',
        title: 'Academic Writing Guide',
        titleAr: 'دليل الكتابة الأكاديمية',
        duration: 400,
        content: `
## الكتابة الأكاديمية - Academic Writing

### هيكل المقال الأكاديمي

**1. المقدمة (Introduction)**
- **Thesis statement** - جملة الأطروحة
- **Background information** - معلومات خلفية
- **Purpose of the study** - غرض الدراسة

**2. الجسم (Body)**
- **Literature review** - مراجعة الأدبيات
- **Methodology** - المنهجية
- **Results** - النتائج
- **Discussion** - المناقشة

**3. الخاتمة (Conclusion)**
- **Summary** - ملخص
- **Implications** - التوصيات
- **Future research** - الأبحاث المستقبلية

### عبارات الربط
- **Furthermore** - علاوة على ذلك
- **In addition** - بالإضافة إلى
- **Moreover** - علاوة على ذلك
- **However** - ومع ذلك
- **Therefore** - لذلك
- **Consequently** - نتيجة لذلك
- **In conclusion** - في الختام

### المراجع
- **Citation** - استشهاد
- **Reference** - مرجع
- **Bibliography** - قائمة المراجع
- **Plagiarism** - السرقة الأدبية
        `
      }
    ],
    vocabulary: [
      { word: 'Hypothesis', translation: 'فرضية', pronunciation: '/haɪˈpɒθəsɪs/', example: 'The hypothesis was tested.', exampleTranslation: 'تم اختبار الفرضية.' },
      { word: 'Evidence', translation: 'دليل', pronunciation: '/ˈevɪdəns/', example: 'There is strong evidence to support this.', exampleTranslation: 'هناك دليل قوي لدعم هذا.' },
      { word: 'Analysis', translation: 'تحليل', pronunciation: '/əˈnæləsɪs/', example: 'The data analysis revealed...', exampleTranslation: 'كشف تحليل البيانات...' }
    ]
  }
]

// مسار 7: IELTS
const ieltsLessons: Lesson[] = [
  {
    id: 'ielts-1',
    title: 'IELTS Reading Section',
    titleAr: 'قسم القراءة في IELTS',
    description: 'Master the IELTS Reading section',
    descriptionAr: 'أتقن قسم القراءة في اختبار IELTS',
    order: 1,
    duration: 45,
    wordCount: 70,
    difficulty: 'hard',
    skills: ['القراءة', 'الفهم', 'التحليل'],
    content: [
      {
        id: 'ielts-1-v1',
        type: 'video',
        title: 'IELTS Reading Strategies',
        titleAr: 'استراتيجيات القراءة',
        duration: 600,
        content: 'Skimming, Scanning, True or False, Multiple choice, Fill in the blanks, Matching headings, Summary completion',
        notes: 'استراتيجيات اختبار القراءة'
      },
      {
        id: 'ielts-1-t1',
        type: 'text',
        title: 'Reading Question Types',
        titleAr: 'أنواع أسئلة القراءة',
        duration: 400,
        content: `
## أنواع أسئلة القراءة - Reading Question Types

### 1. Multiple Choice
اختيار من متعدد - اختر الإجابة الصحيحة من الخيارات

### 2. True/False/Not Given
صح/خطأ/غير مذكور
- **True** - المعلومة صحيحة حسب النص
- **False** - المعلومة خاطئة حسب النص
- **Not Given** - المعلومة غير مذكورة

### 3. Matching Information
مطابقة المعلومات - ربط الفقرات بالمعلومات

### 4. Fill in the Blanks
ملء الفراغات - إكمال النص بكلمات من النص

### 5. Summary Completion
إكمال الملخص

### استراتيجيات النجاح
1. **Skimming** - القراءة السريعة للفكرة العامة
2. **Scanning** - البحث عن معلومات محددة
3. **Time management** - إدارة الوقت (20 دقيقة لكل قطعة)

### نصائح مهمة
- اقرأ الأسئلة أولاً
- لا تقضِ وقتاً طويلاً على سؤال صعب
- انتبه للمرادفات والألفاظ المتشابهة
        `
      }
    ],
    vocabulary: [
      { word: 'Inference', translation: 'استنتاج', pronunciation: '/ˈɪnfərəns/', example: 'Make an inference from the text.', exampleTranslation: 'استنتج من النص.' },
      { word: 'Paraphrase', translation: 'إعادة صياغة', pronunciation: '/ˈpærəfreɪz/', example: 'Paraphrase the main idea.', exampleTranslation: 'أعد صياغة الفكرة الرئيسية.' }
    ]
  }
]

// مسار 8: الإنجليزية الطبية
const medicalLessons: Lesson[] = [
  {
    id: 'med-1',
    title: 'Medical Terminology',
    titleAr: 'المصطلحات الطبية',
    description: 'Learn essential medical vocabulary',
    descriptionAr: 'تعلم المفردات الطبية الأساسية',
    order: 1,
    duration: 35,
    wordCount: 55,
    difficulty: 'hard',
    skills: ['المصطلحات الطبية', 'التشخيص', 'العلاج'],
    content: [
      {
        id: 'med-1-v1',
        type: 'video',
        title: 'Medical Prefixes and Suffixes',
        titleAr: 'السوابق واللواحق الطبية',
        duration: 480,
        content: 'Diagnosis, Prescription, Symptoms, Treatment, Patient, Surgery, Medication, Recovery, Prognosis, Therapy',
        notes: 'المصطلحات الطبية الأساسية'
      },
      {
        id: 'med-1-t1',
        type: 'text',
        title: 'Medical Vocabulary',
        titleAr: 'المفردات الطبية',
        duration: 350,
        content: `
## المصطلحات الطبية - Medical Terminology

### البادئات الشائعة
| البادئة | المعنى | مثال |
|---------|--------|------|
| Hyper- | زائد | Hypertension |
| Hypo- | ناقص | Hypoglycemia |
| Pre- | قبل | Prenatal |
| Post- | بعد | Postoperative |
| Anti- | مضاد | Antibiotic |

### اللواحق الشائعة
| اللاحقة | المعنى | مثال |
|---------|--------|------|
| -itis | التهاب | Arthritis |
| -ology | علم | Cardiology |
| -ectomy | استئصال | Appendectomy |
| -scopy | فحص | Endoscopy |

### أجزاء الجسم
- **Cardiovascular** - القلب والأوعية الدموية
- **Respiratory** - الجهاز التنفسي
- **Nervous** - الجهاز العصبي
- **Digestive** - الجهاز الهضمي
- **Musculoskeletal** - العضلات والهيكل العظمي

### في العيادة
- **Symptoms** - الأعراض
- **Diagnosis** - التشخيص
- **Treatment** - العلاج
- **Prescription** - الوصفة الطبية
- **Follow-up** - المتابعة
        `
      }
    ],
    vocabulary: [
      { word: 'Diagnosis', translation: 'تشخيص', pronunciation: '/ˌdaɪəɡˈnoʊsɪs/', example: 'The diagnosis was confirmed.', exampleTranslation: 'تم تأكيد التشخيص.' },
      { word: 'Prescription', translation: 'وصفة طبية', pronunciation: '/prɪˈskrɪpʃn/', example: 'Here is your prescription.', exampleTranslation: 'إليك وصفتك الطبية.' },
      { word: 'Symptom', translation: 'عرض', pronunciation: '/ˈsɪmptəm/', example: 'What are your symptoms?', exampleTranslation: 'ما أعراضك؟' }
    ]
  }
]

// المسارات الافتراضية مع الدروس
const defaultPaths: Omit<LearningPath, 'id'>[] = [
  {
    title: 'English Foundations',
    titleAr: 'أساسيات الإنجليزية',
    description: 'Master the essential English vocabulary for everyday communication',
    descriptionAr: 'أتقن المفردات الإنجليزية الأساسية للتواصل اليومي',
    level: 'beginner',
    category: 'general',
    icon: '🌱',
    color: '#10B981',
    isPublic: true,
    isTemplate: true,
    estimatedDays: 30,
    totalLessons: englishFoundationsLessons.length,
    totalWords: englishFoundationsLessons.reduce((sum, l) => sum + l.wordCount, 0),
    lessons: englishFoundationsLessons,
    skills: ['التحدث الأساسي', 'الفهم السمعي', 'القراءة الأولية'],
    certificates: true,
    xpReward: 500
  },
  {
    title: 'Daily Conversations',
    titleAr: 'المحادثات اليومية',
    description: 'Learn practical phrases and expressions for daily situations',
    descriptionAr: 'تعلم العبارات والتعبيرات العملية للمواقف اليومية',
    level: 'elementary',
    category: 'conversation',
    icon: '💬',
    color: '#F59E0B',
    isPublic: true,
    isTemplate: true,
    estimatedDays: 25,
    totalLessons: dailyConversationsLessons.length,
    totalWords: dailyConversationsLessons.reduce((sum, l) => sum + l.wordCount, 0),
    lessons: dailyConversationsLessons,
    skills: ['المحادثة', 'التعبير عن النفس', 'طرح الأسئلة'],
    certificates: true,
    xpReward: 400
  },
  {
    title: 'Business Communication',
    titleAr: 'التواصل المهني',
    description: 'Professional vocabulary for the workplace and business meetings',
    descriptionAr: 'مفردات مهنية لبيئة العمل والاجتماعات التجارية',
    level: 'intermediate',
    category: 'business',
    icon: '💼',
    color: '#3B82F6',
    isPublic: true,
    isTemplate: true,
    estimatedDays: 45,
    totalLessons: businessCommunicationLessons.length,
    totalWords: businessCommunicationLessons.reduce((sum, l) => sum + l.wordCount, 0),
    lessons: businessCommunicationLessons,
    skills: ['المراسلات التجارية', 'العروض التقديمية', 'التفاوض'],
    certificates: true,
    xpReward: 750
  },
  {
    title: 'Technology & IT',
    titleAr: 'التقنية والحاسوب',
    description: 'Essential tech vocabulary for the digital age',
    descriptionAr: 'مفردات تقنية أساسية للعصر الرقمي',
    level: 'intermediate',
    category: 'technology',
    icon: '💻',
    color: '#8B5CF6',
    isPublic: true,
    isTemplate: true,
    estimatedDays: 40,
    totalLessons: technologyLessons.length,
    totalWords: technologyLessons.reduce((sum, l) => sum + l.wordCount, 0),
    lessons: technologyLessons,
    skills: ['البرمجة الأساسية', 'المصطلحات التقنية', 'التوثيق'],
    certificates: true,
    xpReward: 650
  },
  {
    title: 'Travel & Tourism',
    titleAr: 'السفر والسياحة',
    description: 'Navigate the world with essential travel vocabulary',
    descriptionAr: 'تجول العالم بمفردات السفر الأساسية',
    level: 'elementary',
    category: 'travel',
    icon: '✈️',
    color: '#06B6D4',
    isPublic: true,
    isTemplate: true,
    estimatedDays: 20,
    totalLessons: travelLessons.length,
    totalWords: travelLessons.reduce((sum, l) => sum + l.wordCount, 0),
    lessons: travelLessons,
    skills: ['الحجز', 'التنقل', 'الإقامة'],
    certificates: false,
    xpReward: 300
  },
  {
    title: 'Academic Excellence',
    titleAr: 'التميز الأكاديمي',
    description: 'Advanced vocabulary for academic writing and research',
    descriptionAr: 'مفردات متقدمة للكتابة الأكاديمية والبحث العلمي',
    level: 'advanced',
    category: 'academic',
    icon: '🎓',
    color: '#EC4899',
    isPublic: true,
    isTemplate: true,
    estimatedDays: 60,
    totalLessons: academicLessons.length,
    totalWords: academicLessons.reduce((sum, l) => sum + l.wordCount, 0),
    lessons: academicLessons,
    skills: ['الكتابة الأكاديمية', 'البحث العلمي', 'النقد والتحليل'],
    certificates: true,
    xpReward: 1000
  },
  {
    title: 'IELTS Preparation',
    titleAr: 'التحضير لـ IELTS',
    description: 'Comprehensive vocabulary for IELTS exam success',
    descriptionAr: 'مفردات شاملة للنجاح في اختبار IELTS',
    level: 'upper_intermediate',
    category: 'exam',
    icon: '📝',
    color: '#F97316',
    isPublic: true,
    isTemplate: true,
    estimatedDays: 50,
    totalLessons: ieltsLessons.length,
    totalWords: ieltsLessons.reduce((sum, l) => sum + l.wordCount, 0),
    lessons: ieltsLessons,
    skills: ['الاستماع', 'القراءة', 'الكتابة', 'المحادثة'],
    certificates: true,
    xpReward: 900
  },
  {
    title: 'Medical English',
    titleAr: 'الإنجليزية الطبية',
    description: 'Essential medical terminology for healthcare professionals',
    descriptionAr: 'المصطلحات الطبية الأساسية لمهنيي الرعاية الصحية',
    level: 'advanced',
    category: 'medical',
    icon: '🏥',
    color: '#EF4444',
    isPublic: true,
    isTemplate: true,
    estimatedDays: 55,
    totalLessons: medicalLessons.length,
    totalWords: medicalLessons.reduce((sum, l) => sum + l.wordCount, 0),
    lessons: medicalLessons,
    skills: ['التشخيص', 'العلاج', 'التواصل مع المرضى'],
    certificates: true,
    xpReward: 850
  }
]

// مكونات أيقونات إضافية
function Seedling({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22V8" />
      <path d="M5 12H2a10 10 0 0 0 10 10v-3a7 7 0 0 1-7-7z" />
      <path d="M19 12h3a10 10 0 0 1-10 10v-3a7 7 0 0 0 7-7z" />
    </svg>
  )
}

function Sprout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 20h10" />
      <path d="M12 20v-8" />
      <path d="M12 12c-2-2-6-2-6 2 4 0 6-2 6-2z" />
      <path d="M12 12c2-2 6-2 6 2-4 0-6-2-6-2z" />
    </svg>
  )
}

function TreePine({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m17 14 3 3.5a1 1 0 0 1-.8 1.5H4.8a1 1 0 0 1-.8-1.5L7 14" />
      <path d="m12 6 3 3.5a1 1 0 0 1-.8 1.5H9.8a1 1 0 0 1-.8-1.5L12 6z" />
      <path d="M12 2 14.5 5a1 1 0 0 1-.7 1.5H10.2a1 1 0 0 1-.7-1.5L12 2z" />
      <path d="M12 22v-4" />
    </svg>
  )
}

function TreeDeciduous({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 19h8" />
      <path d="M12 19v3" />
      <path d="M12 3c-4 4-4 8 0 12" />
      <path d="M12 3c4 4 4 8 0 12" />
      <path d="M6 11c0-4 2.5-6 6-6" />
      <path d="M18 11c0-4-2.5-6-6-6" />
    </svg>
  )
}

function Briefcase({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}

function GraduationCap({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
}

function Plane({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
}

function Cpu({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg>
}

function HeartPulse({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>
}

function MessageCircle({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
}

function FileCheck({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
}

function Fire({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
}

function Library({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
}

export function LearningPaths() {
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed' | 'recommended'>('all')
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null)
  const [isPathDialogOpen, setIsPathDialogOpen] = useState(false)
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [userXP, setUserXP] = useState(0)
  const [userBadges, setUserBadges] = useState<string[]>([])
  const [dailyStreak, setDailyStreak] = useState(0)
  const [currentContentIndex, setCurrentContentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showVocabulary, setShowVocabulary] = useState(false)

  // Get current user ID from localStorage
  useEffect(() => {
    const storeData = localStorage.getItem('vocab-store')
    if (storeData) {
      try {
        const parsed = JSON.parse(storeData)
        setCurrentUserId(parsed.state?.currentUserId)
        setUserXP(parsed.state?.userXP || 0)
        setUserBadges(parsed.state?.badges || [])
        setDailyStreak(parsed.state?.dailyStreak || 0)
      } catch {
        // Ignore
      }
    }
  }, [])

  // Fetch paths
  const fetchPaths = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = '/api/learning-paths'
      if (currentUserId) {
        url += `?userId=${currentUserId}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setPaths(data.paths.length > 0 ? data.paths : defaultPaths.map((p, i) => ({ ...p, id: `default-${i}` })))
      } else {
        setPaths(defaultPaths.map((p, i) => ({ ...p, id: `default-${i}` })))
      }
    } catch {
      setPaths(defaultPaths.map((p, i) => ({ ...p, id: `default-${i}` })))
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchPaths()
  }, [fetchPaths])

  // حساب المسارات الموصى بها
  const recommendedPaths = useMemo(() => {
    return paths
      .filter(p => (p.progressPercentage ?? 0) === 0)
      .sort((a, b) => {
        const levelOrder = ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'expert']
        const userLevelIndex = Math.floor(userXP / 1500)
        const aLevelIndex = levelOrder.indexOf(a.level)
        const bLevelIndex = levelOrder.indexOf(b.level)
        return Math.abs(aLevelIndex - userLevelIndex) - Math.abs(bLevelIndex - userLevelIndex)
      })
      .slice(0, 3)
  }, [paths, userXP])

  // Filter paths
  const filteredPaths = paths.filter(path => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!path.title.toLowerCase().includes(query) &&
          !path.titleAr?.toLowerCase().includes(query) &&
          !path.description?.toLowerCase().includes(query)) {
        return false
      }
    }

    if (selectedCategory && path.category !== selectedCategory) {
      return false
    }

    if (activeTab === 'in-progress') {
      return (path.progressPercentage ?? 0) > 0 && (path.progressPercentage ?? 0) < 100
    }
    if (activeTab === 'completed') {
      return path.progressPercentage === 100
    }
    if (activeTab === 'recommended') {
      return recommendedPaths.some(r => r.id === path.id)
    }
    return true
  })

  // Start lesson
  const startLesson = async (lesson: Lesson) => {
    if (!currentUserId || !selectedPath) return

    try {
      await fetch(`/api/learning-paths/${selectedPath.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          userId: currentUserId,
          status: 'in_progress',
          progress: 0
        })
      })

      setSelectedLesson({ ...lesson, progress: { ...lesson.progress!, status: 'in_progress', progress: 0 } })
      setCurrentContentIndex(0)
      setIsLessonDialogOpen(true)
      fetchPaths()
    } catch {
      toast.error('فشل في بدء الدرس')
    }
  }

  // Complete lesson
  const completeLesson = async (score: number = 100) => {
    if (!currentUserId || !selectedPath || !selectedLesson) return

    try {
      await fetch(`/api/learning-paths/${selectedPath.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          userId: currentUserId,
          status: 'completed',
          progress: 100,
          score
        })
      })

      const earnedXP = Math.round((selectedPath.xpReward || 100) / selectedPath.totalLessons)
      setUserXP(prev => prev + earnedXP)

      toast.success(`أحسنت! تم إكمال الدرس وحصلت على ${earnedXP} نقطة`)
      setIsLessonDialogOpen(false)
      setSelectedLesson(null)
      fetchPaths()
    } catch {
      toast.error('فشل في تحديث التقدم')
    }
  }

  // Enroll in path
  const enrollInPath = (path: LearningPath) => {
    if (path.lessons.length > 0) {
      startLesson(path.lessons[0])
    } else {
      toast.info('لا توجد دروس في هذا المسار حالياً')
    }
  }

  // حساب الإحصائيات
  const stats = useMemo(() => ({
    totalPaths: paths.length,
    inProgress: paths.filter(p => (p.progressPercentage ?? 0) > 0 && (p.progressPercentage ?? 0) < 100).length,
    completed: paths.filter(p => p.progressPercentage === 100).length,
    totalLessons: paths.reduce((sum, p) => sum + p.totalLessons, 0),
    totalWords: paths.reduce((sum, p) => sum + p.totalWords, 0),
    averageProgress: paths.length > 0
      ? Math.round(paths.reduce((sum, p) => sum + (p.progressPercentage ?? 0), 0) / paths.length)
      : 0
  }), [paths])

  // تنسيق الوقت
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Route className="w-7 h-7 text-emerald-500" />
            مسارات التعلم
          </h2>
          <p className="text-gray-500 text-sm">تعلم بطريقة منظمة مع مسارات متسلسلة وممنهجة</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white">
            <Zap className="w-5 h-5" />
            <span className="font-bold">{userXP}</span>
            <span className="text-sm opacity-80">XP</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 rounded-xl text-white">
            <Flame className="w-5 h-5" />
            <span className="font-bold">{dailyStreak}</span>
            <span className="text-sm opacity-80">يوم</span>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.info('قريباً - إنشاء مسار جديد')}>
            <Plus className="w-4 h-4 mr-2" />
            مسار جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'المسارات المتاحة', value: stats.totalPaths, icon: Route, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'قيد التعلم', value: stats.inProgress, icon: Clock, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'مكتملة', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'إجمالي الدروس', value: stats.totalLessons, icon: BookOpen, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
          { label: 'إجمالي الكلمات', value: stats.totalWords, icon: Target, color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30' },
          { label: 'متوسط التقدم', value: `${stats.averageProgress}%`, icon: TrendingUp, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", stat.color)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* المسارات الموصى بها */}
      {recommendedPaths.length > 0 && activeTab === 'all' && (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-l from-emerald-400 to-cyan-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">مسارات موصى بها لك</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedPaths.map((path) => (
                <motion.div
                  key={path.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 cursor-pointer"
                  onClick={() => {
                    setSelectedPath(path)
                    setIsPathDialogOpen(true)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{path.icon || '📚'}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{path.titleAr || path.title}</h4>
                      <p className="text-xs text-gray-500">{path.totalWords} كلمة • {path.estimatedDays} يوم</p>
                    </div>
                    <Badge className={levelConfig[path.level]?.color}>
                      {levelConfig[path.level]?.label}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {[
            { id: 'all', label: 'الكل', icon: Layers },
            { id: 'in-progress', label: 'قيد التعلم', icon: Clock },
            { id: 'completed', label: 'مكتملة', icon: CheckCircle2 },
            { id: 'recommended', label: 'موصى بها', icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ابحث في المسارات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-emerald-100 text-emerald-700" : ""}
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-full"
                  >
                    الكل
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                      className="rounded-full"
                    >
                      <cat.icon className="w-4 h-4 mr-1" />
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paths Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredPaths.map((path, index) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-0"
                  onClick={() => {
                    setSelectedPath(path)
                    setIsPathDialogOpen(true)
                  }}
                >
                  <div
                    className="h-20 relative"
                    style={{ background: `linear-gradient(135deg, ${path.color}20, ${path.color}40)` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{path.icon || '📚'}</span>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{path.titleAr || path.title}</h3>
                          {path.titleAr && (
                            <p className="text-xs text-gray-500">{path.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={levelConfig[path.level]?.color || 'bg-gray-100'}>
                          {levelConfig[path.level]?.label || path.level}
                        </Badge>
                        {path.certificates && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Award className="w-3 h-3 mr-1" />
                            شهادة
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 min-h-[40px]">
                      {path.descriptionAr || path.description}
                    </p>

                    {path.skills && path.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {path.skills.slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {(path.progressPercentage ?? 0) > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>التقدم</span>
                          <span className="font-medium text-emerald-600">{path.progressPercentage}%</span>
                        </div>
                        <Progress value={path.progressPercentage} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {path.lessons.length} درس
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {path.estimatedDays} يوم
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {path.totalWords} كلمة
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <span className="text-xs text-gray-600 dark:text-gray-400">مكافأة الإكمال</span>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">{path.xpReward || 100}</span>
                        <span className="text-xs">XP</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant={(path.progressPercentage ?? 0) > 0 ? 'outline' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation()
                        if ((path.progressPercentage ?? 0) === 0) {
                          enrollInPath(path)
                        } else {
                          setSelectedPath(path)
                          setIsPathDialogOpen(true)
                        }
                      }}
                    >
                      {(path.progressPercentage ?? 0) === 0 ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          ابدأ التعلم
                        </>
                      ) : (path.progressPercentage ?? 0) === 100 ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          مكتمل
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          استمر
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredPaths.length === 0 && (
            <div className="col-span-full">
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">
                    {searchQuery ? 'لا توجد نتائج مطابقة' : 'لا توجد مسارات'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Path Detail Dialog */}
      <Dialog open={isPathDialogOpen} onOpenChange={setIsPathDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPath && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                    style={{ background: `linear-gradient(135deg, ${selectedPath.color}20, ${selectedPath.color}40)` }}
                  >
                    {selectedPath.icon || '📚'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl">{selectedPath.titleAr || selectedPath.title}</DialogTitle>
                      <Badge className={levelConfig[selectedPath.level]?.color}>
                        {levelConfig[selectedPath.level]?.label}
                      </Badge>
                    </div>
                    {selectedPath.titleAr && (
                      <p className="text-sm text-gray-500">{selectedPath.title}</p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedPath.descriptionAr || selectedPath.description}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Progress Overview */}
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="h-1 bg-gradient-to-l from-emerald-400 to-cyan-500" />
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{selectedPath.progressPercentage}%</div>
                        <div className="text-xs text-gray-500">التقدم الكلي</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedPath.completedLessons || 0}</div>
                        <div className="text-xs text-gray-500">دروس مكتملة</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{selectedPath.inProgressLessons || 0}</div>
                        <div className="text-xs text-gray-500">قيد التعلم</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedPath.lessons.length}</div>
                        <div className="text-xs text-gray-500">إجمالي الدروس</div>
                      </div>
                    </div>
                    <Progress value={selectedPath.progressPercentage} className="h-3" />
                  </CardContent>
                </Card>

                {/* Skills & Rewards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPath.skills && selectedPath.skills.length > 0 && (
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-500" />
                          المهارات المكتسبة
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPath.skills.map((skill, i) => (
                            <Badge key={i} variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-500" />
                        المكافآت
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">نقاط الخبرة</span>
                          <div className="flex items-center gap-1 text-amber-600">
                            <Zap className="w-4 h-4" />
                            <span className="font-bold">{selectedPath.xpReward || 100}</span>
                          </div>
                        </div>
                        {selectedPath.certificates && (
                          <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-gray-400">شهادة إتمام</span>
                            <Award className="w-5 h-5 text-purple-500" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lessons List */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    الدروس ({selectedPath.lessons.length})
                  </h4>
                  {selectedPath.lessons.length === 0 ? (
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-8 text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-50" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">لا توجد دروس في هذا المسار</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {selectedPath.lessons.map((lesson, index) => (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-4 rounded-xl border transition-all cursor-pointer",
                            lesson.progress?.status === 'completed'
                              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                              : lesson.progress?.status === 'in_progress'
                              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300"
                          )}
                          onClick={() => startLesson(lesson)}
                        >
                          <div className="flex items-start gap-4">
                            {/* Status Icon */}
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              lesson.progress?.status === 'completed'
                                ? "bg-emerald-500 text-white"
                                : lesson.progress?.status === 'in_progress'
                                ? "bg-amber-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                            )}>
                              {lesson.progress?.status === 'completed' ? (
                                <Check className="w-5 h-5" />
                              ) : lesson.progress?.status === 'in_progress' ? (
                                <Play className="w-4 h-4" />
                              ) : (
                                <span className="font-medium">{index + 1}</span>
                              )}
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {lesson.titleAr || lesson.title}
                                </h5>
                                <Badge variant="outline" className={cn(
                                  "text-xs",
                                  lesson.difficulty === 'easy' && "border-emerald-300 text-emerald-600",
                                  lesson.difficulty === 'medium' && "border-amber-300 text-amber-600",
                                  lesson.difficulty === 'hard' && "border-rose-300 text-rose-600"
                                )}>
                                  {lesson.difficulty === 'easy' ? 'سهل' : lesson.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                                </Badge>
                              </div>
                              {lesson.titleAr && (
                                <p className="text-xs text-gray-500 mb-1">{lesson.title}</p>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                                {lesson.descriptionAr || lesson.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.duration} دقيقة
                                </span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {lesson.wordCount} كلمة
                                </span>
                                <span className="flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  {lesson.content.length} محتوى
                                </span>
                              </div>
                            </div>

                            {/* Action */}
                            {lesson.progress?.status === 'completed' ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <Check className="w-3 h-3 mr-1" />
                                مكتمل
                              </Badge>
                            ) : lesson.progress?.status === 'in_progress' ? (
                              <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                                استمر
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost">
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
          {selectedLesson && (
            <>
              <DialogHeader className="shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsLessonDialogOpen(false)}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                      <DialogTitle>{selectedLesson.titleAr || selectedLesson.title}</DialogTitle>
                      {selectedLesson.titleAr && (
                        <p className="text-sm text-gray-500">{selectedLesson.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      selectedLesson.difficulty === 'easy' && "border-emerald-300 text-emerald-600",
                      selectedLesson.difficulty === 'medium' && "border-amber-300 text-amber-600",
                      selectedLesson.difficulty === 'hard' && "border-rose-300 text-rose-600"
                    )}>
                      {selectedLesson.difficulty === 'easy' ? 'سهل' : selectedLesson.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVocabulary(!showVocabulary)}
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      المفردات
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-hidden flex gap-4 pt-4">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Content Navigation */}
                  <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
                    {selectedLesson.content.map((content, index) => {
                      const config = contentTypeConfig[content.type]
                      return (
                        <button
                          key={content.id}
                          onClick={() => setCurrentContentIndex(index)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap",
                            currentContentIndex === index
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                          )}
                        >
                          <config.icon className="w-4 h-4" />
                          <span className="text-sm">{content.titleAr}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Content Display */}
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {selectedLesson.content[currentContentIndex] && (
                        <motion.div
                          key={currentContentIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          {(() => {
                            const content = selectedLesson.content[currentContentIndex]
                            const config = contentTypeConfig[content.type]

                            switch (content.type) {
                              case 'video':
                                return (
                                  <Card className="border-0 shadow-md overflow-hidden">
                                    {/* Visual Lesson Header */}
                                    <div className="aspect-video bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
                                      {/* Animated Background Elements */}
                                      <div className="absolute inset-0">
                                        <motion.div
                                          className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                          transition={{ duration: 4, repeat: Infinity }}
                                        />
                                        <motion.div
                                          className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
                                          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                                          transition={{ duration: 5, repeat: Infinity }}
                                        />
                                      </div>

                                      {/* Main Content */}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center text-white px-8">
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", duration: 0.8 }}
                                          >
                                            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                                              <Play className="w-12 h-12 text-white" />
                                            </div>
                                          </motion.div>
                                          <h2 className="text-2xl font-bold mb-2">{content.titleAr}</h2>
                                          <p className="text-white/80 mb-4">{content.content}</p>
                                          <Badge className="bg-white/20 text-white border-white/30">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatDuration(content.duration)}
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Play Button Overlay */}
                                      <motion.button
                                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all group"
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => {
                                          // تشغيل النطق الصوتي للمحتوى
                                          if ('speechSynthesis' in window && content.content) {
                                            const utterance = new SpeechSynthesisUtterance(content.content)
                                            utterance.lang = 'en-US'
                                            window.speechSynthesis.speak(utterance)
                                          }
                                        }}
                                      >
                                        <motion.div
                                          className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.95 }}
                                        >
                                          <Volume2 className="w-8 h-8 text-emerald-600" />
                                        </motion.div>
                                      </motion.button>
                                    </div>

                                    {/* Key Points */}
                                    <CardContent className="p-6">
                                      <div className="flex items-center gap-2 mb-4">
                                        <Lightbulb className="w-5 h-5 text-amber-500" />
                                        <h4 className="font-medium text-gray-900 dark:text-white">النقاط الرئيسية</h4>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        {content.content.split(',').slice(0, 4).map((point, i) => (
                                          <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                            onClick={() => {
                                              if ('speechSynthesis' in window) {
                                                const utterance = new SpeechSynthesisUtterance(point.trim())
                                                utterance.lang = 'en-US'
                                                window.speechSynthesis.speak(utterance)
                                              }
                                            }}
                                          >
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                              <Volume2 className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{point.trim()}</span>
                                          </motion.div>
                                        ))}
                                      </div>

                                      {content.notes && (
                                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                          <p className="text-sm text-amber-700 dark:text-amber-400">
                                            <Lightbulb className="w-4 h-4 inline mr-1" />
                                            {content.notes}
                                          </p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )

                              case 'text':
                                return (
                                  <Card className="border-0 shadow-md">
                                    <CardContent className="p-6">
                                      <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <div
                                          className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                          dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br/>').replace(/## (.*)/g, '<h2 class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">$1</h2>').replace(/### (.*)/g, '<h3 class="font-medium text-gray-900 dark:text-white mt-3 mb-1">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\|(.+)\|/g, (match) => `<span class="inline-block px-2">${match}</span>`) }}
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>
                                )

                              case 'audio':
                                return (
                                  <Card className="border-0 shadow-md">
                                    <CardContent className="p-6">
                                      <div className="text-center mb-6">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
                                          <Headphones className="w-10 h-10 text-white" />
                                        </div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{content.titleAr}</h3>
                                        <p className="text-sm text-gray-500">{formatDuration(content.duration)}</p>
                                      </div>

                                      {/* Audio Player */}
                                      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                                        <div className="flex items-center justify-center gap-4">
                                          <Button variant="ghost" size="icon">
                                            <SkipBack className="w-5 h-5" />
                                          </Button>
                                          <Button
                                            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-violet-600"
                                            onClick={() => setIsPlaying(!isPlaying)}
                                          >
                                            {isPlaying ? (
                                              <Pause className="w-6 h-6" />
                                            ) : (
                                              <Play className="w-6 h-6 mr-[-4px]" />
                                            )}
                                          </Button>
                                          <Button variant="ghost" size="icon">
                                            <SkipForward className="w-5 h-5" />
                                          </Button>
                                        </div>

                                        <div className="mt-4">
                                          <Progress value={35} className="h-1" />
                                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>1:23</span>
                                            <span>{formatDuration(content.duration)}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {content.transcription && (
                                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">النص</h4>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">{content.transcription}</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )

                              case 'quiz':
                                return (
                                  <Card className="border-0 shadow-md">
                                    <CardContent className="p-6">
                                      <div className="text-center mb-6">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                                          <HelpCircle className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{content.titleAr}</h3>
                                      </div>

                                      <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                          <p className="font-medium text-gray-900 dark:text-white mb-4">
                                            ما معنى كلمة "Hello"؟
                                          </p>
                                          <div className="grid grid-cols-2 gap-3">
                                            {['مرحباً', 'وداعاً', 'شكراً', 'من فضلك'].map((option, i) => (
                                              <Button
                                                key={i}
                                                variant="outline"
                                                className="h-auto py-3 justify-start"
                                              >
                                                {option}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )

                              case 'practice':
                                return (
                                  <Card className="border-0 shadow-md">
                                    <CardContent className="p-6">
                                      <div className="text-center mb-6">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                                          <PenTool className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{content.titleAr}</h3>
                                      </div>

                                      <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">اكتب الترجمة الصحيحة:</p>
                                          <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">"Good morning"</p>
                                          <Input placeholder="اكتب الترجمة هنا..." className="text-lg" />
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )

                              default:
                                return (
                                  <Card className="border-0 shadow-md">
                                    <CardContent className="p-6 text-center">
                                      <p className="text-gray-500">نوع المحتوى غير معروف</p>
                                    </CardContent>
                                  </Card>
                                )
                            }
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentContentIndex(Math.max(0, currentContentIndex - 1))}
                      disabled={currentContentIndex === 0}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      السابق
                    </Button>
                    <span className="text-sm text-gray-500">
                      {currentContentIndex + 1} / {selectedLesson.content.length}
                    </span>
                    {currentContentIndex < selectedLesson.content.length - 1 ? (
                      <Button onClick={() => setCurrentContentIndex(currentContentIndex + 1)}>
                        التالي
                        <ChevronLeft className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500"
                        onClick={() => completeLesson()}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        إكمال الدرس
                      </Button>
                    )}
                  </div>
                </div>

                {/* Vocabulary Sidebar */}
                <AnimatePresence>
                  {showVocabulary && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 320, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="border-r pr-4 overflow-hidden"
                    >
                      <Card className="border-0 shadow-md h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-500" />
                            مفردات الدرس ({selectedLesson.vocabulary.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-y-auto max-h-[60vh]">
                          <div className="space-y-3">
                            {selectedLesson.vocabulary.map((vocab, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-bold text-gray-900 dark:text-white">{vocab.word}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6"
                                    onClick={() => {
                                      if ('speechSynthesis' in window) {
                                        const utterance = new SpeechSynthesisUtterance(vocab.word)
                                        utterance.lang = 'en-US'
                                        window.speechSynthesis.speak(utterance)
                                      }
                                    }}
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{vocab.translation}</p>
                                <p className="text-xs text-gray-500 mt-1">{vocab.pronunciation}</p>
                                <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded text-xs">
                                  <p className="text-gray-600 dark:text-gray-300">{vocab.example}</p>
                                  <p className="text-gray-500 mt-1">{vocab.exampleTranslation}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Badges Section */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1 bg-gradient-to-l from-purple-400 to-pink-500" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              الشارات والإنجازات
            </h3>
            <Badge variant="outline">{userBadges.length}/8</Badge>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {[
              { id: 'first_path', name: 'البداية', icon: Rocket, color: 'text-blue-500' },
              { id: 'streak_7', name: 'الاستمرارية', icon: Flame, color: 'text-orange-500' },
              { id: 'streak_30', name: 'الإصرار', icon: Fire, color: 'text-red-500' },
              { id: 'words_100', name: 'مئة كلمة', icon: BookOpen, color: 'text-emerald-500' },
              { id: 'words_500', name: 'خمسمئة', icon: Library, color: 'text-purple-500' },
              { id: 'perfect_score', name: 'الكمال', icon: Trophy, color: 'text-amber-500' },
              { id: 'speed_learner', name: 'السرعة', icon: Zap, color: 'text-yellow-500' },
              { id: 'master', name: 'الخبير', icon: Crown, color: 'text-violet-500' }
            ].map((badge) => {
              const isUnlocked = userBadges.includes(badge.id)
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: isUnlocked ? 1.1 : 1 }}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl transition-all cursor-pointer",
                    isUnlocked
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
                      : "bg-gray-100 dark:bg-gray-800 opacity-50"
                  )}
                >
                  <badge.icon className={cn("w-6 h-6 mb-1", isUnlocked ? badge.color : "text-gray-400")} />
                  <span className={cn("text-xs text-center", isUnlocked ? "text-gray-700 dark:text-gray-300" : "text-gray-400")}>
                    {badge.name}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
