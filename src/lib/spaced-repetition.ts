/**
 * Spaced Repetition System - SM-2 Algorithm
 * نظام التكرار المتباعد - خوارزمية SM-2
 * 
 * هذه الخوارزمية تساعد في تحديد أفضل وقت لمراجعة كل كلمة
 * بناءً على أداء المستخدم في المراجعات السابقة
 */

export interface ReviewResult {
  /** الفاصل الزمني الجديد بالأيام */
  interval: number;
  /** عامل السهولة الجديد */
  easeFactor: number;
  /** عدد التكرارات المتتالية الصحيحة */
  repetitions: number;
  /** تاريخ المراجعة القادمة */
  nextReviewDate: Date;
  /** هل الكلمة أصبحت متقنة */
  isMastered: boolean;
}

export interface SM2Params {
  /** عامل السهولة الحالي (1.3 - 3.0+) */
  easeFactor: number;
  /** الفاصل الزمني الحالي بالأيام */
  interval: number;
  /** عدد التكرارات المتتالية الصحيحة */
  repetitions: number;
}

/**
 * جودة الإجابة حسب خوارزمية SM-2
 * 0-5 حيث:
 * 0 = لا أتذكر إطلاقاً
 * 1 = تذكرت خطأ
 * 2 = تذكرت بصعوبة بالغة
 * 3 = تذكرت بصعوبة
 * 4 = تذكرت بسهولة
 * 5 = تذكرت بسهولة بالغة
 */
export type AnswerQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * حساب الفاصل الزمني الجديد باستخدام خوارزمية SM-2
 */
export function calculateSM2(params: SM2Params, quality: AnswerQuality): ReviewResult {
  let { easeFactor, interval, repetitions } = params;
  
  // حساب عامل السهولة الجديد
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  // حساب التكرارات والفاصل الزمني
  if (quality < 3) {
    // إذا كانت الإجابة خاطئة أو صعبة جداً، نعيد البدء
    repetitions = 0;
    interval = 1; // نراجع غداً
  } else {
    // إجابة صحيحة
    repetitions += 1;
    
    if (repetitions === 1) {
      interval = 1; // أول مراجعة: يوم واحد
    } else if (repetitions === 2) {
      interval = 6; // ثاني مراجعة: 6 أيام
    } else {
      // الفاصل الزمني = الفاصل السابق × عامل السهولة
      interval = Math.round(interval * newEaseFactor);
    }
  }
  
  // تحديد تاريخ المراجعة القادمة
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  // تحديد إذا كانت الكلمة متقنة
  // تعتبر متقنة إذا تمت مراجعتها 5 مرات متتالية بشكل صحيح
  const isMastered = repetitions >= 5 && newEaseFactor >= 2.5;
  
  return {
    interval,
    easeFactor: Math.round(newEaseFactor * 100) / 100, // تقريب لرقمين عشريين
    repetitions,
    nextReviewDate,
    isMastered
  };
}

/**
 * الحصول على الكلمات التي تحتاج مراجعة اليوم
 */
export function getWordsForReviewToday<T extends { 
  nextReviewAt: Date | string | null;
  easeFactor: number;
  isLearned: boolean;
}>(words: T[]): T[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return words.filter(word => {
    // إذا لم تكن هناك مراجعة مجدولة، نراجعها اليوم
    if (!word.nextReviewAt) return true;
    
    const nextReview = new Date(word.nextReviewAt);
    // نراجع الكلمات التي حل موعدها أو فات
    return nextReview <= now;
  });
}

/**
 * الحصول على الكلمات المرجعة متأخرة (أكثر من يوم)
 */
export function getOverdueWords<T extends { 
  nextReviewAt: Date | string | null;
}>(words: T[]): T[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return words.filter(word => {
    if (!word.nextReviewAt) return false;
    const nextReview = new Date(word.nextReviewAt);
    return nextReview < yesterday;
  });
}

/**
 * تقدير مستوى الصعوبة بناءً على إجابة المستخدم
 */
export function estimateDifficulty(
  correctCount: number,
  totalReviews: number,
  averageResponseTime?: number
): 'easy' | 'medium' | 'hard' {
  if (totalReviews === 0) return 'medium';
  
  const accuracy = correctCount / totalReviews;
  
  if (accuracy >= 0.9) return 'easy';
  if (accuracy >= 0.6) return 'medium';
  return 'hard';
}

