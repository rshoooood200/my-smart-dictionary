import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/ai'

// POST - AI Learning Chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      message, 
      context, 
      userId, 
      conversationHistory,
      learningLevel,
      weakWords,
      strongWords
    } = body

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Build context-aware system prompt
    const systemPrompt = `أنت معلم لغة إنجليزية ذكي ومفيد. مهمتك مساعدة المتعلمين العرب في تحسين مهاراتهم.

معلومات المتعلم:
- المستوى: ${learningLevel || 'beginner'}
- الكلمات الضعيفة: ${weakWords?.slice(0, 10).join(', ') || 'غير محدد'}
- الكلمات القوية: ${strongWords?.slice(0, 10).join(', ') || 'غير محدد'}

قواعد التفاعل:
1. أجب بالعربية والإنجليزية معاً
2. استخدم كلمات بسيطة ومناسبة للمستوى
3. قدم أمثلة عملية وواضحة
4. صحح الأخطاء بلطف وشرح القواعد
5. شجع المتعلم وامنحه نصائح مفيدة
6. إذا طلب المستخدم تدريبات، قدم له تمارين تفاعلية
7. استخدم الرموز التعبيرية لجعل التعلم ممتعاً 📚✨

أنواع المساعدة المقدمة:
- شرح المفردات والمعاني
- تصحيح الجمل والأخطاء
- شرح قواعد اللغة
- تقديم تمارين تفاعلية
- محادثات بالإنجليزية
- نصائح للتعلم الفعال`

    // Build conversation context
    let conversationContext = ''
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = conversationHistory.slice(-10).map((msg: { role: string; content: string }) => 
        `${msg.role === 'user' ? 'المتعلم' : 'المعلم'}: ${msg.content}`
      ).join('\n')
    }
    
    const prompt = `${conversationContext ? `سجل المحادثة:\n${conversationContext}\n\n` : ''}رسالة المتعلم: ${message}`

    const aiMessage = await callGemini(prompt, systemPrompt)

    // Extract suggested words to learn
    const suggestedWords = extractWords(aiMessage)

    return NextResponse.json({ 
      message: aiMessage,
      suggestedWords,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI Chat error:', error)
    
    // Fallback response
    const fallbackResponses = [
      "أنا هنا لمساعدتك في تعلم الإنجليزية! 📚 ماذا تريد أن تتعلم اليوم؟",
      "يمكنني مساعدتك في:\n• تعلم كلمات جديدة 📝\n• تصحيح الجمل ✏️\n• شرح القواعد 📖\n• محادثة بالإنجليزية 💬",
      "رائع! دعني أساعدك. اكتب لي جملة بالإنجليزية وسأصححها لك، أو اسألني عن أي كلمة تريد تعلمها! ✨"
    ]
    
    return NextResponse.json({ 
      message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      suggestedWords: [],
      timestamp: new Date().toISOString(),
      fallback: true
    })
  }
}

// Helper function to extract English words
function extractWords(text: string): string[] {
  const words = text.match(/\b[a-zA-Z]+\b/g) || []
  const uniqueWords = [...new Set(words)]
  return uniqueWords.filter(w => w.length > 2).slice(0, 5)
}
