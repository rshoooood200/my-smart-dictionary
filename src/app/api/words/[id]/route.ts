import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWordOwnership, unauthorizedResponse } from '@/lib/auth-helpers';

// GET - جلب كلمة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const word = await db.word.findUnique({
      where: { id },
      include: {
        category: true,
        sentences: true,
      },
    });

    if (!word) {
      return NextResponse.json(
        { success: false, error: 'الكلمة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من الملكية
    if (userId && word.userId !== userId) {
      return unauthorizedResponse();
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...word,
        synonyms: JSON.parse(word.synonyms || '[]'),
        antonyms: JSON.parse(word.antonyms || '[]'),
      }
    });
  } catch (error) {
    console.error('Error fetching word:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch word' },
      { status: 500 }
    );
  }
}

// PUT - تحديث كلمة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      userId,
      word, translation, pronunciation, definition, 
      partOfSpeech, level, categoryId, isLearned, isFavorite,
      synonyms, antonyms, usageNotes, reviewCount, correctCount,
      lastReviewedAt, nextReviewAt,
      // SM-2 fields
      easeFactor, interval, repetitions
    } = body;

    // التحقق من الملكية
    const existingWord = await verifyWordOwnership(id, userId);
    if (!existingWord) {
      return unauthorizedResponse();
    }

    const updatedWord = await db.word.update({
      where: { id },
      data: {
        ...(word && { word: word.toLowerCase().trim() }),
        ...(translation && { translation: translation.trim() }),
        ...(pronunciation !== undefined && { pronunciation: pronunciation?.trim() || null }),
        ...(definition !== undefined && { definition: definition?.trim() || null }),
        ...(partOfSpeech !== undefined && { partOfSpeech: partOfSpeech || null }),
        ...(level && { level }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(isLearned !== undefined && { isLearned }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(synonyms !== undefined && { synonyms: JSON.stringify(synonyms) }),
        ...(antonyms !== undefined && { antonyms: JSON.stringify(antonyms) }),
        ...(usageNotes !== undefined && { usageNotes: usageNotes?.trim() || null }),
        ...(reviewCount !== undefined && { reviewCount }),
        ...(correctCount !== undefined && { correctCount }),
        ...(lastReviewedAt !== undefined && { lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : null }),
        ...(nextReviewAt !== undefined && { nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : null }),
        // SM-2 fields
        ...(easeFactor !== undefined && { easeFactor }),
        ...(interval !== undefined && { interval }),
        ...(repetitions !== undefined && { repetitions }),
      },
      include: {
        category: true,
        sentences: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updatedWord,
        synonyms: JSON.parse(updatedWord.synonyms || '[]'),
        antonyms: JSON.parse(updatedWord.antonyms || '[]'),
      }
    });
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update word' },
      { status: 500 }
    );
  }
}

// DELETE - حذف كلمة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // التحقق من الملكية
    const existingWord = await verifyWordOwnership(id, userId || '');
    if (!existingWord) {
      return unauthorizedResponse();
    }

    await db.word.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الكلمة بنجاح' });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete word' },
      { status: 500 }
    );
  }
}