/**
 * حساب الفاصل الزمني الأولي بناءً على مستوى الكلمة
 */
export function getInitialInterval(level: string): number {
  switch (level) {
    case 'beginner':
      return 1; // مراجعة يومية في البداية
    case 'intermediate':
      return 3; // مراجعة كل 3 أيام
    case 'advanced':
      return 7; // مراجعة أسبوعية
    default:
      return 1;
  }
}

/**
 * الحصول على أولوية المراجعة (للترتيب)
 */
export function getReviewPriority<T extends { 
  nextReviewAt: Date | string | null;
  easeFactor: number;
  repetitions: number;
}>(word: T): number {
  // أولوية أعلى للكلمات:
  // 1. التي فات موعدها
  // 2. ذات عامل سهولة منخفض (أصعب)
  // 3. تكرارات أقل
  
  const now = new Date();
  let priority = 0;
  
  // إضافة أولوية للكلمات المتأخرة
  if (word.nextReviewAt) {
    const nextReview = new Date(word.nextReviewAt);
    const daysOverdue = (now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24);
    priority += Math.max(0, daysOverdue) * 10;
  } else {
    priority += 5; // كلمات جديدة
  }
  
  // عكس عامل السهولة (كلما قل، زادت الأولوية)
  priority += (3 - (word.easeFactor || 2.5)) * 5;
  
  // تقليل الأولوية للكلمات المتكررة كثيراً
  priority -= (word.repetitions || 0) * 0.5;
  
  return Math.max(0, priority);
}

/**
 * ترتيب الكلمات للمراجعة حسب الأولوية
 */
export function sortWordsByPriority<T extends { 
  id: string;
  nextReviewAt: Date | string | null;
  easeFactor: number;
  repetitions: number;
}>(words: T[]): T[] {
  return [...words].sort((a, b) => {
    return getReviewPriority(b) - getReviewPriority(a);
  });
}

/**
 * حساب الإحصائيات المتوقعة للمراجعة
 */
export function predictReviewStats(words: Array<{
  nextReviewAt: Date | string | null;
  interval: number;
}>): {
  today: number;
  tomorrow: number;
  thisWeek: number;
  total: number;
} {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  let today = 0;
  let tomorrowCount = 0;
  let thisWeek = 0;
  
  words.forEach(word => {
    if (!word.nextReviewAt) {
      today++;
      return;
    }
    
    const nextReview = new Date(word.nextReviewAt);
    
    if (nextReview <= now) {
      today++;
    } else if (nextReview <= tomorrow) {
      tomorrowCount++;
    } else if (nextReview <= nextWeek) {
      thisWeek++;
    }
  });
  
  return {
    today,
    tomorrow: tomorrowCount,
    thisWeek,
    total: words.length
  };
}

/**
 * مستويات الاستجابة للمراجعة
 */
export const RESPONSE_QUALITY = {
  /** لا أتذكر إطلاقاً */
  COMPLETE_BLACKOUT: 0 as AnswerQuality,
  /** تذكرت خطأ */
  INCORRECT: 1 as AnswerQuality,
  /** تذكرت بصعوبة بالغة */
  VERY_HARD: 2 as AnswerQuality,
  /** تذكرت بصعوبة */
  HARD: 3 as AnswerQuality,
  /** تذكرت بسهولة */
  EASY: 4 as AnswerQuality,
  /** تذكرت بسهولة بالغة */
  VERY_EASY: 5 as AnswerQuality,
};

/**
 * وصف مستوى الاستجابة
 */
export const QUALITY_DESCRIPTIONS: Record<AnswerQuality, { ar: string; en: string }> = {
  0: { ar: 'لا أتذكر', en: 'Complete blackout' },
  1: { ar: 'إجابة خاطئة', en: 'Incorrect response' },
  2: { ar: 'صعب جداً', en: 'Very difficult' },
  3: { ar: 'صعب', en: 'Difficult' },
  4: { ar: 'سهل', en: 'Easy' },
  5: { ar: 'سهل جداً', en: 'Very easy' },
};
