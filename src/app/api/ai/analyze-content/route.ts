import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

interface ExtractedContent {
  quiz: {
    title: string
    titleAr: string
    questions: Array<{
      question: string
      questionAr: string
      options: string[]
      optionsAr: string[]
      correctAnswer: number
      explanation?: string
      explanationAr?: string
    }>
  }
  games: Array<{
    type: 'matching' | 'word_search' | 'fill_blank' | 'scramble'
    title: string
    titleAr: string
    data: any
  }>
  flashcards: Array<{
    word: string
    wordAr: string
    translation: string
    translationAr: string
    example?: string
    exampleAr?: string
  }>
  exercises: Array<{
    type: 'translation' | 'listening' | 'speaking' | 'writing'
    title: string
    titleAr: string
    instruction: string
    instructionAr: string
    content: any
  }>
}

async function analyzeContent(
  title: string,
  titleAr: string,
  description: string,
  category: string,
  targetAudience: 'kids' | 'adults'
): Promise<ExtractedContent> {
  const zai = await ZAI.create()

  const audiencePrompt = targetAudience === 'kids'
    ? `أنت معلم أطفال متخصص في تعليم اللغة الإنجليزية للأطفال من 5-14 سنة.
       استخدم لغة بسيطة وممتعة.
       اجعل الأسئلة والألعاب مناسبة للأطفال.
       استخدم الكلمات الأساسية والمفاهيم البسيطة.
       أضف الرموز التعبيرية والصور الذهنية الملونة.`
    : `أنت معلم متخصص في تعليم اللغة الإنجليزية للكبار.
       استخدم لغة احترافية ومتقدمة.
       ركز على المصطلحات المهنية والأكاديمية.
       اجعل المحتوى مناسباً للبيئة العملية والأكاديمية.`

  const prompt = `${audiencePrompt}

قم بتحليل محتوى الفيديو التعليمي التالي واستخرج محتوى تعليمي مناسب:

عنوان الفيديو: ${title}
العنوان بالعربي: ${titleAr}
الوصف: ${description}
التصنيف: ${category}

أرجع النتيجة بتنسيق JSON فقط (بدون أي نص إضافي) بالشكل التالي:
{
  "quiz": {
    "title": "Quiz title in English",
    "titleAr": "عنوان الاختبار بالعربي",
    "questions": [
      {
        "question": "Question in English",
        "questionAr": "السؤال بالعربي",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "optionsAr": ["الخيار 1", "الخيار 2", "الخيار 3", "الخيار 4"],
        "correctAnswer": 0,
        "explanation": "Explanation in English",
        "explanationAr": "الشرح بالعربي"
      }
    ]
  },
  "games": [
    {
      "type": "matching",
      "title": "Game title",
      "titleAr": "عنوان اللعبة",
      "data": {
        "pairs": [{"left": "word", "right": "translation"}]
      }
    }
  ],
  "flashcards": [
    {
      "word": "Word in English",
      "wordAr": "الكلمة بالعربي",
      "translation": "Translation/Meaning",
      "translationAr": "المعنى بالعربي",
      "example": "Example sentence",
      "exampleAr": "الجملة المثال بالعربي"
    }
  ],
  "exercises": [
    {
      "type": "translation",
      "title": "Exercise title",
      "titleAr": "عنوان التمرين",
      "instruction": "Instructions in English",
      "instructionAr": "التعليمات بالعربي",
      "content": {
        "sentences": [{"english": "sentence", "arabic": "الجملة"}]
      }
    }
  ]
}

قواعد مهمة:
1. أنشئ 5-10 أسئلة في الاختبار
2. أنشئ 2-3 ألعاب متنوعة (matching, fill_blank, scramble)
3. أنشئ 5-10 بطاقات تعليمية للمفردات المهمة
4. أنشئ 2-3 تمارين متنوعة
5. تأكد أن المحتوى مناسب للفئة المستهدفة
6. أرجع JSON صالح فقط بدون أي نص إضافي`

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'أنت مساعد ذكي متخصص في تحليل المحتوى التعليمي وإنشاء محتوى تفاعلي. تُرجع دائماً JSON صالح فقط بدون أي نص إضافي.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      thinking: { type: 'disabled' }
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('Empty response from AI')
    }

    // Extract JSON from response
    let jsonStr = response.trim()
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }
    
    const parsed = JSON.parse(jsonStr.trim()) as ExtractedContent
    return parsed
  } catch (error) {
    console.error('Error analyzing content:', error)
    
    // Return default content if AI fails
    return {
      quiz: {
        title: `Quiz: ${title}`,
        titleAr: `اختبار: ${titleAr}`,
        questions: [
          {
            question: `What did you learn from "${title}"?`,
            questionAr: `ماذا تعلمت من "${titleAr}"؟`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            optionsAr: ['الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د'],
            correctAnswer: 0
          }
        ]
      },
      games: [],
      flashcards: [],
      exercises: []
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, titleAr, description, descriptionAr, category, targetAudience } = body

    if (!videoId || !title) {
      return NextResponse.json({ error: 'Video ID and title are required' }, { status: 400 })
    }

    // Analyze content
    const descriptionText = description || descriptionAr || ''
    const extractedContent = await analyzeContent(
      title,
      titleAr || title,
      descriptionText,
      category || 'general',
      targetAudience || 'kids'
    )

    // Save extracted content to database
    const results = {
      quiz: null as any,
      games: [] as any[],
      flashcards: [] as any[],
      exercises: [] as any[]
    }

    // Save Quiz
    if (extractedContent.quiz.questions.length > 0) {
      try {
        const quiz = await db.kidsQuiz.create({
          data: {
            title: extractedContent.quiz.title,
            titleAr: extractedContent.quiz.titleAr,
            description: `Auto-generated quiz for: ${title}`,
            descriptionAr: `اختبار تم إنشاؤه تلقائياً لـ: ${titleAr || title}`,
            category: category || 'general',
            type: 'multiple_choice',
            difficulty: targetAudience === 'kids' ? 'easy' : 'medium',
            ageGroup: targetAudience === 'kids' ? '7-9' : null,
            xpReward: targetAudience === 'kids' ? 10 : 20,
            timeLimit: extractedContent.quiz.questions.length * 30,
            questions: JSON.stringify(extractedContent.quiz.questions),
            isActive: true,
            sourceVideoId: videoId
          }
        })
        results.quiz = quiz
      } catch (error) {
        console.error('Error saving quiz:', error)
      }
    }

    // Save Games
    for (const gameData of extractedContent.games) {
      try {
        const game = await db.kidsGame.create({
          data: {
            title: gameData.title,
            titleAr: gameData.titleAr,
            description: `Auto-generated game for: ${title}`,
            descriptionAr: `لعبة تم إنشاؤها تلقائياً لـ: ${titleAr || title}`,
            category: category || 'general',
            type: gameData.type,
            difficulty: targetAudience === 'kids' ? 'easy' : 'medium',
            ageGroup: targetAudience === 'kids' ? '7-9' : null,
            xpReward: targetAudience === 'kids' ? 15 : 25,
            config: JSON.stringify(gameData.data),
            isActive: true,
            sourceVideoId: videoId
          }
        })
        results.games.push(game)
      } catch (error) {
        console.error('Error saving game:', error)
      }
    }

    // Save Flashcards
    for (const cardData of extractedContent.flashcards) {
      try {
        const flashcard = await db.kidsFlashcard.create({
          data: {
            word: cardData.word,
            wordAr: cardData.wordAr,
            translation: cardData.translation,
            translationAr: cardData.translationAr,
            example: cardData.example,
            exampleAr: cardData.exampleAr,
            category: category || 'general',
            ageGroup: targetAudience === 'kids' ? '7-9' : null,
            isActive: true,
            sourceVideoId: videoId
          }
        })
        results.flashcards.push(flashcard)
      } catch (error) {
        console.error('Error saving flashcard:', error)
      }
    }

    // Save Exercises (as lessons)
    for (const exerciseData of extractedContent.exercises) {
      try {
        const exercise = await db.kidsExercise.create({
          data: {
            title: exerciseData.title,
            titleAr: exerciseData.titleAr,
            instruction: exerciseData.instruction,
            instructionAr: exerciseData.instructionAr,
            type: exerciseData.type,
            category: category || 'general',
            difficulty: targetAudience === 'kids' ? 'easy' : 'medium',
            ageGroup: targetAudience === 'kids' ? '7-9' : null,
            content: JSON.stringify(exerciseData.content),
            xpReward: targetAudience === 'kids' ? 5 : 10,
            isActive: true,
            sourceVideoId: videoId
          }
        })
        results.exercises.push(exercise)
      } catch (error) {
        console.error('Error saving exercise:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Content analyzed and saved successfully',
      results: {
        quizCount: results.quiz ? 1 : 0,
        gamesCount: results.games.length,
        flashcardsCount: results.flashcards.length,
        exercisesCount: results.exercises.length,
        quiz: results.quiz,
        games: results.games,
        flashcards: results.flashcards,
        exercises: results.exercises
      }
    })
  } catch (error) {
    console.error('Error in analyze-content API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - Check analysis status for a video
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Check if content has been extracted for this video
    const [quiz, games, flashcards, exercises] = await Promise.all([
      db.kidsQuiz.findFirst({ where: { sourceVideoId: videoId } }),
      db.kidsGame.findMany({ where: { sourceVideoId: videoId } }),
      db.kidsFlashcard.findMany({ where: { sourceVideoId: videoId } }),
      db.kidsExercise.findMany({ where: { sourceVideoId: videoId } })
    ])

    return NextResponse.json({
      analyzed: !!(quiz || games.length > 0 || flashcards.length > 0 || exercises.length > 0),
      counts: {
        quizzes: quiz ? 1 : 0,
        games: games.length,
        flashcards: flashcards.length,
        exercises: exercises.length
      }
    })
  } catch (error) {
    console.error('Error checking analysis status:', error)
    return NextResponse.json({ error: 'Failed to check analysis status' }, { status: 500 })
  }
}
