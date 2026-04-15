import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/ai'

interface Word {
  id: string
  word: string
  translation: string
  reviewCount: number
  correctCount: number
  isLearned: boolean
  isFavorite: boolean
  level: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, words, stats, categories, history } = body

    // إنشاء سياق للمساعد
    const context = buildContext(words, stats, categories)
    
    // إنشاء الـ prompt
    const systemPrompt = `أنت مساعد ذكي لتطبيق تعلم المفردات الإنجليزية "قاموسي الذكي".
    
مهمتك:
- مساعدة المستخدم في تخطيط مراجعاته
- اقتراح كلمات للتعلم
- تحليل تقدمه وتقديم نصائح
- الإجابة على أسئلته المتعلقة بالتعلم

سياق المستخدم:
${context}

القواعد:
- أجب بالعربية دائماً
- كن مختصراً ومفيداً
- قدم نصائح عملية
- استخدم الإيموجي بشكل معتدل
- إذا سأل عن كلمات محددة، اذكرها من القائمة المتاحة`

    // Build conversation context
    let conversationContext = ''
    if (history && history.length > 0) {
      conversationContext = history.slice(-5).map((msg: Message) => 
        `${msg.role === 'user' ? 'المستخدم' : 'المساعد'}: ${msg.content}`
      ).join('\n')
    }
    
    const prompt = `${conversationContext ? `سجل المحادثة:\n${conversationContext}\n\n` : ''}رسالة المستخدم: ${message}`

    try {
      const assistantResponse = await callGemini(prompt, systemPrompt)
      
      // استخراج اقتراحات من الرد
      const suggestions = extractSuggestions(message, words)

      return NextResponse.json({
        response: assistantResponse,
        suggestions
      })
    } catch (aiError) {
      console.log('AI Error, using fallback:', aiError)
      
      // استخدام الرد الافتراضي
      const fallbackResponse = generateFallbackResponse(message, words, stats)
      const suggestions = extractSuggestions(message, words)

      return NextResponse.json({
        response: fallbackResponse,
        suggestions
      })
    }
  } catch (error) {
    console.error('AI Assistant Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

function buildContext(words: Word[], stats: any, categories: any[]): string {
  const totalWords = words?.length || 0
  const learnedWords = words?.filter(w => w.isLearned).length || 0
  const needReview = words?.filter(w => {
    if (!w.reviewCount) return false
    const successRate = w.correctCount / w.reviewCount
    return successRate < 0.7
  }).length || 0
  
  const strongestWords = words
    ?.filter(w => w.reviewCount > 2)
    .sort((a, b) => (b.correctCount / b.reviewCount) - (a.correctCount / a.reviewCount))
    .slice(0, 3) || []
    
  const weakestWords = words
    ?.filter(w => w.reviewCount > 0)
    .sort((a, b) => (a.correctCount / a.reviewCount) - (b.correctCount / b.reviewCount))
    .slice(0, 3) || []

  return `
- إجمالي الكلمات: ${totalWords}
- الكلمات المحفوظة: ${learnedWords}
- كلمات تحتاج مراجعة: ${needReview}
- سلسلة التعلم: ${stats?.streak || 0} يوم
- المستوى: ${stats?.level || 1}
- أقوى الكلمات: ${strongestWords.map(w => w.word).join(', ') || 'لا توجد'}
- أضعف الكلمات: ${weakestWords.map(w => w.word).join(', ') || 'لا توجد'}
- التصنيفات: ${categories?.length || 0}
`
}

function generateFallbackResponse(query: string, words: Word[], stats: any): string {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('مراجعة') || lowerQuery.includes('review')) {
    const needReview = words?.filter(w => {
      if (!w.reviewCount) return false
      return (w.correctCount / w.reviewCount) < 0.7
    }) || []
    
    if (needReview.length > 0) {
      return `📚 لديك ${needReview.length} كلمات تحتاج مراجعة.

منها: ${needReview.slice(0, 3).map(w => `"${w.word}"`).join(', ')}

💡 نصيحة: راجع هذه الكلمات باستخدام تقنية التكرار المتباعد للحفاظ على التذكر طويل المدى.`
    }
    return '🎉 ممتاز! لا توجد كلمات تحتاج مراجعة حالياً. استمر في التعلم!'
  }
  
  if (lowerQuery.includes('تقدم') || lowerQuery.includes('progress') || lowerQuery.includes('حال')) {
    const total = words?.length || 0
    const learned = words?.filter(w => w.isLearned).length || 0
    const percentage = total > 0 ? Math.round((learned / total) * 100) : 0
    
    return `📈 تقرير التقدم:

📊 إحصائياتك:
• الكلمات المحفوظة: ${learned} من ${total} (${percentage}%)
• سلسلة التعلم: ${stats?.streak || 0} يوم متواصل
• المستوى: ${stats?.level || 1}

🎯 الهدف القادم: احفظ ${Math.min(learned + 10, total)} كلمة!`
  }
  
  if (lowerQuery.includes('نصيحة') || lowerQuery.includes('advice') || lowerQuery.includes('tip')) {
    const tips = [
      '💡 راجع الكلمات في نفس الوقت يومياً لتعزيز الذاكرة.',
      '🎯 استخدم الكلمات الجديدة في جمل للتذكر بشكل أفضل.',
      '📝 اكتب الكلمات الصعبة عدة مرات.',
      '🎧 استمع لنطق الكلمات وكررها بصوت عالٍ.',
      '📱 مارس الألعاب التعليمية لتعلم ممتع.',
      '⏰ أفضل وقت للمراجعة هو الصباح الباكر أو قبل النوم.'
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }
  
  if (lowerQuery.includes('صعب') || lowerQuery.includes('difficult') || lowerQuery.includes('ضعيف')) {
    const weakest = words
      ?.filter(w => w.reviewCount > 0)
      .sort((a, b) => (a.correctCount / a.reviewCount) - (b.correctCount / b.reviewCount))
      .slice(0, 5) || []
    
    if (weakest.length > 0) {
      return `🎯 الكلمات التي تحتاج تركيز:

${weakest.map((w, i) => `${i + 1}. ${w.word} - ${w.translation} (${Math.round((w.correctCount / w.reviewCount) * 100)}%)`).join('\n')}

💡 نصيحة: ركز على هذه الكلمات في مراجعاتك القادمة واستخدمها في جمل.`
    }
    return '👍 لا توجد كلمات صعبة حالياً. أنت تؤدي بشكل جيد!'
  }
  
  if (lowerQuery.includes('كلمات جديدة') || lowerQuery.includes('تعلم')) {
    const unlearned = words?.filter(w => !w.isLearned).slice(0, 5) || []
    
    if (unlearned.length > 0) {
      return `📚 كلمات مقترحة للتعلم:

${unlearned.map((w, i) => `${i + 1}. ${w.word} - ${w.translation}`).join('\n')}

🎯 حاول تعلم 5-10 كلمات جديدة يومياً للحصول على أفضل النتائج.`
    }
    return '🎉 أحسنت! لقد تعلمت جميع الكلمات المتاحة.'
  }
  
  if (lowerQuery.includes('سلسلة') || lowerQuery.includes('streak')) {
    const streak = stats?.streak || 0
    if (streak > 0) {
      return `🔥 سلسلة التعلم: ${streak} يوم متواصل!

${streak >= 7 ? '🏆 إنجاز رائع! استمر في الحفاظ على السلسلة.' : '💪 أنت في الطريق الصحيح! استمر لتصل إلى 7 أيام.'}

💡 حافظ على السلسلة بالمراجعة اليومية حتى لو كانت قصيرة.`
    }
    return '⏰ لم تبدأ سلسلة التعلم بعد. ابدأ اليوم بالمراجعة!'
  }
  
  // رد افتراضي
  return `🤖 أنا مساعدك الذكي! يمكنني مساعدتك في:

• 📊 تحليل تقدمك في التعلم
• 📚 اقتراح كلمات للمراجعة
• 💡 تقديم نصائح تعليمية
• 🎯 تحديد الكلمات الصعبة

اسألني أي سؤال!`
}

function extractSuggestions(query: string, words: Word[]): string[] {
  const suggestions: string[] = []
  const lowerQuery = query.toLowerCase()
  
  if (!lowerQuery.includes('مراجعة')) {
    suggestions.push('كلمات تحتاج مراجعة')
  }
  if (!lowerQuery.includes('تقدم') && !lowerQuery.includes('حال')) {
    suggestions.push('كيف تقدمي؟')
  }
  if (!lowerQuery.includes('نصيحة')) {
    suggestions.push('نصيحة للتعلم')
  }
  
  return suggestions
}
