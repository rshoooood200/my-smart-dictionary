import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - تصدير الكلمات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const words = await db.word.findMany({
      include: {
        category: true,
        sentences: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // تنسيق CSV
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
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
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

    // JSON format (default)
    return NextResponse.json({
      success: true,
      data: words,
      exportedAt: new Date().toISOString(),
      total: words.length,
    });
  } catch (error) {
    console.error('Error exporting words:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تصدير الكلمات' },
      { status: 500 }
    );
  }
}

// POST - استيراد الكلمات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { words, skipDuplicates = true } = body;

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير صالحة' },
        { status: 400 }
      );
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const wordData of words) {
      try {
        const { word, translation, pronunciation, definition, partOfSpeech, level, categoryId } = wordData;

        if (!word || !translation) {
          results.errors.push(`كلمة بدون نص أو ترجمة`);
          continue;
        }

        // التحقق من التكرار
        if (skipDuplicates) {
          const existing = await db.word.findUnique({
            where: { word: word.toLowerCase().trim() },
          });
          if (existing) {
            results.skipped++;
            continue;
          }
        }

        await db.word.create({
          data: {
            word: word.toLowerCase().trim(),
            translation: translation.trim(),
            pronunciation: pronunciation?.trim() || null,
            definition: definition?.trim() || null,
            partOfSpeech: partOfSpeech || null,
            level: level || 'beginner',
            categoryId: categoryId || null,
          },
        });

        results.imported++;
      } catch (err) {
        results.errors.push(`خطأ في استيراد: ${wordData.word || 'غير معروف'}`);
      }
    }

    // تحديث الإحصائيات
    if (results.imported > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await db.dailyStats.upsert({
        where: { date: today },
        update: { wordsAdded: { increment: results.imported } },
        create: { date: today, wordsAdded: results.imported },
      });
    }

    return NextResponse.json({
      success: true,
      message: `تم استيراد ${results.imported} كلمة، تم تخطي ${results.skipped} كلمة مكررة`,
      results,
    });
  } catch (error) {
    console.error('Error importing words:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في استيراد الكلمات' },
      { status: 500 }
    );
  }
}
