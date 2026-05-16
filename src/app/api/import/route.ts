import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// POST - استيراد جميع البيانات
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const body = await request.json();
    const { data } = body;

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, error: 'البيانات غير صالحة' },
        { status: 400 }
      );
    }

    const results = {
      categories: { imported: 0, skipped: 0, errors: [] as string[] },
      words: { imported: 0, skipped: 0, errors: [] as string[] },
      notes: { imported: 0, skipped: 0, errors: [] as string[] },
      stories: { imported: 0, skipped: 0, errors: [] as string[] },
      customLists: { imported: 0, skipped: 0, errors: [] as string[] },
    };

    // خريطة لتتبع معرفات التصنيفات القديمة إلى الجديدة
    const categoryIdMap = new Map<string, string>();

    // 1. استيراد التصنيفات أولاً (لأن الكلمات تعتمد عليها)
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        try {
          if (!cat.name) {
            results.categories.errors.push('تصنيف بدون اسم');
            continue;
          }

          // التحقق من وجود تصنيف بنفس الاسم
          const existing = await db.category.findFirst({
            where: { userId, name: cat.name },
          });

          if (existing) {
            // إذا كان التصنيف موجوداً، نحفظ معرفه للإشارة
            categoryIdMap.set(cat.name, existing.id);
            results.categories.skipped++;
            continue;
          }

          const newCategory = await db.category.create({
            data: {
              name: cat.name,
              nameAr: cat.nameAr || null,
              color: cat.color || '#10B981',
              icon: cat.icon || null,
              userId,
            },
          });

          categoryIdMap.set(cat.name, newCategory.id);
          results.categories.imported++;
        } catch (err) {
          results.categories.errors.push(`خطأ في استيراد التصنيف: ${cat.name || 'غير معروف'}`);
        }
      }
    }

    // 2. استيراد الكلمات
    if (Array.isArray(data.words)) {
      for (const w of data.words) {
        try {
          if (!w.word || !w.translation) {
            results.words.errors.push('كلمة بدون نص أو ترجمة');
            continue;
          }

          // التحقق من التكرار باستخدام findFirst (وليس findUnique لأن القيد مركب)
          const existing = await db.word.findFirst({
            where: { userId, word: w.word.toLowerCase().trim() },
          });

          if (existing) {
            results.words.skipped++;
            continue;
          }

          // تحديد معرف التصنيف
          let categoryId: string | null = null;
          if (w.categoryName && categoryIdMap.has(w.categoryName)) {
            categoryId = categoryIdMap.get(w.categoryName)!;
          } else if (w.categoryId && categoryIdMap.has(w.categoryId)) {
            categoryId = categoryIdMap.get(w.categoryId)!;
          }

          // استخراج أشكال الفعل والاسم والصفة
          const verbForms = w.verbForms || {};
          const nounForms = w.nounForms || {};
          const adjectiveForms = w.adjectiveForms || {};

          const newWord = await db.word.create({
            data: {
              word: w.word.toLowerCase().trim(),
              translation: w.translation.trim(),
              pronunciation: w.pronunciation?.trim() || null,
              definition: w.definition?.trim() || null,
              partOfSpeech: w.partOfSpeech || null,
              level: w.level || 'beginner',
              isLearned: w.isLearned || false,
              isFavorite: w.isFavorite || false,
              reviewCount: w.reviewCount || 0,
              correctCount: w.correctCount || 0,
              lastReviewedAt: w.lastReviewedAt ? new Date(w.lastReviewedAt) : null,
              nextReviewAt: w.nextReviewAt ? new Date(w.nextReviewAt) : null,
              easeFactor: w.easeFactor || 2.5,
              interval: w.interval || 0,
              repetitions: w.repetitions || 0,
              verbPast: verbForms.past || null,
              verbPastParticiple: verbForms.pastParticiple || null,
              verbPresent: verbForms.present || null,
              verbGerund: verbForms.gerund || null,
              verbThirdPerson: verbForms.thirdPerson || null,
              nounSingular: nounForms.singular || null,
              nounPlural: nounForms.plural || null,
              nounCountable: nounForms.countable !== undefined ? nounForms.countable : true,
              adjComparative: adjectiveForms.comparative || null,
              adjSuperlative: adjectiveForms.superlative || null,
              adjAdverb: adjectiveForms.adverb || null,
              examples: JSON.stringify(w.examples || []),
              arabicMeaning: w.arabicMeaning || null,
              context: w.context || null,
              synonyms: JSON.stringify(w.synonyms || []),
              antonyms: JSON.stringify(w.antonyms || []),
              usageNotes: w.usageNotes || null,
              categoryId,
              userId,
            },
          });

          // استيراد الجمل المرتبطة بالكلمة
          if (Array.isArray(w.sentences) && w.sentences.length > 0) {
            for (const s of w.sentences) {
              if (s.sentence && s.translation) {
                await db.sentence.create({
                  data: {
                    sentence: s.sentence,
                    translation: s.translation,
                    wordId: newWord.id,
                    isAiGenerated: s.isAiGenerated || false,
                  },
                });
              }
            }
          }

          results.words.imported++;
        } catch (err) {
          results.words.errors.push(`خطأ في استيراد: ${w.word || 'غير معروف'}`);
          console.error('Error importing word:', err);
        }
      }
    }

    // 3. استيراد الملاحظات
    if (Array.isArray(data.notes)) {
      for (const n of data.notes) {
        try {
          if (!n.title || !n.content) {
            results.notes.errors.push('ملاحظة بدون عنوان أو محتوى');
            continue;
          }

          await db.note.create({
            data: {
              title: n.title,
              content: n.content,
              color: n.color || '#10B981',
              isPinned: n.isPinned || false,
              isArchived: n.isArchived || false,
              tags: JSON.stringify(n.tags || []),
              userId,
            },
          });

          results.notes.imported++;
        } catch (err) {
          results.notes.errors.push(`خطأ في استيراد الملاحظة: ${n.title || 'غير معروف'}`);
        }
      }
    }

    // 4. استيراد القصص
    if (Array.isArray(data.stories)) {
      for (const s of data.stories) {
        try {
          if (!s.title || !s.content) {
            results.stories.errors.push('قصة بدون عنوان أو محتوى');
            continue;
          }

          const newStory = await db.story.create({
            data: {
              title: s.title,
              titleAr: s.titleAr || null,
              content: s.content,
              contentAr: s.contentAr || null,
              level: s.level || 'beginner',
              readingTime: s.readingTime || 0,
              wordCount: s.wordCount || 0,
              isFavorite: s.isFavorite || false,
              isRead: s.isRead || false,
              userId,
            },
          });

          // استيراد أسئلة القصة
          if (Array.isArray(s.questions) && s.questions.length > 0) {
            for (const q of s.questions) {
              await db.storyQuestion.create({
                data: {
                  storyId: newStory.id,
                  question: q.question || '',
                  questionAr: q.questionAr || null,
                  options: JSON.stringify(q.options || []),
                  answer: q.answer || 0,
                },
              });
            }
          }

          results.stories.imported++;
        } catch (err) {
          results.stories.errors.push(`خطأ في استيراد القصة: ${s.title || 'غير معروف'}`);
        }
      }
    }

    // 5. استيراد القوائم المخصصة
    if (Array.isArray(data.customLists)) {
      for (const cl of data.customLists) {
        try {
          if (!cl.name) {
            results.customLists.errors.push('قائمة بدون اسم');
            continue;
          }

          const newList = await db.customList.create({
            data: {
              name: cl.name,
              nameAr: cl.nameAr || null,
              description: cl.description || null,
              color: cl.color || '#10B981',
              icon: cl.icon || null,
              isPublic: cl.isPublic || false,
              tags: JSON.stringify(cl.tags || []),
              userId,
            },
          });

          // استيراد كلمات القائمة (نبحث عن الكلمات المطابقة في قاعدة البيانات)
          if (Array.isArray(cl.listWords) && cl.listWords.length > 0) {
            for (const lw of cl.listWords) {
              if (lw.wordText) {
                const matchingWord = await db.word.findFirst({
                  where: { userId, word: lw.wordText.toLowerCase().trim() },
                });
                if (matchingWord) {
                  await db.customListWord.create({
                    data: {
                      listId: newList.id,
                      wordId: matchingWord.id,
                      order: lw.order || 0,
                      notes: lw.notes || null,
                    },
                  }).catch(() => {}); // تجاهل الأخطاء (مثل التكرار)
                }
              }
            }
          }

          results.customLists.imported++;
        } catch (err) {
          results.customLists.errors.push(`خطأ في استيراد القائمة: ${cl.name || 'غير معروف'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم الاستيراد بنجاح',
      results,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في استيراد البيانات' },
      { status: 500 }
    );
  }
}
