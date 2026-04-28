import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب جميع الكلمات مع الفلترة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const isLearned = searchParams.get('isLearned');
    const isFavorite = searchParams.get('isFavorite');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    
    if (search) {
      where.OR = [
        { word: { contains: search } },
        { translation: { contains: search } },
      ];
    }
    
    // ✅ إصلاح: تجاهل "all" كقيمة للفلتر
    if (category && category !== 'all') {
      where.categoryId = category;
    }
    
    // ✅ إصلاح: تجاهل "all" كقيمة للفلتر
    if (level && level !== 'all') {
      where.level = level;
    }
    
    if (isLearned !== null && isLearned !== '') {
      where.isLearned = isLearned === 'true';
    }
    
    if (isFavorite !== null && isFavorite !== '') {
      where.isFavorite = isFavorite === 'true';
    }

    const words = await db.word.findMany({
      where,
      include: {
        category: true,
        sentences: true,
      },
      orderBy: {
        [sortBy]: order,
      },
    });

    // تحويل البيانات لإضافة جميع الحقول كـ arrays/objects
    const wordsWithArrays = words.map(w => ({
      ...w,
      synonyms: JSON.parse(w.synonyms || '[]'),
      antonyms: JSON.parse(w.antonyms || '[]'),
      examples: JSON.parse(w.examples || '[]'),
      verbForms: {
        past: w.verbPast,
        pastParticiple: w.verbPastParticiple,
        present: w.verbPresent,
        gerund: w.verbGerund,
        thirdPerson: w.verbThirdPerson,
      },
      nounForms: {
        singular: w.nounSingular,
        plural: w.nounPlural,
        countable: w.nounCountable,
      },
      adjectiveForms: {
        comparative: w.adjComparative,
        superlative: w.adjSuperlative,
        adverb: w.adjAdverb,
      },
    }));

    return NextResponse.json({ success: true, data: wordsWithArrays });
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch words' },
      { status: 500 }
    );
  }
}

// POST - إضافة كلمة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      word, translation, pronunciation, definition, 
      partOfSpeech, level, categoryId, sentences, 
      synonyms, antonyms, usageNotes, userId,
      // حقول جديدة
      verbForms, nounForms, adjectiveForms,
      examples, arabicMeaning, context
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من البيانات المطلوبة
    if (!word || !word.trim()) {
      return NextResponse.json(
        { success: false, error: 'الكلمة مطلوبة' },
        { status: 400 }
      );
    }

    if (!translation || !translation.trim()) {
      return NextResponse.json(
        { success: false, error: 'الترجمة مطلوبة' },
        { status: 400 }
      );
    }

    const wordText = word.toLowerCase().trim();

    // التحقق من وجود الكلمة مسبقاً لنفس المستخدم
    const existingWord = await db.word.findFirst({
      where: { word: wordText, userId },
    });

    if (existingWord) {
      return NextResponse.json(
        { success: false, error: 'هذه الكلمة موجودة مسبقاً!' },
        { status: 400 }
      );
    }

    // تنظيف categoryId - إذا كان فارغاً اجعله null
    const cleanCategoryId = categoryId && categoryId.trim() !== '' ? categoryId.trim() : null;

    // إنشاء الكلمة مع جميع الحقول
    const newWord = await db.word.create({
      data: {
        word: wordText,
        translation: translation.trim(),
        pronunciation: pronunciation?.trim() || null,
        definition: definition?.trim() || null,
        partOfSpeech: partOfSpeech || null,
        level: level || 'beginner',
        categoryId: cleanCategoryId,
        userId,
        synonyms: JSON.stringify(synonyms || []),
        antonyms: JSON.stringify(antonyms || []),
        usageNotes: usageNotes?.trim() || null,
        // حقول جديدة - تصريفات الفعل
        verbPast: verbForms?.past?.trim() || null,
        verbPastParticiple: verbForms?.pastParticiple?.trim() || null,
        verbPresent: verbForms?.present?.trim() || null,
        verbGerund: verbForms?.gerund?.trim() || null,
        verbThirdPerson: verbForms?.thirdPerson?.trim() || null,
        // حقول جديدة - تصريفات الاسم
        nounSingular: nounForms?.singular?.trim() || null,
        nounPlural: nounForms?.plural?.trim() || null,
        nounCountable: nounForms?.countable ?? true,
        // حقول جديدة - تصريفات الصفة
        adjComparative: adjectiveForms?.comparative?.trim() || null,
        adjSuperlative: adjectiveForms?.superlative?.trim() || null,
        adjAdverb: adjectiveForms?.adverb?.trim() || null,
        // حقول جديدة - معلومات إضافية
        examples: JSON.stringify(examples || []),
        arabicMeaning: arabicMeaning?.trim() || null,
        context: context?.trim() || null,
        // إضافة الجمل إن وجدت
        ...(sentences && sentences.length > 0 && {
          sentences: {
            createMany: {
              data: sentences.map((s: { sentence: string; translation: string }) => ({
                sentence: s.sentence,
                translation: s.translation,
                isAiGenerated: true,
              })),
            },
          },
        }),
      },
      include: {
        category: true,
        sentences: true,
      },
    });

    // تحديث XP للمستخدم
    await db.user.update({
      where: { id: userId },
      data: { 
        xp: { increment: 5 },
        lastActiveDate: new Date(),
      },
    });

    // تحديث الإحصائيات اليومية
    await updateDailyStats(userId, 'wordsAdded');

    return NextResponse.json({ 
      success: true, 
      data: {
        ...newWord,
        synonyms: JSON.parse(newWord.synonyms || '[]'),
        antonyms: JSON.parse(newWord.antonyms || '[]'),
        examples: JSON.parse(newWord.examples || '[]'),
        verbForms: {
          past: newWord.verbPast,
          pastParticiple: newWord.verbPastParticiple,
          present: newWord.verbPresent,
          gerund: newWord.verbGerund,
          thirdPerson: newWord.verbThirdPerson,
        },
        nounForms: {
          singular: newWord.nounSingular,
          plural: newWord.nounPlural,
          countable: newWord.nounCountable,
        },
        adjectiveForms: {
          comparative: newWord.adjComparative,
          superlative: newWord.adjSuperlative,
          adverb: newWord.adjAdverb,
        },
      }
    });
  } catch (error) {
    console.error('Error creating word:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إضافة الكلمة' },
      { status: 500 }
    );
  }
}

// دالة لتحديث الإحصائيات اليومية
async function updateDailyStats(userId: string, field: 'wordsAdded' | 'wordsReviewed' | 'correctAnswers' | 'wrongAnswers') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    await db.dailyStats.upsert({
      where: { userId_date: { userId, date: today } },
      update: { [field]: { increment: 1 } },
      create: { 
        userId,
        date: today,
        [field]: 1 
      },
    });
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}
