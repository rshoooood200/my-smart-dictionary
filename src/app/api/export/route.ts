import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - تصدير جميع البيانات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // جلب جميع بيانات المستخدم
    const [words, categories, notes, stories, customLists] = await Promise.all([
      db.word.findMany({
        where: { userId },
        include: {
          category: true,
          sentences: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.category.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      db.note.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      db.story.findMany({
        where: { userId },
        include: {
          storyWords: true,
          questions: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.customList.findMany({
        where: { userId },
        include: {
          listWords: {
            include: {
              word: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (format === 'csv') {
      // تنسيق CSV - الكلمات فقط
      const headers = ['الكلمة', 'الترجمة', 'النطق', 'التعريف', 'النوع', 'المستوى', 'التصنيف', 'تاريخ الإضافة'];
      const rows = words.map(w => [
        w.word,
        w.translation,
        w.pronunciation || '',
        w.definition || '',
        w.partOfSpeech || '',
        w.level,
        w.category?.nameAr || w.category?.name || '',
        w.createdAt.toLocaleDateString('ar-SA'),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="vocabulary.csv"',
        },
      });
    }

    if (format === 'markdown') {
      // تنسيق Markdown
      let md = '# قاموس الكلمات الإنجليزية\n\n';
      md += `**تاريخ التصدير:** ${new Date().toLocaleDateString('ar-SA')}\n\n`;
      md += `**إجمالي الكلمات:** ${words.length}\n\n`;
      md += '---\n\n';

      for (const w of words) {
        md += `## ${w.word}\n`;
        md += `- **الترجمة:** ${w.translation}\n`;
        if (w.pronunciation) md += `- **النطق:** ${w.pronunciation}\n`;
        if (w.definition) md += `- **التعريف:** ${w.definition}\n`;
        if (w.partOfSpeech) md += `- **النوع:** ${w.partOfSpeech}\n`;
        md += `- **المستوى:** ${w.level}\n`;
        if (w.category) md += `- **التصنيف:** ${w.category.nameAr || w.category.name}\n`;
        
        if (w.sentences.length > 0) {
          md += '\n**أمثلة:**\n';
          for (const s of w.sentences) {
            md += `- ${s.sentence} (*${s.translation}*)\n`;
          }
        }
        md += '\n---\n\n';
      }

      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="vocabulary.md"',
        },
      });
    }

    // JSON format (default) - تصدير شامل لجميع البيانات
    const exportData = {
      words: words.map(w => ({
        word: w.word,
        translation: w.translation,
        pronunciation: w.pronunciation,
        definition: w.definition,
        partOfSpeech: w.partOfSpeech,
        level: w.level,
        isLearned: w.isLearned,
        isFavorite: w.isFavorite,
        reviewCount: w.reviewCount,
        correctCount: w.correctCount,
        lastReviewedAt: w.lastReviewedAt?.toISOString(),
        nextReviewAt: w.nextReviewAt?.toISOString(),
        easeFactor: w.easeFactor,
        interval: w.interval,
        repetitions: w.repetitions,
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
        examples: JSON.parse(w.examples || '[]'),
        arabicMeaning: w.arabicMeaning,
        context: w.context,
        synonyms: JSON.parse(w.synonyms || '[]'),
        antonyms: JSON.parse(w.antonyms || '[]'),
        usageNotes: w.usageNotes,
        categoryName: w.category?.name || null,
        categoryNameAr: w.category?.nameAr || null,
        categoryColor: w.category?.color || null,
        sentences: w.sentences.map(s => ({
          sentence: s.sentence,
          translation: s.translation,
          isAiGenerated: s.isAiGenerated,
        })),
      })),
      categories: categories.map(c => ({
        name: c.name,
        nameAr: c.nameAr,
        color: c.color,
        icon: c.icon,
      })),
      notes: notes.map(n => ({
        title: n.title,
        content: n.content,
        color: n.color,
        isPinned: n.isPinned,
        isArchived: n.isArchived,
        tags: JSON.parse(n.tags || '[]'),
      })),
      stories: stories.map(s => ({
        title: s.title,
        titleAr: s.titleAr,
        content: s.content,
        contentAr: s.contentAr,
        level: s.level,
        readingTime: s.readingTime,
        wordCount: s.wordCount,
        isFavorite: s.isFavorite,
        isRead: s.isRead,
        storyWords: s.storyWords.map(sw => ({
          wordPosition: sw.position,
        })),
        questions: s.questions.map(q => ({
          question: q.question,
          questionAr: q.questionAr,
          options: JSON.parse(q.options || '[]'),
          answer: q.answer,
        })),
      })),
      customLists: customLists.map(cl => ({
        name: cl.name,
        nameAr: cl.nameAr,
        description: cl.description,
        color: cl.color,
        icon: cl.icon,
        isPublic: cl.isPublic,
        tags: JSON.parse(cl.tags || '[]'),
        listWords: cl.listWords.map(lw => ({
          wordText: lw.word?.word || '',
          order: lw.order,
          notes: lw.notes,
        })),
      })),
    };

    return NextResponse.json({
      success: true,
      data: exportData,
      exportedAt: new Date().toISOString(),
      totals: {
        words: words.length,
        categories: categories.length,
        notes: notes.length,
        stories: stories.length,
        customLists: customLists.length,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تصدير البيانات' },
      { status: 500 }
    );
  }
}
